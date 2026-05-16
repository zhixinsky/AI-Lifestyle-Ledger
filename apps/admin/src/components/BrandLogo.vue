<template>
  <img
    class="brand-logo"
    :class="[`brand-logo--${size}`]"
    :src="BRAND_LOGO_WEB_URL"
    alt="Moona"
  />
</template>

<script setup lang="ts">
import { BRAND_LOGO_WEB_URL } from '@/config/brand';

withDefaults(
  defineProps<{
    size?: 'sm' | 'md' | 'lg';
  }>(),
  { size: 'md' },
);
</script>

<style scoped lang="scss">
.brand-logo {
  display: block;
  object-fit: contain;
  border-radius: 12px;
}

.brand-logo--sm {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.brand-logo--md {
  width: 40px;
  height: 40px;
}

.brand-logo--lg {
  width: 56px;
  height: 56px;
  border-radius: 16px;
}
</style>
