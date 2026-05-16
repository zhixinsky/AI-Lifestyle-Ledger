import type { BookType, LifeSpace } from '@/types/domain';

export interface LifeSpaceMeta {
  type: BookType;
  name: string;
  color: string;
  theme: string;
  description: string;
  aiIntro: string;
}

export const lifeSpaceMetas: LifeSpaceMeta[] = [
  { type: 'daily', name: '日常生活', color: '#83D7C4', theme: 'mint', description: '默认记录每天的生活流动', aiIntro: 'AI 会从你的日常记录里看见生活节奏。' },
  { type: 'love', name: '恋爱时刻', color: '#F2A7B3', theme: 'rose', description: '一起记录两个人的生活与回忆', aiIntro: '最近约会、共同支出和值得收藏的瞬间会在这里沉淀。' },
  { type: 'family', name: '家庭点滴', color: '#A7C970', theme: 'olive', description: '记录属于家的日常', aiIntro: 'AI 会整理家庭开销、共同记忆和家的生活秩序。' },
  { type: 'work', name: '职场日常', color: '#8DA7F2', theme: 'blue', description: '记录工作、通勤和报销线索', aiIntro: '本月报销、通勤成本和工作日节奏会被温柔提醒。' },
  { type: 'travel', name: '旅行记忆', color: '#7CC7E8', theme: 'cyan', description: '记录每一次出发与旅程', aiIntro: 'AI 会把交通、餐饮和住宿整理成旅行回忆。' },
  { type: 'campus', name: '校园时光', color: '#D9B76E', theme: 'amber', description: '记录课程、社团和青春日常', aiIntro: '学习、社交和校园生活的小变化会慢慢被看见。' },
  { type: 'couple', name: '恋爱时刻', color: '#F2A7B3', theme: 'rose', description: '一起记录两个人的生活与回忆', aiIntro: '最近约会、共同支出和值得收藏的瞬间会在这里沉淀。' },
];

export const creatableLifeSpaceMetas = lifeSpaceMetas.filter((item) =>
  ['love', 'family', 'work', 'travel', 'campus'].includes(item.type)
);

const defaultNames = new Set(creatableLifeSpaceMetas.map((item) => item.name));

export function getLifeSpaceMeta(type?: string) {
  return lifeSpaceMetas.find((item) => item.type === type) || lifeSpaceMetas[0];
}

/** 名称是否为某类生活空间的默认名（用于切换类型时是否自动改名） */
export function isDefaultLifeSpaceName(name: string) {
  const trimmed = name.trim();
  return !trimmed || defaultNames.has(trimmed);
}

/** 展示用：去掉各类引号（含全角、弯引号、直角引号） */
export function stripLifeSpaceQuotes(name: string) {
  if (!name) return '';
  return name
    .replace(/[\u201C\u201D\u2018\u2019\uFF02"'`´＂＇「」『』《》〈〉【】]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeLifeSpace(space: LifeSpace): LifeSpace {
  return { ...space, name: stripLifeSpaceQuotes(space.name) };
}

/** 展示/色条用：优先 API 返回的 color，否则按 type 取预设 */
export function resolveLifeSpaceColor(space: Pick<LifeSpace, 'type' | 'color'>) {
  const c = (space.color || '').trim();
  if (c) return c;
  return getLifeSpaceMeta(space.type).color;
}

/** 将 #RRGGBB 转为带透明度的 rgba，用于选项行浅底 */
export function lifeSpaceColorAlpha(hex: string, alpha = 0.14) {
  const raw = hex.replace('#', '').trim();
  if (raw.length !== 6) return `rgba(131, 215, 196, ${alpha})`;
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return `rgba(131, 215, 196, ${alpha})`;
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
