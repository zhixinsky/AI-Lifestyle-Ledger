import { defineStore } from 'pinia';

/** 全局登录抽屉（勿挂在 App.vue，微信小程序会缺 LoginModal.js） */
export const useLoginSheetStore = defineStore('loginSheet', {
  state: () => ({
    visible: false,
  }),
  actions: {
    open() {
      this.visible = true;
    },
    close() {
      this.visible = false;
    },
    onSuccess() {
      this.visible = false;
      uni.$emit('login-success');
    },
  },
});
