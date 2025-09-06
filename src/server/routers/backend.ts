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
    .mutation(async function* ({input}) {
      for await (const event of generateSceneImages(input.imageBase64, input.sceneDescription)) {
        yield event;
      }
    }),
});
// export type definition of API
export type AppRouter = typeof appRouter;
