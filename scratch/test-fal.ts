import { fal } from "@fal-ai/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env.production.local" });
if (!process.env.FAL_KEY) {
  dotenv.config({ path: ".env.local" });
}

const falKey = process.env.FAL_KEY?.trim();
console.log("FAL_KEY is defined:", !!falKey);
if (falKey) {
  console.log("FAL_KEY prefix:", falKey.substring(0, 10));
}

fal.config({
  credentials: falKey,
});

async function main() {
  try {
    console.log("Calling fal.ai Any LLM Vision...");
    const result = await fal.subscribe("fal-ai/any-llm/vision", {
      input: {
        image_url: "https://armocromia-mvp-tan.vercel.app/favicon.ico", // temporary image
        prompt: "describe this image in one word",
        model: "google/gemini-2.5-flash",
      },
    });
    console.log("Success! Result:", JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Error from fal.ai:", err);
  }
}

main();
