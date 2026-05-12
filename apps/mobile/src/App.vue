<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app';
import { initCloudContainer } from '@/utils/request';

onLaunch(() => {
  console.log('Moona launched');
  // #ifdef MP-WEIXIN
  initCloudContainer();
  // #endif
});
</script>

<style>
page {
  min-height: 100%;
  background: #f7f8fa;
  color: #1e1e1e;
  font-family: "PingFang SC", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

view,
text,
button,
input,
textarea {
  box-sizing: border-box;
}

button {
  margin: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
}

button::after {
  border: none;
}

/* 隐藏原生 tabBar */
uni-tabbar,
.uni-tabbar-bottom {
  display: none !important;
}
</style>
