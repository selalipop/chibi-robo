import { GeneratedImage } from './GeneratedImage';
import { GeneratedMesh } from './GeneratedMesh';

export interface SceneGenerationResult {
  event: 'created_image' | 'all_images_created' | 'mesh_generated' | 'composite_image_created' | 'finished';
  data?: GeneratedImage | GeneratedMesh | string;
}
