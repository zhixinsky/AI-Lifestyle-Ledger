import { createRouter, createWebHistory } from 'vue-router';
import { getAdminToken } from '@/utils/request';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', component: () => import('@/views/LoginView.vue'), meta: { public: true } },
    {
      path: '/',
      component: () => import('@/layout/AdminLayout.vue'),
      redirect: '/dashboard',
      children: [
        { path: 'dashboard', component: () => import('@/views/dashboard/DashboardView.vue') },
        { path: 'users', component: () => import('@/views/users/UsersView.vue') },
        { path: 'users/:id/insight', component: () => import('@/views/users/UserInsightView.vue') },
        { path: 'users/:id', component: () => import('@/views/users/UserDetailView.vue') },
        { path: 'ai/logs', component: () => import('@/views/ai/AiLogsView.vue') },
        { path: 'ai/corrections', component: () => import('@/views/ai/AiCorrectionsView.vue') },
        { path: 'ai/prompt-examples', component: () => import('@/views/ai/PromptExamplesView.vue') },
        { path: 'articles', component: () => import('@/views/articles/ArticlesView.vue') },
        { path: 'announcements', component: () => import('@/views/announcements/AnnouncementsView.vue') },
        { path: 'memberships', component: () => import('@/views/memberships/MembershipsView.vue') },
        { path: 'orders', component: () => import('@/views/memberships/OrdersView.vue') },
        { path: 'life-spaces', component: () => import('@/views/life-spaces/LifeSpacesView.vue') },
        { path: 'growth/badges', component: () => import('@/views/growth/BadgesView.vue') },
        { path: 'growth/challenges', component: () => import('@/views/growth/ChallengesView.vue') },
        { path: 'banners', component: () => import('@/views/placeholders/ComingSoonView.vue') },
        { path: 'admins', component: () => import('@/views/admins/AdminsView.vue') },
        { path: 'settings', component: () => import('@/views/settings/SettingsView.vue') },
        { path: 'data-management', component: () => import('@/views/data-management/DataManagementView.vue') },
        { path: 'logs', component: () => import('@/views/logs/OperationLogsView.vue') },
      ],
    },
  ],
});

router.beforeEach((to) => {
  if (to.meta.public) return true;
  if (!getAdminToken()) return { path: '/login', query: { redirect: to.fullPath } };
  return true;
});

export default router;
