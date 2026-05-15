import type { BookType } from '@/types/domain';

export interface LifeSpaceMeta {
  type: BookType;
  name: string;
  icon: string;
  color: string;
  theme: string;
  description: string;
  aiIntro: string;
}

export const lifeSpaceMetas: LifeSpaceMeta[] = [
  { type: 'daily', name: '日常生活', icon: '日', color: '#83D7C4', theme: 'mint', description: '默认记录每天的生活流动', aiIntro: 'AI 会从你的日常记录里看见生活节奏。' },
  { type: 'love', name: '恋爱时刻', icon: '恋', color: '#F2A7B3', theme: 'rose', description: '一起记录两个人的生活与回忆', aiIntro: '最近约会、共同支出和值得收藏的瞬间会在这里沉淀。' },
  { type: 'family', name: '家庭点滴', icon: '家', color: '#A7C970', theme: 'olive', description: '记录属于家的日常', aiIntro: 'AI 会整理家庭开销、共同记忆和家的生活秩序。' },
  { type: 'work', name: '职场日常', icon: '职', color: '#8DA7F2', theme: 'blue', description: '记录工作、通勤和报销线索', aiIntro: '本月报销、通勤成本和工作日节奏会被温柔提醒。' },
  { type: 'travel', name: '旅行记忆', icon: '旅', color: '#7CC7E8', theme: 'cyan', description: '记录每一次出发与旅程', aiIntro: 'AI 会把交通、餐饮和住宿整理成旅行回忆。' },
  { type: 'campus', name: '校园时光', icon: '校', color: '#D9B76E', theme: 'amber', description: '记录课程、社团和青春日常', aiIntro: '学习、社交和校园生活的小变化会慢慢被看见。' },
  { type: 'couple', name: '恋爱时刻', icon: '恋', color: '#F2A7B3', theme: 'rose', description: '一起记录两个人的生活与回忆', aiIntro: '最近约会、共同支出和值得收藏的瞬间会在这里沉淀。' },
];

export const creatableLifeSpaceMetas = lifeSpaceMetas.filter((item) =>
  ['love', 'family', 'work', 'travel', 'campus'].includes(item.type)
);

export function getLifeSpaceMeta(type?: string) {
  return lifeSpaceMetas.find((item) => item.type === type) || lifeSpaceMetas[0];
}
