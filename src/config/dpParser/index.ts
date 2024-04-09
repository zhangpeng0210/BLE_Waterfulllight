import SceneFormater from './SceneFormater';
import SceneCombineformer from './SceneCombineFormater';
import SceneListFormater from './SceneListFormater';
import MusicFormater from './MusicFormater';


export const sceneTransformer = new SceneFormater();
export const sceneListTransformer = new SceneListFormater();
export const sceneCombineTransformer = new SceneCombineformer();
export const musicTransformer = new MusicFormater();

export default {
  sceneTransformer,
  sceneCombineTransformer,
  sceneListTransformer,
  musicTransformer,
}
