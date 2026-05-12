const { fal } = require("@fal-ai/client");

fal.config({ credentials: process.env.FAL_KEY });

async function test() {
  try {
    const result = await fal.subscribe("fal-ai/any-llm/vision", {
      input: {
        image_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2", // A portrait
        prompt: "Return JSON: {\"gender\":\"female\"}",
        model: "google/gemini-2.5-flash"
      }
    });
    console.log("Success any-llm:", JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Error body detail:", JSON.stringify(err.body?.detail, null, 2));
  }
}

test();
