import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('Using API key:', apiKey);
  if (!apiKey) {
    console.error('No GEMINI_API_KEY found in env');
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  console.log('\n--- Listing models ---');
  try {
    // List models is not directly exposed on genAI. We can try to generate content with different models instead.
    const modelsToTry = [
      'gemini-1.5-flash',
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro',
      'gemini-2.0-flash',
      'gemini-2.5-flash'
    ];

    for (const modelName of modelsToTry) {
      console.log(`Trying model: ${modelName}...`);
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Say hello!');
        const text = result.response.text();
        console.log(`Success with ${modelName}:`, text);
      } catch (err: any) {
        console.error(`Failed with ${modelName}:`, err.message);
      }
    }
  } catch (error) {
    console.error('Error listing models:', error);
  }
}

main();
