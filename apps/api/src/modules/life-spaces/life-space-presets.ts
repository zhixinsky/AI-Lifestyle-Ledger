import { BookType } from '@prisma/client';

export const LIFE_SPACE_PRESETS: Record<BookType, {
  name: string;
  icon: string;
  color: string;
  description: string;
  aiIntro: string;
  sort: number;
}> = {
  [BookType.daily]: {
    name: '日常生活',
    icon: '日',
    color: '#83D7C4',
    description: '默认记录每天的生活流动',
    aiIntro: 'AI 会从你的日常记录里看见生活节奏。',
    sort: 0,
  },
  [BookType.love]: {
    name: '恋爱时刻',
    icon: '恋',
    color: '#F2A7B3',
    description: '一起记录两个人的生活与回忆',
    aiIntro: 'AI 会关注约会、共同支出和值得收藏的时刻。',
    sort: 10,
  },
  [BookType.family]: {
    name: '家庭点滴',
    icon: '家',
    color: '#A7C970',
    description: '记录属于家的日常',
    aiIntro: 'AI 会整理家庭开销、共同记忆和家的生活秩序。',
    sort: 20,
  },
  [BookType.work]: {
    name: '职场日常',
    icon: '职',
    color: '#8DA7F2',
    description: '记录工作、通勤和报销线索',
    aiIntro: 'AI 会提醒报销、通勤成本和工作日消费节奏。',
    sort: 30,
  },
  [BookType.travel]: {
    name: '旅行记忆',
    icon: '旅',
    color: '#7CC7E8',
    description: '记录每一次出发与旅程',
    aiIntro: 'AI 会把交通、餐饮和住宿整理成旅行回忆。',
    sort: 40,
  },
  [BookType.campus]: {
    name: '校园时光',
    icon: '校',
    color: '#D9B76E',
    description: '记录课程、社团和青春日常',
    aiIntro: 'AI 会观察学习、社交和校园生活的小变化。',
    sort: 50,
  },
  [BookType.couple]: {
    name: '恋爱时刻',
    icon: '恋',
    color: '#F2A7B3',
    description: '一起记录两个人的生活与回忆',
    aiIntro: 'AI 会关注约会、共同支出和值得收藏的时刻。',
    sort: 10,
  },
};

export const CREATABLE_LIFE_SPACE_TYPES = [
  BookType.love,
  BookType.family,
  BookType.work,
  BookType.travel,
  BookType.campus,
];
