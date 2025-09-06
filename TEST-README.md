# Testing Scene Generation

This directory contains test scripts for the `generateSceneImages` function.

## Setup

1. **Add a test image**: Place any PNG image in the project root and rename it to `test-image.png`

2. **Set environment variables in `.env.local`**:
   ```bash
   GEMINI_API_KEY="your_gemini_api_key_here"
   FAL_API_KEY="your_fal_ai_key_here"
   ```

## Running the Test

### Option 1: JavaScript (CommonJS)
```bash
node test-scene-generation.js
```

### Option 2: TypeScript (ES Modules)
```bash
npx tsx test-scene-generation.ts
```

## What the Test Does

The test script will:

1. **Load your test image** and convert it to base64
2. **Run the full pipeline**:
   - Scene analysis with Gemini 2.5 Pro
   - Generate individual chibi figurine images with Gemini 2.5 Flash
   - Create 3D meshes with FAL AI
   - Generate a composite scene
3. **Show real-time progress** with timestamps
4. **Display results** for each step

## Expected Output

```
🔍 Checking environment variables from .env.local...
✅ GEMINI_API_KEY is set
✅ FAL_API_KEY is set

🖼️  Test image loaded successfully
   Image size: 123456 bytes

🚀 Starting scene generation test...
   This will test the full pipeline:
   1. Scene analysis with Gemini 2.5 Pro
   2. Image generation with Gemini 2.5 Flash
   3. Mesh generation with FAL AI
   4. Composite scene generation

✅ [2.3s] Created image: person_reading
   Prompt: Chibi style 3D figurine of a person sitting comfortably reading a book...

🎉 [5.1s] All images created!

🔺 [12.4s] Generated mesh for: person_reading
   Mesh URL: https://fal.media/files/...

🖼️  [18.7s] Composite scene created!
   Data length: 123456 characters

🏁 [18.8s] Process completed successfully!

✨ Test completed in 18.8 seconds with 4 events
```

## Troubleshooting

- **"Test image not found"**: Make sure you have a `test-image.png` file in the project root
- **"GEMINI_API_KEY not set"**: Set your Gemini API key in `.env.local`
- **"FAL_API_KEY not set"**: Set your FAL AI key in `.env.local`
- **Import errors**: Try using `npx tsx` instead of `node` for TypeScript files
