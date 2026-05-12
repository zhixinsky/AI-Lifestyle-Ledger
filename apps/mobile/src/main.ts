import { createSSRApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';

export function createApp() {
  const app = createSSRApp(App);
  (app as unknown as { use(plugin: unknown): void }).use(createPinia());
  return { app };
}
