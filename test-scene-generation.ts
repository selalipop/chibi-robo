import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { generateSceneImages } from './src/server/routers/objectImageGenerator';
import { GoogleGenAI } from "@google/genai";

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

async function testGenerateSceneImages() {
  try {
    // Read an image file and convert to base64
    const imagePath = path.join(__dirname, 'test-image.png');
    
    if (!fs.existsSync(imagePath)) {
      console.log('❌ Test image not found. Please add a test-image.png file to the project root.');
      console.log('   You can add any PNG image and rename it to test-image.png');
      return;
    }
    
    const imageBuffer = fs.readFileSync(imagePath);
    const imageBase64 = `data:image/png;base64,${imageBuffer.toString('base64')}`;
    
    console.log('🖼️  Test image loaded successfully');
    console.log(`   Image size: ${imageBuffer.length} bytes`);
    
    console.log('🚀 Starting scene generation test...');
    console.log('   This will test the full pipeline:');
    console.log('   1. Scene analysis with Gemini 2.5 Pro');
    console.log('   2. Image generation with Gemini 2.5 Flash');
    console.log('   3. Mesh generation with FAL AI');
    console.log('   4. Composite scene generation');
    console.log('');
    
    const sceneDescription = "A cozy living room scene with a person reading a book";
    
    // Test the function
    const startTime = Date.now();
    let eventCount = 0;
    
    for await (const result of generateSceneImages(imageBase64, sceneDescription)) {
      eventCount++;
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      
      switch (result.event) {
        case 'created_image':
          const imageData = result.data as any;
          console.log(`✅ [${elapsed}s] Created image: ${imageData?.objectName}`);
          console.log(`   Prompt: ${imageData?.prompt?.substring(0, 100)}...`);
          break;
          
        case 'all_images_created':
          console.log(`🎉 [${elapsed}s] All images created!`);
          break;
          
        case 'mesh_generated':
          const meshData = result.data as any;
          console.log(`🔺 [${elapsed}s] Generated mesh for: ${meshData?.objectName}`);
          console.log(`   Mesh URL: ${meshData?.meshUrl}`);
          break;
          
        case 'composite_image_created':
          console.log(`🖼️  [${elapsed}s] Composite scene created!`);
          console.log(`   Data length: ${(result.data as string)?.length} characters`);
          break;
          
        case 'finished':
          console.log(`🏁 [${elapsed}s] Process completed successfully!`);
          break;
          
        default:
          console.log(`📝 [${elapsed}s] Event: ${result.event}`);
      }
    }
    
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('');
    console.log(`✨ Test completed in ${totalTime} seconds with ${eventCount} events`);
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Check for common issues
    if (error.message.includes('GEMINI_API_KEY')) {
      console.log('');
      console.log('💡 Make sure you have set the GEMINI_API_KEY environment variable in .env.local');
    }
    
    if (error.message.includes('FAL_KEY') || error.message.includes('FAL_API_KEY')) {
      console.log('');
      console.log('💡 Make sure you have set the FAL_API_KEY environment variable in .env.local');
    }
  }
}

// Check environment variables
console.log('🔍 Checking environment variables from .env.local...');
if (!process.env.GEMINI_API_KEY) {
  console.log('⚠️  GEMINI_API_KEY not set in .env.local');
} else {
  console.log('✅ GEMINI_API_KEY is set');
  console.log(`   Full key: ${process.env.GEMINI_API_KEY}`);
}

if (!process.env.FAL_API_KEY) {
  console.log('⚠️  FAL_API_KEY not set in .env.local');
} else {
  console.log('✅ FAL_API_KEY is set');
  console.log(`   Full key: ${process.env.FAL_API_KEY}`);
}

console.log('');

// Run the test
testGenerateSceneImages();
