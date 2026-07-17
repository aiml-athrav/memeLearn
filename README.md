# MemeLearn 🧠🎭

MemeLearn is an AI-powered learning platform that helps you understand and retain complex topics, programming concepts, or science facts by transforming them into relatable, funny memes using **Gemini AI** and a **Python Image Processing microservice**.

---

## Architecture Overview

The project consists of three main components:
1. **Frontend (React + TypeScript + Vite):** Interactive dashboard to request memes, view learning concepts, and explore history.
2. **Backend Server (Node.js + Express):** Handles client requests, orchestrates calls to Gemini AI for captions, and interacts with MongoDB to store history.
3. **Image Overlay Service (Python + Flask):** Uses Pillow to dynamically wrap text and render captions onto meme templates (e.g., Drake, Distracted Boyfriend, Expanding Brain).

---

## Prerequisites

Before setting up, ensure you have the following installed on your machine:
* [Node.js](https://nodejs.org/) (v18+)
* [Python](https://www.python.org/) (v3.8+)
* [MongoDB](https://www.mongodb.com/) (Running locally on port `27017`)

---

## Installation & Setup

Follow these steps to set up the project on your local machine:

### 1. Clone the Repository
```bash
git clone <repository-url>
cd hackathon
```

### 2. Configure Environment Variables
Create a file named `.env` in the root directory and add the following variables:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5002
MONGODB_URI=mongodb://127.0.0.1:27017/memelearn
```
> **Note:** Never commit the `.env` file to version control. It is already included in `.gitignore`.

### 3. Install Backend & Frontend Dependencies
In the root directory, run:
```bash
npm install
```

### 4. Set up the Python Flask Microservice
Navigate to the `image_service` directory, set up a virtual environment, and install dependencies:
```bash
cd image_service

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows (Command Prompt):
# venv\Scripts\activate.bat
# On Windows (PowerShell):
# .\venv\Scripts\Activate.ps1

# Install requirements
pip install -r requirements.txt
```

---

## Running the Application

To run the application fully, you must start **MongoDB** and run **three separate servers** in individual terminal tabs/windows:

### Step 1: Start MongoDB
Ensure MongoDB is running locally.
* **macOS:** `brew services start mongodb-community`
* **Windows/Linux:** Start the MongoDB service via system services.

### Step 2: Start the Python Flask Image Service
From the root directory:
```bash
cd image_service
source venv/bin/activate
python app.py
```
*This service will run on **http://localhost:5001***

### Step 3: Start the Node.js API Server
Open a new terminal and run from the root directory:
```bash
npm run server
```
*This service will run on **http://localhost:5002***

### Step 4: Start the Vite Frontend Development Server
Open a new terminal and run from the root directory:
```bash
npm run dev
```
*This will open the web interface on **http://localhost:5173***

---

## Tech Stack
* **Frontend:** React, TypeScript, Vite, Tailwind CSS, Lucide icons
* **Backend:** Node.js, Express, Mongoose, `@google/genai` SDK
* **Image Processing:** Python, Flask, Pillow (PIL)
* **Database:** MongoDB
