<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-card__brand">🌙 Moona</div>
      <p class="login-card__sub">AI生活账本 · 运营中台</p>
      <el-form :model="form" @submit.prevent="onSubmit">
        <el-form-item label="用户名">
          <el-input v-model="form.username" placeholder="admin" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" show-password placeholder="admin123456" />
        </el-form-item>
        <el-button type="primary" native-type="submit" :loading="loading" style="width: 100%">
          登录
        </el-button>
      </el-form>
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
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e8f1ff 0%, #f0fdf9 50%, #eef2ff 100%);
}

.login-card {
  width: 400px;
  padding: 40px;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 20px 60px rgba(91, 141, 239, 0.15);
}

.login-card__brand {
  font-size: 28px;
  font-weight: 700;
  text-align: center;
}

.login-card__sub {
  text-align: center;
  color: var(--moona-muted);
  margin: 8px 0 28px;
}
</style>
