<template>
  <div class="admin-layout">
    <Sidebar />
    <div class="admin-layout__main">
      <Topbar />
      <main class="admin-layout__content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import Sidebar from '@/components/layout/Sidebar.vue';
import Topbar from '@/components/layout/Topbar.vue';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();

onMounted(() => {
  if (!auth.admin) auth.fetchMe();
});
</script>

<style scoped lang="scss">
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: var(--moona-bg);
}

.admin-layout__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.admin-layout__content {
  flex: 1;
  width: 100%;
  min-width: 0;
  padding: var(--moona-content-padding-y) var(--moona-content-padding-x);
  padding-bottom: 24px;
  overflow: auto;
}
</style>
