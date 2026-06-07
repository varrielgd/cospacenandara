import dotenv from 'dotenv';
dotenv.config();

import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function testBothProviders() {
  console.log('=== AI Discovery Provider Test ===\n');
  console.log(`GROQ_MODEL: ${process.env.GROQ_MODEL}`);
  console.log(`GEMINI_MODEL: ${process.env.GEMINI_MODEL}`);
  console.log(`GROQ_API_KEY: ${process.env.GROQ_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log('');

  // Test Groq
  console.log('--- Testing Groq ---');
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are an AI assistant. Reply with exactly: GROQ_OK' },
        { role: 'user', content: 'Test' }
      ],
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      temperature: 0,
      max_tokens: 10
    });
    const content = completion.choices[0]?.message?.content;
    console.log(`✅ Groq SUCCESS: ${content}`);
  } catch (error: any) {
    console.log(`❌ Groq FAILED: ${error.message}`);
  }

  // Test Gemini
  console.log('\n--- Testing Gemini ---');
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.5-flash' });
    const result = await model.generateContent('Reply with exactly: GEMINI_OK');
    const text = result.response.text();
    console.log(`✅ Gemini SUCCESS: ${text}`);
  } catch (error: any) {
    console.log(`❌ Gemini FAILED: ${error.message}`);
  }

  // Test AI Seed Discovery simulation
  console.log('\n--- Testing AI Seed Discovery (JSON output) ---');
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
        maxOutputTokens: 1024,
      }
    });

    const result = await model.generateContent(`
      Provide 3 real coffee importer companies in Japan.
      Return ONLY valid JSON array:
      [{"title":"Company Name","url":"https://domain.com","snippet":"Description"}]
    `);
    const text = result.response.text();
    const parsed = JSON.parse(text);
    console.log(`✅ AI Seed Discovery SUCCESS: Found ${parsed.length} companies`);
    for (const item of parsed) {
      console.log(`   - ${item.title}: ${item.url}`);
    }
  } catch (error: any) {
    console.log(`❌ AI Seed Discovery FAILED: ${error.message}`);
  }

  console.log('\n=== Test Complete ===');
}

testBothProviders();
