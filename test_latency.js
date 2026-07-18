import dotenv from 'dotenv';
dotenv.config();

async function testModelLatency(modelName) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  console.log(`Testing latency for: ${modelName}`);
  const start = Date.now();
  
  try {
    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: "user", content: "Say 'Hello' in Hinglish" }],
        max_tokens: 30
      }),
      signal: AbortSignal.timeout(10000) // 10s timeout
    });

    const duration = Date.now() - start;
    if (response.ok) {
      const data = await response.json();
      console.log(`Success! ${modelName} took ${duration}ms. Response: ${data.choices[0].message.content.trim()}`);
      return duration;
    } else {
      console.log(`Failed! ${modelName} took ${duration}ms. Status: ${response.status}`);
    }
  } catch (err) {
    console.log(`Error/Timeout for ${modelName} after ${Date.now() - start}ms: ${err.message}`);
  }
  return Infinity;
}

async function runTests() {
  const models = [
    "deepseek-ai/deepseek-v4-pro",
    "meta/llama-3.1-8b-instruct",
    "google/gemma-2-2b-it",
    "nvidia/llama-3.1-nemotron-51b-instruct"
  ];
  for (const model of models) {
    await testModelLatency(model);
    console.log("-----------------------------------");
  }
}

runTests();
