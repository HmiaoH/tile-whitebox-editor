import {
  PROJECT_FILE_KIND,
  PROJECT_FILE_VERSION,
  type Layers,
  type ProjectFile,
} from '../state/types';
import { SHAPES_BY_ID } from '../data/shapes';
import { SWATCH_BY_ID } from '../data/palette';

const sanitizeFileName = (n: string) =>
  n
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 60) || 'untitled';

export const saveProjectFile = (file: ProjectFile) => {
  const json = JSON.stringify(file, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${sanitizeFileName(file.name)}.tilewb.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const validateLayers = (raw: unknown, w: number, h: number): Layers => {
  if (!Array.isArray(raw) || raw.length !== 3)
    throw new Error('layers must contain 3 layers');
  return raw.map((layer) => {
    if (!Array.isArray(layer) || layer.length !== h)
      throw new Error('layer height mismatch');
    return layer.map((row) => {
      if (!Array.isArray(row) || row.length !== w)
        throw new Error('layer width mismatch');
      return row.map((cell) => {
        if (!cell) return null;
        if (
          typeof cell.shape !== 'string' ||
          typeof cell.color !== 'string' ||
          !SHAPES_BY_ID[cell.shape]
        ) {
          return null;
        }
        const color = SWATCH_BY_ID[cell.color] ? cell.color : 'wall';
        const rRaw =
          typeof cell.rotation === 'number' ? cell.rotation : 0;
        const rotation = ((((rRaw | 0) % 4) + 4) % 4) as 0 | 1 | 2 | 3;
        return { shape: cell.shape, color, rotation };
      });
    });
  }) as Layers;
};

export const openProjectFile = async (file: File): Promise<ProjectFile> => {
  const text = await file.text();
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (err) {
    throw new Error('文件不是合法 JSON');
  }
  const obj = raw as Partial<ProjectFile>;
  if (obj.kind !== PROJECT_FILE_KIND) throw new Error('不是本编辑器的工程文件');
  if (typeof obj.width !== 'number' || typeof obj.height !== 'number')
    throw new Error('地图尺寸缺失');
  const layers = validateLayers(obj.layers, obj.width, obj.height);
  return {
    kind: PROJECT_FILE_KIND,
    version: typeof obj.version === 'number' ? obj.version : PROJECT_FILE_VERSION,
    name: typeof obj.name === 'string' && obj.name.trim() ? obj.name : '已加载地图',
    width: obj.width,
    height: obj.height,
    layers,
    createdAt: typeof obj.createdAt === 'string' ? obj.createdAt : new Date().toISOString(),
  };
};
