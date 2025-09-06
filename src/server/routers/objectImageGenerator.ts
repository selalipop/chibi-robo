import { generate_3d_printable_prompt, generate_product_photoshoot_scene_prompt } from '../../utils/prompts';
import { GoogleGenAI } from '@google/genai';
import { fal } from '@fal-ai/client';

// Initialize Gemini client - gets API key from GEMINI_API_KEY environment variable
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Define models
const GEMINI_PRO_MODEL = 'gemini-2.5-pro';
const GEMINI_FLASH_MODEL = 'gemini-2.5-flash-image-preview';

// Types for structured output
interface SceneAnalysis {
  sceneOverview: string;
  identifiedObjects: string[];
  generationPrompts: {
    objectName: string;
    prompt: string;
  }[];
}

interface GeneratedImage {
  objectName: string;
  imageData: string; // base64 data URI
  prompt: string;
}

interface GeneratedMesh {
  objectName: string;
  meshUrl: string;
  imageData: string; // base64 data URI
}

interface SceneGenerationResult {
  event: 'created_image' | 'all_images_created' | 'mesh_generated' | 'composite_image_created' | 'finished';
  data?: GeneratedImage | GeneratedMesh | string;
}

// Step 1: Analyze scene with Gemini 2.5 Pro
async function analyzeSceneWithGemini(imageBase64: string): Promise<SceneAnalysis> {
  // Convert base64 to buffer
  const imageData = imageBase64.replace('data:image/png;base64,', '');
  const imageBuffer = Buffer.from(imageData, 'base64');
  
  const prompt = `${generate_3d_printable_prompt}\n\nPlease respond with a valid JSON object in this exact format:\n{\n  "sceneOverview": "string",\n  "identifiedObjects": ["string1", "string2"],\n  "generationPrompts": [\n    {\n      "objectName": "string",\n      "prompt": "string"\n    }\n  ]\n}`;

  const response = await ai.models.generateContent({
    model: GEMINI_PRO_MODEL,
    contents: [
      {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: 'image/png'
        }
      },
      prompt
    ],
    config: {
      responseMimeType: "application/json"
    }
  });

  const text = response.text;
  
  if (!text) {
    throw new Error('No text response received from Gemini');
  }
  
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Failed to parse JSON response: ${text}`);
  }
}

// Step 2: Generate images with Gemini 2.5 Flash Image Preview
async function generateImageWithGemini(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: GEMINI_FLASH_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "image/png"
    }
  });

  // Handle multiple images - use the last one
  if (!response.candidates || response.candidates.length === 0) {
    throw new Error('No candidates found in response');
  }
  
  const candidate = response.candidates[0];
  if (!candidate.content || !candidate.content.parts) {
    throw new Error('No content parts found in response');
  }
  
  const parts = candidate.content.parts;
  let lastImageData: string | null = null;
  
  for (const part of parts) {
    if (part.inlineData && part.inlineData.mimeType === 'image/png' && part.inlineData.data) {
      lastImageData = part.inlineData.data;
    }
  }
  
  if (!lastImageData) {
    throw new Error('No image data found in response');
  }
  
  return `data:image/png;base64,${lastImageData}`;
}

// Helper function to write base64 data to temporary file if needed
async function writeTempFile(imageBase64: string, objectName: string): Promise<string> {
  const fs = require('fs');
  const path = require('path');
  const os = require('os');
  
  const timestamp = Date.now();
  const filename = `${objectName}_${timestamp}.png`;
  const tempPath = path.join(os.tmpdir(), filename);
  
  // Convert base64 to buffer and write to temp file
  const imageData = imageBase64.replace('data:image/png;base64,', '');
  const buffer = Buffer.from(imageData, 'base64');
  fs.writeFileSync(tempPath, buffer);
  
  return tempPath;
}

// Step 4: Generate mesh with FAL AI
async function generateMeshWithFAL(imageData: string, objectName: string): Promise<string> {
  const result = await fal.subscribe("fal-ai/hunyuan3d/v2", {
    input: {
      input_image_url: imageData // FAL accepts data URI directly
    },
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === "IN_PROGRESS") {
        update.logs.map((log) => log.message).forEach(console.log);
      }
    },
  });

  // The result should contain the mesh file
  if (!result.data || !result.data.model_mesh) {
    throw new Error('No mesh file found in FAL AI response');
  }

  // Return the URL of the mesh file
  return result.data.model_mesh.url;
}

// Step 5: Generate final composite scene
async function generateCompositeScene(imageDataArray: string[], sceneDescription: string): Promise<string> {
  // For now, we'll generate a simple composite scene using the first image
  // In a more sophisticated implementation, you might want to use a different approach
  // that can handle multiple images for composition
  
  const prompt = `${generate_product_photoshoot_scene_prompt}\n\nScene description: ${sceneDescription}\n\nGenerate a product photoshoot scene with chibi figurines.`;

  const response = await ai.models.generateContent({
    model: GEMINI_FLASH_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "image/png"
    }
  });
  
  // Handle multiple images - use the last one
  if (!response.candidates || response.candidates.length === 0) {
    throw new Error('No candidates found in composite response');
  }
  
  const candidate = response.candidates[0];
  if (!candidate.content || !candidate.content.parts) {
    throw new Error('No content parts found in composite response');
  }
  
  const parts = candidate.content.parts;
  let lastImageData: string | null = null;
  
  for (const part of parts) {
    if (part.inlineData && part.inlineData.mimeType === 'image/png' && part.inlineData.data) {
      lastImageData = part.inlineData.data;
    }
  }
  
  if (!lastImageData) {
    throw new Error('No image data found in composite response');
  }
  
  return `data:image/png;base64,${lastImageData}`;
}

// Main function that orchestrates the entire process
export async function* generateSceneImages(
  imageBase64: string, 
  sceneDescription: string
): AsyncGenerator<SceneGenerationResult, void, unknown> {
  try {
    // Step 1: Analyze scene
    const sceneAnalysis = await analyzeSceneWithGemini(imageBase64);
    
    // Step 2: Generate images for each object
    const imagePromises = sceneAnalysis.generationPrompts.map(async (obj) => {
      const imageData = await generateImageWithGemini(obj.prompt);
      return {
        objectName: obj.objectName,
        imageData,
        prompt: obj.prompt
      };
    });

    // Yield images as they are generated
    for (const imagePromise of imagePromises) {
      const image = await imagePromise;
      yield {
        event: 'created_image',
        data: image
      };
    }

    yield {
      event: 'all_images_created'
    };

    // Step 3a: Generate meshes for each image
    const meshPromises = imagePromises.map(async (imagePromise) => {
      const image = await imagePromise;
      const meshUrl = await generateMeshWithFAL(image.imageData, image.objectName);
      return {
        objectName: image.objectName,
        meshUrl,
        imageData: image.imageData
      };
    });

    // Yield meshes as they are generated
    for (const meshPromise of meshPromises) {
      const mesh = await meshPromise;
      yield {
        event: 'mesh_generated',
        data: mesh
      };
    }

    // Step 3b: Generate composite scene
    const allImages = await Promise.all(imagePromises);
    const imageDataArray = allImages.map(img => img.imageData);
    const compositeImageData = await generateCompositeScene(imageDataArray, sceneDescription);

    yield {
      event: 'composite_image_created',
      data: compositeImageData
    };

    yield {
      event: 'finished'
    };

  } catch (error) {
    console.error('Error in generateSceneImages:', error);
    throw error;
  }
}

// Legacy function for backward compatibility
export function generateImageForObject(objectPrompt: string): Promise<string> {
  return generateImageWithGemini(objectPrompt);
}