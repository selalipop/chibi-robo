import { z } from 'zod';
import { procedure, router } from '../trpc';
import { generateSuggestionsForImage } from './suggestionGenerator';
import { generateSceneImages } from './objectImageGenerator';
import { fakeImageGenerator, fakeMeshGenerator } from './stubImageGenerator';
export const appRouter = router({
  getImageSuggestions: procedure
    .input(
      z.object({
        imageBase64: z.string(), //Will start with data:image/png;base64,____
        numSuggestions: z.number(),
      }),
    )
    .output(
      z.object({
        suggestions: z.array(z.object({
          funHook: z.string(), // Prompt model for 6-7 words
          detailedDescription: z.string(), // Prompt model for 2-4 sentences
          isRecommended: z.boolean(), //We'll prompt Gemini to recommend the best/most interesting suggestion
        })),
      }),
    )
    .mutation(async (opts) => {
      const imageBase64 = opts.input.imageBase64;
      const suggestions = await generateSuggestionsForImage(imageBase64, opts.input.numSuggestions);
      return {
        suggestions: suggestions,
      };
    }),
  getSceneImages: procedure
    .input(
      z.object({
        imageBase64: z.string(),
        sceneDescription: z.string(),
      }),
    )
    .mutation(async function* () {
      console.log("generating scene images");
      // Have gemini generate X prompts, one for each image
      const prompts = ["",""]
      const images = prompts.map(async (prompt, index) => {
        return {
          image: await fakeImageGenerator(`/object_${index + 1}.jpg`,index + 1),
          id: index,
        }
      });
      console.log("images", images);
      yield{
        event: 'prompts_generated',
        data: prompts,
      }
      // Yield images as they are generated
      for await (const image of images) {
        console.log("generated image", image);
        yield {
          event: 'created_image',
          data: image.image,
          id: image.id,
        }
      }
      const meshes = images.map(async (image, index) => {
        return {
          mesh: await fakeMeshGenerator(`/mesh_${index + 1}.glb`,index + 1),
          id: index,
        }
      });
      for await (const mesh of meshes) {
        console.log("generated mesh", mesh);
        yield {
          event: 'mesh_generated',
          data: mesh.mesh,
          id: mesh.id,
        }
      }
      yield{
        event: 'all_images_created',
      }
      // Generate composite image using generated images
      const compositeImage = "/image"
      // Generate composite image
      yield{
        event: 'composite_image_created',
        data: compositeImage,
      }

      return {
        event :'finished'
      }
    }),
});
// export type definition of API
export type AppRouter = typeof appRouter;
