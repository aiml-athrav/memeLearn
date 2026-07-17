import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { GoogleGenAI } from '@google/genai';
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

// Initialize Google Gen AI client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("WARNING: GEMINI_API_KEY is not defined in the environment. Server will run but API requests will fail.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

const ai = getGeminiClient();

// POST Route for generating memes
app.post('/api/generate-meme', async (req, res) => {
  const { topic, template, language } = req.body;

  if (!topic || !template) {
    return res.status(400).json({ error: "Missing required fields: topic and template are required." });
  }

  if (!ai) {
    return res.status(500).json({ 
      error: "Gemini API key is not set. Please define GEMINI_API_KEY in your .env file." 
    });
  }

  // Construct prompt as requested
  // Dynamically define prompt role-structure based on template
  let systemPrompt = "";
  if (template === "distracted-boyfriend") {
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
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: systemPrompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const responseText = response.text.trim();
    
    // Safely parse JSON from Gemini response
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse Gemini JSON response:", responseText, parseError);
      return res.status(502).json({ 
        error: "AI returned an invalid response format. Please try again.",
        rawResponse: responseText 
      });
    }

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
    let imageUrl = "";
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
    } else { // expanding-brain
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
