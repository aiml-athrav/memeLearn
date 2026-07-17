async function testAPI() {
  const topics = [
    { topic: "Newton's Third Law", template: "distracted-boyfriend" },
    { topic: "Photosynthesis", template: "expanding-brain" },
    { topic: "French Revolution", template: "drake" }
  ];

  for (const item of topics) {
    console.log(`\n=== Testing Topic: "${item.topic}" with Template: "${item.template}" ===`);
    try {
      const response = await fetch('http://localhost:5002/api/generate-meme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: item.topic,
          template: item.template
        })
      });
      if (response.ok) {
        const data = await response.json();
        console.log("Response:", JSON.stringify(data, null, 2));
      } else {
        console.error("Error response status:", response.status, await response.text());
      }
    } catch (err) {
      console.error("Request failed:", err);
    }
  }
}

testAPI();
