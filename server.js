import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
// Removed GoogleGenAI import
import Meme from './models/Meme.js';
import User from './models/User.js';
import crypto from 'crypto';

// Load environment variables from .env file
dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/memelearn';
mongoose.connect(mongoUri)
  .then(() => console.log(`Connected to MongoDB successfully`))
  .catch((err) => console.error('MongoDB connection error:', err));

const app = express();
const PORT = process.env.PORT || 5002;

// Enable CORS for frontend communication
app.use(cors());
app.use(express.json());

// Check DeepSeek API key
const hasDeepSeekKey = () => {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.warn("WARNING: DEEPSEEK_API_KEY is not defined in the environment. Server will run but API requests will fail.");
    return false;
  }
  return true;
};

const aiReady = hasDeepSeekKey();

// Helper function to search for a meme image on DuckDuckGo
async function fetchInternetMeme(topic) {
  try {
    const query = `${topic} meme`;
    const url = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
    const res1 = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    if (!res1.ok) return "";
    const html = await res1.text();
    const vqdMatch = html.match(/vqd=([^&'"]+)/);
    if (!vqdMatch) return "";
    const vqd = vqdMatch[1];

    const imageUrl = `https://duckduckgo.com/i.js?q=${encodeURIComponent(query)}&o=json&vqd=${vqd}`;
    const res2 = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://duckduckgo.com/"
      }
    });

    if (!res2.ok) return "";
    const data = await res2.json();
    if (data.results && data.results.length > 0) {
      return data.results[0].image;
    }
  } catch (error) {
    console.error("Error fetching meme from internet:", error);
  }
  return "";
}

// Helper function to hash password using SHA-256
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// Helper to escape newlines inside JSON string values before parsing
const escapeNewlinesInJSON = (jsonString) => {
  let insideString = false;
  let result = '';
  for (let i = 0; i < jsonString.length; i++) {
    const char = jsonString[i];
    if (char === '"' && (i === 0 || jsonString[i - 1] !== '\\')) {
      insideString = !insideString;
      result += char;
    } else if (char === '\n' && insideString) {
      result += '\\n';
    } else if (char === '\r' && insideString) {
      result += '\\r';
    } else {
      result += char;
    }
  }
  return result;
};

// POST Route for User Registration
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: "All fields (username, email, password) are required." });
  }

  try {
    const existingUser = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { username: username.trim() }] 
    });

    if (existingUser) {
      return res.status(400).json({ error: "Username or Email already registered." });
    }

    const hashedPassword = hashPassword(password);
    const newUser = new User({
      username: username.trim(),
      email: email.toLowerCase(),
      password: hashedPassword
    });

    await newUser.save();
    
    return res.status(201).json({
      message: "Registration successful!",
      token: `token_${newUser._id}`,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ error: "Internal server error during registration." });
  }
});

// POST Route for User Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const hashedPassword = hashPassword(password);
    if (user.password !== hashedPassword) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    return res.json({
      message: "Login successful!",
      token: `token_${user._id}`,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal server error during login." });
  }
});

// POST Route for Password Reset Verification
app.post('/api/forgot-password', async (req, res) => {
  const { username, email, newPassword } = req.body;
  if (!username || !email || !newPassword) {
    return res.status(400).json({ error: "Username, Email, and New Password are required." });
  }

  try {
    const user = await User.findOne({ 
      username: username.trim(),
      email: email.toLowerCase() 
    });

    if (!user) {
      return res.status(404).json({ error: "No user found with the matching username and email." });
    }

    const hashedPassword = hashPassword(newPassword);
    user.password = hashedPassword;
    await user.save();

    return res.json({ message: "Password reset successful! You can now log in." });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ error: "Internal server error during password reset." });
  }
});

// POST Route for generating memes
app.post('/api/generate-meme', async (req, res) => {
  const { topic, template, language, userId } = req.body;

  if (!topic || !template) {
    return res.status(400).json({ error: "Missing required fields: topic and template are required." });
  }

  if (!process.env.DEEPSEEK_API_KEY) {
    return res.status(500).json({ 
      error: "DeepSeek API key is not set. Please define DEEPSEEK_API_KEY in your .env file." 
    });
  }

  // Construct prompt as requested
  // Dynamically define prompt role-structure based on template
  let systemPrompt = "";
  if (template === "internet-search") {
    systemPrompt = `Explain the topic '${topic}' in a funny, Hinglish tone. Return ONLY valid JSON with a single key: "realExplanation"`;
  } else if (template === "distracted-boyfriend") {
    systemPrompt = `Explain the topic '${topic}' using the Distracted Boyfriend meme format with these exact roles:
    - label1 (Boyfriend, looking back): the WRONG intuitive misconception people commonly have about '${topic}'
    - label2 (Girlfriend, annoyed): the ACTUAL correct concept of '${topic}' being ignored
    - label3 (Other Girl passing by): what makes that misconception tempting/believable
    
    Keep it funny, Hinglish tone, each label under 8 words. Return ONLY valid JSON with keys:
    "label1", "label2", "label3", "realExplanation"`;
  } else if (template === "drake") {
    systemPrompt = `Explain the topic '${topic}' using the Drake meme format with these exact roles:
    - label1 (Drake Disliking/rejecting): the WRONG intuitive misconception or incorrect practice people have about '${topic}'
    - label2 (Drake Approving/pointing): the ACTUAL correct concept or best practice of '${topic}'
    
    Keep it funny, Hinglish tone, each label under 8 words. Return ONLY valid JSON with keys:
    "label1", "label2", "realExplanation"`;
  } else { // expanding-brain
    systemPrompt = `Explain the topic '${topic}' using the 4-stage Expanding Brain meme format:
    - label1 (Smallest brain): simplest / most basic understanding of '${topic}'
    - label2 (Normal brain): typical standard understanding of '${topic}'
    - label3 (Glowing brain): advanced/clever understanding of '${topic}'
    - label4 (Cosmic/enlightened brain): completely enlightened, ultimate cosmic realization of '${topic}' (can be funny/extreme)
    
    Keep it funny, Hinglish tone, each label under 8 words. Return ONLY valid JSON with keys:
    "label1", "label2", "label3", "label4", "realExplanation"`;
  }

  try {
    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "meta/llama-3.1-8b-instruct",
        messages: [
          {
            role: "user",
            content: systemPrompt
          }
        ],
        temperature: 0.6,
        top_p: 0.7,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`NVIDIA DeepSeek API error: ${response.status} - ${errText}`);
    }

    const responseData = await response.json();
    let responseText = responseData.choices[0].message.content.trim();

    // Strip thinking process tags if returning from deepseek-r1
    if (responseText.includes("</think>")) {
      responseText = responseText.split("</think>").pop().trim();
    }

    // Strip markdown code block markers if LLM wrapped JSON in it
    if (responseText.startsWith("```")) {
      responseText = responseText.replace(/^```[a-zA-Z]*\n/, "").replace(/\n```$/, "").trim();
    }
    
    // Safely parse JSON from LLM response with newlines sanitization and raw text fallback
    let parsedData;
    try {
      const sanitized = escapeNewlinesInJSON(responseText);
      parsedData = JSON.parse(sanitized);
    } catch (parseError) {
      console.warn("Failed to parse LLM JSON response, falling back to raw response text:", parseError);
      parsedData = {
        realExplanation: responseText
      };
    }

    // Fetch or overlay image
    let imageUrl = "";
    if (template === "internet-search") {
      imageUrl = await fetchInternetMeme(topic);
      if (!imageUrl) {
        imageUrl = 'https://via.placeholder.com/600x400?text=No+Meme+Found';
      }
    } else {
      // Construct Flask microservice payload mapping
      let overlayPayload = {
        templateName: template,
      };

      if (template === "distracted-boyfriend") {
        overlayPayload.panel1 = parsedData.label1 || "";
        overlayPayload.panel1_keyword = topic + " misconception";
        overlayPayload.panel2 = parsedData.label3 || "";
        overlayPayload.panel2_keyword = topic + " tempting";
        overlayPayload.panel3 = parsedData.label2 || "";
        overlayPayload.panel3_keyword = topic + " correct fact";
      } else if (template === "drake") {
        overlayPayload.panel1 = parsedData.label1 || "";
        overlayPayload.panel1_keyword = topic + " incorrect";
        overlayPayload.panel2 = parsedData.label2 || "";
        overlayPayload.panel2_keyword = topic + " correct";
      } else { // expanding-brain
        overlayPayload.panel1 = parsedData.label1 || "";
        overlayPayload.panel1_keyword = topic + " simple";
        overlayPayload.panel2 = parsedData.label2 || "";
        overlayPayload.panel2_keyword = topic + " intermediate";
        overlayPayload.panel3 = parsedData.label3 || "";
        overlayPayload.panel3_keyword = topic + " clever";
        overlayPayload.panel4 = parsedData.label4 || "";
        overlayPayload.panel4_keyword = topic + " cosmic";
      }

      // Make a request to the Python Flask microservice to overlay text on template image
      try {
        const overlayResponse = await fetch('http://localhost:5001/overlay-text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(overlayPayload),
        });

        if (overlayResponse.ok) {
          const overlayData = await overlayResponse.json();
          imageUrl = `/output/${overlayData.filename}`;
        } else {
          console.warn("Flask microservice returned error status:", overlayResponse.status);
        }
      } catch (overlayError) {
        console.error("Could not connect to Flask overlay microservice. Make sure it is running on port 5001.", overlayError);
      }
    }

    // Save generated meme to MongoDB database
    try {
      const newMeme = new Meme({
        userId: userId || null,
        topic,
        template,
        imageUrl: imageUrl || 'https://via.placeholder.com/600x400?text=No+Image',
        realExplanation: parsedData.realExplanation || ""
      });
      await newMeme.save();
      console.log(`Successfully saved meme for topic: "${topic}" to MongoDB.`);
    } catch (saveDbError) {
      console.error("Failed to save meme to database:", saveDbError);
    }

    // Return structured meme data along with the generated image URL back to the client
    const responsePayload = {
      topic,
      template,
      language: language || 'Hinglish',
      imageUrl: imageUrl,
      meme: {
        realExplanation: parsedData.realExplanation || ""
      }
    };

    if (template === "distracted-boyfriend") {
      responsePayload.meme.panel1 = parsedData.label1 || "";
      responsePayload.meme.panel2 = parsedData.label3 || "";
      responsePayload.meme.panel3 = parsedData.label2 || "";
    } else if (template === "drake") {
      responsePayload.meme.panel1 = parsedData.label1 || "";
      responsePayload.meme.panel2 = parsedData.label2 || "";
    } else if (template === "expanding-brain") {
      responsePayload.meme.panel1 = parsedData.label1 || "";
      responsePayload.meme.panel2 = parsedData.label2 || "";
      responsePayload.meme.panel3 = parsedData.label3 || "";
      responsePayload.meme.panel4 = parsedData.label4 || "";
    }

    return res.json(responsePayload);

  } catch (error) {
    console.error("Error generating meme via Gemini:", error);
    return res.status(error.status || 500).json({ 
      error: error.message || "An error occurred while generating the meme." 
    });
  }
});

// GET Route to fetch historical memes sorted by newest first
app.get('/api/history', async (req, res) => {
  try {
    const { userId } = req.query;
    const filter = userId ? { userId } : {};
    const memes = await Meme.find(filter).sort({ createdAt: -1 });
    return res.json(memes);
  } catch (error) {
    console.error("Error fetching historical memes from database:", error);
    return res.status(500).json({ error: "Failed to load meme history." });
  }
});

// POST Route to generate a multiple-choice question dynamically based on topic and explanation
app.post('/api/generate-quiz', async (req, res) => {
  const { topic, explanation } = req.body;
  if (!topic || !explanation) {
    return res.status(400).json({ error: "Missing required fields: topic and explanation are required." });
  }

  const systemPrompt = `Create a single multiple choice question to test a student's understanding of the topic '${topic}' based on this explanation: '${explanation}'.
  
  The question should be in simple Hinglish, funny, and have exactly 4 options. Return ONLY valid JSON with keys:
  "question" (string),
  "options" (array of 4 strings),
  "correctIndex" (integer index, 0 to 3)
  
  Example format:
  {
    "question": "Photosynthesis mein plant kis cheez ka use karke khana banata hai?",
    "options": ["Oxygen and nitrogen", "Sunlight, water, and CO2", "Soil and compost", "Burgers and fries"],
    "correctIndex": 1
  }`;

  try {
    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "meta/llama-3.1-8b-instruct",
        messages: [
          {
            role: "user",
            content: systemPrompt
          }
        ],
        temperature: 0.6,
        top_p: 0.7,
        max_tokens: 512
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`NVIDIA DeepSeek API error: ${response.status} - ${errText}`);
    }

    const responseData = await response.json();
    let responseText = responseData.choices[0].message.content.trim();

    // Clean up potential markdown wrapper from responseText
    if (responseText.startsWith("```")) {
      responseText = responseText.replace(/^```[a-zA-Z]*\n/, "").replace(/\n```$/, "").trim();
    }

    let parsedData;
    try {
      const sanitized = escapeNewlinesInJSON(responseText);
      parsedData = JSON.parse(sanitized);
    } catch (parseError) {
      console.error("Failed to parse quiz JSON:", parseError);
      parsedData = {
        question: `Test your knowledge on: ${topic}`,
        options: [
          "Option A (Read explanation to verify)",
          "Option B (Read explanation to verify)",
          "Option C (Read explanation to verify)",
          "Option D (Read explanation to verify)"
        ],
        correctIndex: 0
      };
    }
    return res.json(parsedData);
  } catch (error) {
    console.error("Error generating quiz:", error);
    return res.status(500).json({ error: "Failed to generate quiz. Please try again." });
  }
});

// Start listening
app.listen(PORT, () => {
  console.log(`MemeLearn backend running successfully on http://localhost:${PORT}`);
});
