import { generate_3d_printable_prompt, generate_product_photoshoot_scene_prompt } from '../../utils/prompts';
import { GoogleGenAI } from '@google/genai';
import { fal } from '@fal-ai/client';
import { SceneGenerationResult } from './SceneGenerationResult';
import { SceneAnalysis } from './SceneAnalysis';

// Initialize Gemini client - gets API key from GEMINI_API_KEY environment variable
const ai = new GoogleGenAI({ 
  apiKey: `AIzaSyB9SK7xgp4KrqxvX0-2rvvYaeMECSi9Sj4`,
  vertexai: false
});

// Define models
const GEMINI_PRO_MODEL = 'gemini-2.5-pro';
const GEMINI_FLASH_MODEL = 'gemini-2.5-flash-image-preview';

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

// Step 4: Generate mesh with FAL AI
async function generateMeshWithFAL(imageData: string, objectName: string): Promise<string> {
  fal.config({
    credentials: "4a3100fd-a69a-41db-96dc-33a00f6cefc7:d23ffb3f84aac3f290656ce45371fc39"
  });
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
  // Convert base64 data URIs to buffers for the API
  const imageBuffers = imageDataArray.map(imageData => {
    const base64Data = imageData.replace('data:image/png;base64,', '');
    return Buffer.from(base64Data, 'base64');
  });

  const prompt = `${generate_product_photoshoot_scene_prompt}\n\nScene description: ${sceneDescription}\n\nGenerate a product photoshoot scene with chibi figurines.`;

  // Create contents array with images and prompt
  const contents = [{
    parts: [
      ...imageBuffers.map(buffer => ({
        inlineData: {
          data: buffer.toString('base64'),
          mimeType: 'image/png'
        }
      })),
      // Then add the text prompt
      {
        text: prompt
      }
    ]
  }];

  const response = await ai.models.generateContent({
    model: GEMINI_FLASH_MODEL,
    contents: contents,
    config: {
      responseModalities: ['IMAGE']
    }
  });
  
  console.log('Composite response attributes:', JSON.stringify(response, null, 2));
  
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
    const imagePromises = sceneAnalysis.generationPrompts.map(async (obj, index) => {
      const imageData = await generateImageWithGemini(obj.prompt);
      return {
        objectName: obj.objectName,
        imageData,
        prompt: obj.prompt,
        id: index
      };
    });

    // Yield images as they are generated
    for (const imagePromise of imagePromises) {
      const image = await imagePromise;
      yield {
        event: 'created_image',
        data: image,
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
        imageData: image.imageData,
        id: image.id
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