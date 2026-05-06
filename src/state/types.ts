export type LayerIndex = 0 | 1 | 2;

export type ToolId = 'brush' | 'eraser' | 'picker';
export type BrushMode = 'pencil' | 'rect';

/** Quarter-turn rotation, clockwise. 0 = 0°, 1 = 90°, 2 = 180°, 3 = 270°. */
export type Rotation = 0 | 1 | 2 | 3;

export interface Tile {
  shape: string;
  color: string; // palette id (e.g. "wood")
  rotation: Rotation;
}

export type LayerGrid = (Tile | null)[][]; // [y][x]
export type Layers = [LayerGrid, LayerGrid, LayerGrid];

export interface MapDoc {
  width: number;
  height: number;
  layers: Layers;
}

export type LayerKey = 'floor' | 'ground' | 'roof';
export const LAYER_INFO: Array<{
  id: LayerIndex;
  key: LayerKey;
  short: string;
  color: string;
}> = [
  { id: 0, key: 'floor', short: 'F', color: 'var(--layer-floor)' },
  { id: 1, key: 'ground', short: 'G', color: 'var(--layer-ground)' },
  { id: 2, key: 'roof', short: 'R', color: 'var(--layer-roof)' },
];

export const PROJECT_FILE_VERSION = 1;
export const PROJECT_FILE_KIND = 'tile-map-whitebox';

export interface ProjectFile {
  kind: typeof PROJECT_FILE_KIND;
  version: number;
  name: string;
  width: number;
  height: number;
  layers: Layers;
  createdAt: string;
}
