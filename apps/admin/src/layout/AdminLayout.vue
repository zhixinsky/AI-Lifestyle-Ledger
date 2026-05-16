<template>
  <el-container class="admin-shell">
    <el-aside width="240px" class="admin-aside">
      <div class="brand">
        <span class="brand__icon">🌙</span>
        <div>
          <div class="brand__title">Moona</div>
          <div class="brand__sub">AI 运营中台</div>
        </div>
      </div>
      <el-menu :default-active="activeMenu" router class="admin-menu">
        <el-menu-item index="/dashboard"><span>运营驾驶舱</span></el-menu-item>
        <el-menu-item index="/users"><span>用户洞察</span></el-menu-item>
        <el-sub-menu index="ai">
          <template #title>AI米粒管理</template>
          <el-menu-item index="/ai/logs">调用日志</el-menu-item>
          <el-menu-item index="/ai/corrections">纠错中心</el-menu-item>
          <el-menu-item index="/ai/prompt-examples">Prompt 示例库</el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/articles"><span>内容运营</span></el-menu-item>
        <el-menu-item index="/announcements"><span>公告触达</span></el-menu-item>
        <el-sub-menu index="member">
          <template #title>会员运营</template>
          <el-menu-item index="/memberships">会员列表</el-menu-item>
          <el-menu-item index="/orders">订单列表</el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/life-spaces"><span>生活空间管理</span></el-menu-item>
        <el-sub-menu index="growth">
          <template #title>成长体系</template>
          <el-menu-item index="/growth/badges">徽章</el-menu-item>
          <el-menu-item index="/growth/challenges">挑战</el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/settings"><span>系统配置</span></el-menu-item>
        <el-menu-item index="/logs"><span>操作日志</span></el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="admin-header">
        <div class="admin-header__title">{{ pageTitle }}</div>
        <div class="admin-header__right">
          <span class="admin-header__name">{{ auth.admin?.nickname || auth.admin?.username }}</span>
          <el-button text type="primary" @click="onLogout">退出</el-button>
        </div>
      </el-header>
      <el-main class="admin-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const activeMenu = computed(() => route.path);
const pageTitle = computed(() => (route.meta.title as string) || '运营中台');

onMounted(() => {
  if (!auth.admin) auth.fetchMe();
});

async function onLogout() {
  await auth.logout();
  router.replace('/login');
}
</script>

<style scoped lang="scss">
.admin-shell {
  min-height: 100vh;
}

.admin-aside {
  background: linear-gradient(180deg, #1e2a44 0%, #243b55 100%);
  color: #fff;
}

.brand {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 24px 20px;
}

.brand__icon {
  font-size: 28px;
}

.brand__title {
  font-size: 18px;
  font-weight: 700;
}

.brand__sub {
  font-size: 12px;
  opacity: 0.75;
}

.admin-menu {
  border-right: none;
  background: transparent;
}

.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.06);
}

.admin-header__title {
  font-size: 18px;
  font-weight: 600;
}

.admin-header__right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.admin-header__name {
  color: var(--moona-muted);
}

.admin-main {
  padding: 20px;
}
</style>
