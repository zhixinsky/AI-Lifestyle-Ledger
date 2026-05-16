<template>
  <header class="topbar">
    <el-breadcrumb separator="/" class="topbar__breadcrumb">
      <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item v-if="parentTitle">{{ parentTitle }}</el-breadcrumb-item>
      <el-breadcrumb-item>{{ pageTitle }}</el-breadcrumb-item>
    </el-breadcrumb>

    <div class="topbar__actions">
      <el-input
        v-model="searchKeyword"
        class="topbar__search"
        placeholder="搜索页面、用户、公告…"
        clearable
        :prefix-icon="Search"
        @keyup.enter="onSearch"
      />
      <el-dropdown trigger="click" @command="onCommand">
        <button type="button" class="topbar__user">
          <BrandLogo size="sm" class="topbar__avatar" />
          <span class="topbar__name">{{ auth.admin?.nickname || auth.admin?.username }}</span>
          <el-icon><ArrowDown /></el-icon>
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item disabled>{{ auth.admin?.role }}</el-dropdown-item>
            <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowDown, Search } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import BrandLogo from '@/components/BrandLogo.vue';
import { useAuthStore } from '@/stores/auth';
import { routeMetaMap } from '@/config/menu';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const searchKeyword = ref('');

const meta = computed(() => routeMetaMap[route.path] || routeMetaMap[route.matched.at(-1)?.path || ''] || { title: '运营中台' });
const pageTitle = computed(() => meta.value.title);
const parentTitle = computed(() => meta.value.parent);
function onSearch() {
  if (!searchKeyword.value.trim()) return;
  ElMessage.info(`搜索「${searchKeyword.value}」即将支持`);
}

async function onCommand(cmd: string) {
  if (cmd === 'logout') {
    await auth.logout();
    router.replace('/login');
  }
}
</script>

<style scoped lang="scss">
.topbar {
  height: 64px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--moona-border);
  position: sticky;
  top: 0;
  z-index: 10;
}

.topbar__breadcrumb {
  font-size: var(--moona-font-caption);

  :deep(.el-breadcrumb__inner) {
    color: var(--moona-text-muted);
    font-weight: 500;
  }

  :deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
    color: var(--moona-text);
    font-weight: 600;
  }
}

.topbar__actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.topbar__search {
  width: 260px;

  :deep(.el-input__wrapper) {
    background: #f6f8fb;
    box-shadow: none;
  }
}

.topbar__user {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px 6px 6px;
  border: 1px solid var(--moona-border);
  border-radius: 999px;
  background: #fff;
  cursor: pointer;
  font-size: var(--moona-font-body);
  color: var(--moona-text);
}

.topbar__avatar {
  flex-shrink: 0;
}

.topbar__name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
