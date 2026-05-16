<template>
  <aside class="sidebar">
    <div class="sidebar__brand">
      <BrandLogo size="md" class="sidebar__logo" />
      <div>
        <div class="sidebar__title">Moona</div>
        <div class="sidebar__sub">AI运营中台</div>
      </div>
    </div>

    <nav class="sidebar__nav">
      <div v-for="group in menuGroups" :key="group.label" class="sidebar__group">
        <div class="sidebar__group-label">{{ group.label }}</div>
        <router-link
          v-for="item in group.items"
          :key="item.path"
          :to="item.path"
          class="sidebar__item"
          :class="{ 'is-active': isActive(item.path) }"
        >
          <el-icon class="sidebar__icon"><component :is="item.icon" /></el-icon>
          <span>{{ item.title }}</span>
        </router-link>
      </div>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import BrandLogo from '@/components/BrandLogo.vue';
import { menuGroups } from '@/config/menu';

const route = useRoute();

function isActive(path: string) {
  if (path === '/users') return route.path === '/users' || route.path.startsWith('/users/');
  return route.path === path || route.path.startsWith(`${path}/`);
}
</script>

<style scoped lang="scss">
.sidebar {
  width: var(--moona-sidebar-width);
  flex-shrink: 0;
  height: 100vh;
  position: sticky;
  top: 0;
  background: #ffffff;
  border-right: 1px solid var(--moona-border);
  display: flex;
  flex-direction: column;
}

.sidebar__brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px 20px 20px;
}

.sidebar__logo {
  flex-shrink: 0;
}

.sidebar__title {
  font-size: 16px;
  font-weight: 700;
  color: var(--moona-text);
  line-height: 1.2;
}

.sidebar__sub {
  font-size: var(--moona-font-caption);
  color: var(--moona-text-muted);
  margin-top: 2px;
}

.sidebar__nav {
  flex: 1;
  overflow-y: auto;
  padding: 8px 12px 24px;
}

.sidebar__group {
  margin-bottom: 20px;
}

.sidebar__group-label {
  font-size: var(--moona-font-caption);
  font-weight: 600;
  color: var(--moona-text-muted);
  padding: 0 12px 8px;
  letter-spacing: 0.02em;
}

.sidebar__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  margin-bottom: 4px;
  border-radius: var(--moona-radius-sm);
  color: var(--moona-text-secondary);
  font-size: var(--moona-font-body);
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: #f6f8fb;
    color: var(--moona-text);
  }

  &.is-active {
    background: var(--moona-primary-soft);
    color: var(--moona-primary-text);
    font-weight: 600;

    .sidebar__icon {
      color: var(--moona-primary-text);
    }
  }
}

.sidebar__icon {
  font-size: 18px;
  color: var(--moona-text-muted);
}
</style>
