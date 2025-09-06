// Types for structured output
export interface SceneAnalysis {
  sceneOverview: string;
  identifiedObjects: string[];
  generationPrompts: {
    objectName: string;
    prompt: string;
  }[];
}
