// Fixed color palette used for tile colors, organized in groups.
// Free color picking is intentionally not supported (per spec).

export interface Swatch {
  id: string;
  name: string;
  hex: string;
  group: 'neutral' | 'wood' | 'stone' | 'nature' | 'water' | 'warm' | 'fabric';
}

export const PALETTE: Swatch[] = [
  // Neutrals
  { id: 'white', name: '雪白', hex: '#ECEFF4', group: 'neutral' },
  { id: 'cream', name: '米白', hex: '#E5DCC2', group: 'neutral' },
  { id: 'lightgray', name: '浅灰', hex: '#C6CDD6', group: 'neutral' },
  { id: 'gray', name: '中灰', hex: '#929AA5', group: 'neutral' },
  { id: 'darkgray', name: '深灰', hex: '#5B6068', group: 'neutral' },
  { id: 'charcoal', name: '炭黑', hex: '#2D3137', group: 'neutral' },
  { id: 'panel', name: '面板', hex: '#A8B0BB', group: 'neutral' },
  { id: 'metal', name: '金属', hex: '#8B95A2', group: 'neutral' },

  // Wood / earth
  { id: 'wood', name: '原木', hex: '#B98052', group: 'wood' },
  { id: 'woodDark', name: '深木', hex: '#7A5034', group: 'wood' },
  { id: 'woodLight', name: '浅木', hex: '#DBAE7A', group: 'wood' },
  { id: 'earth', name: '泥土', hex: '#7E5A3D', group: 'wood' },
  { id: 'tan', name: '驼色', hex: '#C2966A', group: 'wood' },
  { id: 'sand', name: '沙色', hex: '#DDC78F', group: 'wood' },
  { id: 'ochre', name: '赭石', hex: '#C0904B', group: 'wood' },
  { id: 'clay', name: '陶土', hex: '#A45A3D', group: 'wood' },

  // Stone / road
  { id: 'stone', name: '石灰', hex: '#9CA3AB', group: 'stone' },
  { id: 'stoneWarm', name: '暖石', hex: '#B6AC97', group: 'stone' },
  { id: 'asphalt', name: '沥青', hex: '#3F454D', group: 'stone' },
  { id: 'wall', name: '墙体', hex: '#D6CFBE', group: 'stone' },

  // Nature greens
  { id: 'grass', name: '草绿', hex: '#6FA84B', group: 'nature' },
  { id: 'leaf', name: '叶绿', hex: '#3F7F36', group: 'nature' },
  { id: 'mint', name: '薄荷', hex: '#92CFAB', group: 'nature' },
  { id: 'olive', name: '橄榄', hex: '#7E8543', group: 'nature' },

  // Water / cool
  { id: 'water', name: '水蓝', hex: '#4FAFD3', group: 'water' },
  { id: 'sky', name: '天蓝', hex: '#7BC2E6', group: 'water' },
  { id: 'teal', name: '青绿', hex: '#3FAEA0', group: 'water' },
  { id: 'navy', name: '藏蓝', hex: '#2F4F87', group: 'water' },

  // Warm accents
  { id: 'red', name: '砖红', hex: '#CF5959', group: 'warm' },
  { id: 'coral', name: '珊瑚', hex: '#E37272', group: 'warm' },
  { id: 'orange', name: '橙色', hex: '#E69646', group: 'warm' },
  { id: 'amber', name: '琥珀', hex: '#F0C24A', group: 'warm' },

  // Fabric / decor
  { id: 'yellow', name: '芥黄', hex: '#EFD262', group: 'fabric' },
  { id: 'pink', name: '粉色', hex: '#E29BB6', group: 'fabric' },
  { id: 'lavender', name: '薰紫', hex: '#B098D2', group: 'fabric' },
  { id: 'plum', name: '梅紫', hex: '#6E4889', group: 'fabric' },
];

export const SWATCH_BY_ID: Record<string, Swatch> = Object.fromEntries(
  PALETTE.map((s) => [s.id, s]),
);

export const PALETTE_GROUPS: Array<{ id: Swatch['group']; name: string }> = [
  { id: 'neutral', name: '中性' },
  { id: 'wood', name: '木与土' },
  { id: 'stone', name: '石与墙' },
  { id: 'nature', name: '自然' },
  { id: 'water', name: '水域' },
  { id: 'warm', name: '暖色' },
  { id: 'fabric', name: '织物' },
];

export const colorOf = (idOrHex: string): string => {
  if (idOrHex.startsWith('#')) return idOrHex;
  return SWATCH_BY_ID[idOrHex]?.hex ?? '#ECEFF4';
};

export const DEFAULT_COLOR_ID = 'wall';
