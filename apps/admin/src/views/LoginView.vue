<template>
  <div class="login-page">
    <div class="login-page__panel">
      <div class="login-card">
        <div class="login-card__logo">🌙</div>
        <h1 class="login-card__title">Moona</h1>
        <p class="login-card__sub">AI 运营中台</p>
        <el-form :model="form" size="large" @submit.prevent="onSubmit">
          <el-form-item label="用户名">
            <el-input v-model="form.username" placeholder="admin" />
          </el-form-item>
          <el-form-item label="密码">
            <el-input v-model="form.password" type="password" show-password placeholder="admin123456" />
          </el-form-item>
          <el-button type="primary" native-type="submit" :loading="loading" class="login-card__btn">
            登录
          </el-button>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const loading = ref(false);
const form = reactive({ username: 'admin', password: 'admin123456' });

async function onSubmit() {
  loading.value = true;
  try {
    await auth.login(form.username, form.password);
    ElMessage.success('登录成功');
    router.replace((route.query.redirect as string) || '/dashboard');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  background: var(--moona-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.login-page__panel {
  width: 100%;
  max-width: 420px;
}

.login-card {
  padding: 40px 36px;
  background: #fff;
  border: 1px solid var(--moona-border);
  border-radius: 20px;
  box-shadow: var(--moona-shadow-card);
  text-align: center;
}

.login-card__logo {
  width: 56px;
  height: 56px;
  margin: 0 auto 16px;
  border-radius: 16px;
  background: var(--moona-primary-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.login-card__title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--moona-text);
}

.login-card__sub {
  margin: 8px 0 28px;
  font-size: var(--moona-font-body);
  color: var(--moona-text-secondary);
}

.login-card__btn {
  width: 100%;
  margin-top: 8px;
}

:deep(.el-form-item__label) {
  font-size: var(--moona-font-caption);
}
</style>
