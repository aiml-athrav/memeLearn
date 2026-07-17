# 🧠🎭 MemeLearn: Learn with Memes!

<p align="center">
  <img src="https://img.shields.io/badge/Vite-8.x-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite Badge" />
  <img src="https://img.shields.io/badge/React-19.x-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Badge" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js Badge" />
  <img src="https://img.shields.io/badge/Python-Flask-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python Badge" />
  <img src="https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB Badge" />
</p>

---

**MemeLearn** is an AI-powered educational web application designed to help students, developers, and curious minds master and retain complex topics, programming concepts, or science facts. It dynamically converts educational content into relatable, funny memes using **Gemini AI** and a custom **Python Image Processing microservice**.

---

## 🚀 Key Features

* **🤖 AI Meme Generator:** Input any topic, and Gemini AI will curate custom, witty text tailored to standard meme templates.
* **🖼️ Multi-Template Support:** 
  * 🙅‍♂️ **Drake Hotline Bling** (Misconception vs. Correct Concept)
  * 🧑‍🤝‍🧑 **Distracted Boyfriend** (Tempting Misconception vs. Core Fact)
  * 🧠 **Expanding Brain** (4-stage escalation of understanding)
* **📚 Dashboard & History:** Keep track of your learning milestones and save your generated memes to MongoDB.
* **⚡ Modern UI/UX:** Stunning dark theme styling, glassmorphism, and responsive design powered by Tailwind CSS.

---

## 🛠️ Architecture Flow

```mermaid
graph TD
    A[React Client] -->|1. Input Topic & Template| B[Node API Server]
    B -->|2. Generate Structured Captions| C[Gemini AI]
    C -->|3. JSON Output| B
    B -->|4. Request Image Rendering| D[Flask Image Service]
    D -->|5. Overlay Text on Templates using PIL| D
    D -->|6. Saved Meme Image URL| B
    B -->|7. Save to Database| E[(MongoDB)]
    B -->|8. Render Finished Meme & Explanation| A
```

---

## 📋 Prerequisites

Ensure you have the following installed locally:
* **Node.js** 🟢 (v18.x or above)
* **Python** 🐍 (v3.8 or above)
* **MongoDB** 🍃 (Running locally on default port `27017`)

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/aiml-athrav/memeLearn.git
cd hackathon
```

### 2️⃣ Configure Environment Variables (`.env`)
Create a `.env` file in the root folder:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5002
MONGODB_URI=mongodb://127.0.0.1:27017/memelearn
```

### 3️⃣ Install Frontend & Node Backend Dependencies
```bash
npm install
```

### 4️⃣ Set up Python Virtual Environment & Flask Dependencies
```bash
cd image_service
python3 -m venv venv

# Activate Virtual Env
source venv/bin/activate  # On macOS/Linux
# venv\Scripts\activate.bat # On Windows CMD
# .\venv\Scripts\Activate.ps1 # On Windows PowerShell

# Install Packages
pip install -r requirements.txt
cd ..
```

---

## 🏃‍♂️ Running the Application

To run the full stack, you need to open **three separate terminals** and run these services:

### 🍃 Start MongoDB
Ensure MongoDB is running in the background.
```bash
# macOS
brew services start mongodb-community
```

### 🐍 Terminal 1: Flask Image Service (Port 5001)
```bash
cd image_service
source venv/bin/activate
python app.py
```

### 🟢 Terminal 2: Node.js API Server (Port 5002)
```bash
npm run server
```

### ⚡ Terminal 3: Vite Dev Server (Port 5173)
```bash
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser and start learning with memes! 🚀
