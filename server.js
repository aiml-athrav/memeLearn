import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
// Removed GoogleGenAI import
import Meme from './models/Meme.js';

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

// POST Route for generating memes
app.post('/api/generate-meme', async (req, res) => {
  const { topic, template, language } = req.body;

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
        model: "deepseek-ai/deepseek-v4-pro",
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
    
    // Safely parse JSON from DeepSeek response
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse DeepSeek JSON response:", responseText, parseError);
      return res.status(502).json({ 
        error: "AI returned an invalid response format. Please try again.",
        rawResponse: responseText 
      });
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
    const memes = await Meme.find({}).sort({ createdAt: -1 });
    return res.json(memes);
  } catch (error) {
    console.error("Error fetching historical memes from database:", error);
    return res.status(500).json({ error: "Failed to load meme history." });
  }
});

// Start listening
app.listen(PORT, () => {
  console.log(`MemeLearn backend running successfully on http://localhost:${PORT}`);
});
