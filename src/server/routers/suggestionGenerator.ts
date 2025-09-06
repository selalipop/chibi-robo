export interface Suggestion {
  funHook: string;
  detailedDescription: string;
  isRecommended: boolean;
}

export function generateSuggestionsForImage (imageBase64: string, numSuggestions: number) : Promise<Suggestion[]> {

}