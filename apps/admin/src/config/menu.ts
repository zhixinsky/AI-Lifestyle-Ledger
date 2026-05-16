import type { Component } from 'vue';
import {
  Bell,
  ChatDotRound,
  Document,
  EditPen,
  Key,
  Monitor,
  Picture,
  Setting,
  Tickets,
  User,
  UserFilled,
  DataAnalysis,
  Medal,
} from '@element-plus/icons-vue';

export type MenuItem = {
  path: string;
  title: string;
  icon: Component;
};

export type MenuGroup = {
  label: string;
  items: MenuItem[];
};

export const menuGroups: MenuGroup[] = [
  {
    label: '数据运营',
    items: [
      { path: '/dashboard', title: '运营驾驶舱', icon: DataAnalysis },
      { path: '/users', title: '用户洞察', icon: User },
      { path: '/memberships', title: '会员运营', icon: Medal },
    ],
  },
  {
    label: 'AI运营',
    items: [
      { path: '/ai/logs', title: '调用日志', icon: Monitor },
      { path: '/ai/corrections', title: '纠错中心', icon: EditPen },
      { path: '/ai/prompt-examples', title: 'Prompt示例库', icon: ChatDotRound },
    ],
  },
  {
    label: '内容触达',
    items: [
      { path: '/announcements', title: '公告触达', icon: Bell },
      { path: '/articles', title: '内容运营', icon: Document },
      { path: '/banners', title: 'Banner运营', icon: Picture },
    ],
  },
  {
    label: '成长与生活',
    items: [
      { path: '/life-spaces', title: '生活空间', icon: Key },
      { path: '/growth/badges', title: '徽章管理', icon: Medal },
      { path: '/growth/challenges', title: '挑战管理', icon: Tickets },
    ],
  },
  {
    label: '系统管理',
    items: [
      { path: '/settings', title: '系统配置', icon: Setting },
      { path: '/admins', title: '管理员权限', icon: UserFilled },
      { path: '/logs', title: '操作日志', icon: Tickets },
    ],
  },
];

export const routeMetaMap: Record<string, { title: string; subtitle?: string; parent?: string }> = {
  '/dashboard': { title: '运营驾驶舱', subtitle: '实时掌握用户、AI 与业务核心指标' },
  '/users': { title: '用户洞察', subtitle: '查看用户画像、会员状态与使用行为' },
  '/users/:id/insight': { title: '用户 AI 画像', subtitle: '单用户行为分析与 AI 互动洞察', parent: '用户洞察' },
  '/memberships': { title: '会员运营', subtitle: '管理会员等级、到期与手动开通' },
  '/orders': { title: '订单列表', subtitle: '查看支付订单与交易状态', parent: '会员运营' },
  '/ai/logs': { title: '调用日志', subtitle: '追踪 AI 请求、耗时与失败原因' },
  '/ai/corrections': { title: '纠错中心', subtitle: '分析用户修正样本，优化 Prompt' },
  '/ai/prompt-examples': { title: 'Prompt 示例库', subtitle: '维护可注入模型的示例样本' },
  '/announcements': { title: '公告触达', subtitle: '管理小程序弹窗公告、顶部通知和运营触达内容' },
  '/articles': { title: '内容运营', subtitle: '管理发现页文章与内容发布' },
  '/banners': { title: 'Banner 运营', subtitle: '配置首页与发现页横幅展示' },
  '/settings': { title: '系统配置', subtitle: 'AI 限额、协议地址与全局开关' },
  '/admins': { title: '管理员权限', subtitle: '管理后台账号与角色权限' },
  '/logs': { title: '操作日志', subtitle: '审计关键运营与配置变更' },
  '/life-spaces': { title: '生活空间管理', subtitle: '空间模板与用户使用统计' },
  '/growth/badges': { title: '徽章管理', subtitle: '成长体系徽章配置' },
  '/growth/challenges': { title: '挑战管理', subtitle: '挑战任务与完成率' },
};
