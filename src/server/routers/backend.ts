import { z } from 'zod';
import { procedure, router } from '../trpc';
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
    .query((opts) => {
      const imageBase64 = opts.input.imageBase64;
      return {
        suggestions: [
          {
            funHook: 'Party at the beach!',
            detailedDescription: 'We\'re having a party at the beach!',
            isRecommended: true,
          },
          {
            funHook: 'Office party', //Prompt model for more fun names
            detailedDescription: 'We\'re having an office party!',
            isRecommended: true,
          },
        ],
      };
    }),
  getSceneImages: procedure
    .input(
      z.object({
        imageBase64: z.string(),
        sceneDescription: z.string(),
      }),
    )
    .query(async function* () {
      // Have gemini generate X prompts, one for each image
      const prompts = [""]
      const images = prompts.map(async (prompt) => {
        //Generate images
      });
      // Yield images as they are generated
      for await (const imagePromise of images) {
        const image = await imagePromise;
        yield {
          event: 'created_image',
          data: image,
        }
      }

      yield{
        event: 'all_images_created',
      }
      // Generate composite image using generated images
      const compositeImage = ""
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