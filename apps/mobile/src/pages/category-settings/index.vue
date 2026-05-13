<template>
  <view class="page">
    <!-- 顶栏 -->
    <view class="navbar">
      <view class="nav-back" @tap="goBack">
        <view class="back-glass" />
        <image class="back-icon" :src="backIcon" />
      </view>
      <text class="nav-title">类别设置</text>
      <view class="nav-placeholder" />
    </view>

    <!-- 支出/收入 切换 -->
    <view class="tab-bar">
      <view
        :class="['tab-item', { active: currentType === 'expense' }]"
        @tap="currentType = 'expense'"
      >
        <text>支出</text>
      </view>
      <view
        :class="['tab-item', { active: currentType === 'income' }]"
        @tap="currentType = 'income'"
      >
        <text>收入</text>
      </view>
    </view>

    <!-- 分类列表 -->
    <view class="list">
      <view
        v-for="cat in filteredCategories"
        :key="cat.id"
        class="list-item"
      >
        <view class="del-btn" @tap="confirmDelete(cat)">
          <text class="del-icon">⊖</text>
        </view>
        <view class="item-icon">
          <text>{{ cat.icon }}</text>
        </view>
        <text class="item-name">{{ cat.name }}</text>
        <view class="drag-handle">
          <text>☰</text>
        </view>
      </view>

      <view v-if="!filteredCategories.length" class="empty">
        <text>暂无分类</text>
      </view>
    </view>

    <!-- 底部：添加类别 -->
    <view class="bottom-bar" @tap="showAddDialog = true">
      <text class="add-text">+ 添加类别</text>
    </view>

    <!-- 新增弹窗 -->
    <view v-if="showAddDialog" class="dialog-mask" @tap="showAddDialog = false">
      <view class="dialog" @tap.stop>
        <text class="dialog-title">新增分类</text>

        <view class="form-row">
          <text class="form-label">名称</text>
          <input
            class="form-input"
            v-model="newName"
            placeholder="输入分类名称"
          />
        </view>

        <view class="form-row">
          <text class="form-label">图标</text>
          <view class="emoji-grid">
            <view
              v-for="em in emojiList"
              :key="em"
              :class="['emoji-cell', { selected: newIcon === em }]"
              @tap="newIcon = em"
            >
              <text>{{ em }}</text>
            </view>
          </view>
        </view>

        <view class="dialog-actions">
          <view class="btn-cancel" @tap="showAddDialog = false">
            <text>取消</text>
          </view>
          <view class="btn-confirm" @tap="doAdd">
            <text>确定</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { backIcon } from '@/utils/icons';
import { useFinanceStore } from '@/stores/finance';
import type { Category, TransactionType } from '@/types/domain';

const finance = useFinanceStore();
const currentType = ref<TransactionType>('expense');
const showAddDialog = ref(false);
const newName = ref('');
const newIcon = ref('📌');

const emojiList = [
  '🍽️', '🛍️', '🧴', '🚌', '🥕', '🍒', '🧁', '🚴',
  '🎮', '📞', '👗', '🏠', '🛋️', '🍷', '🚗', '📱',
  '👤', '👶', '💄', '👴', '🍻', '✈️', '🏥', '📖',
  '🎓', '🐶', '💴', '🎁', '💼', '🔧', '❤️', '🎰',
  '📦', '💰', '📈', '🏆', '🧧', '💸', '🧾', '📌',
];

const filteredCategories = computed(() =>
  finance.categories.filter((c) => c.type === currentType.value)
);

const colorMap: Record<string, string> = {
  '🍽️': '#FFB86B', '🛍️': '#FF8A65', '🧴': '#90CAF9', '🚌': '#7C8CFF',
  '🥕': '#66BB6A', '🍒': '#EF5350', '🧁': '#F48FB1', '🚴': '#42A5F5',
  '🎮': '#A78BFA', '📞': '#26A69A', '👗': '#EC407A', '🏠': '#60A5FA',
  '🛋️': '#8D6E63', '🍷': '#AB47BC', '🚗': '#5C6BC0', '📱': '#78909C',
  '👤': '#FFA726', '👶': '#FFCA28', '💄': '#F06292', '👴': '#A1887F',
  '🍻': '#FF7043', '✈️': '#29B6F6', '🏥': '#34D399', '📖': '#8D6E63',
  '🎓': '#FBBF24', '🐶': '#BCAAA4', '💴': '#EF5350', '🎁': '#E91E63',
  '💼': '#607D8B', '🔧': '#9E9E9E', '❤️': '#E57373', '🎰': '#7E57C2',
  '📦': '#FF8A65', '💰': '#00D4C8', '📈': '#66BB6A', '🏆': '#FFB300',
  '🧧': '#EF5350', '💸': '#26C6DA', '🧾': '#9CCC65', '📌': '#78909C',
};

function goBack() {
  const pages = getCurrentPages();
  if (pages.length > 1) {
    uni.navigateBack();
  } else {
    uni.switchTab({ url: '/pages/mili/index' });
  }
}

function confirmDelete(cat: Category) {
  uni.showModal({
    title: '删除分类',
    content: `确定删除「${cat.name}」吗？`,
    confirmColor: '#EF5350',
    success: async (res) => {
      if (!res.confirm) return;
      try {
        await finance.removeCategory(cat.id);
        uni.showToast({ title: '已删除', icon: 'success' });
      } catch (e: any) {
        uni.showToast({ title: e?.message || '删除失败', icon: 'none' });
      }
    }
  });
}

async function doAdd() {
  const name = newName.value.trim();
  if (!name) {
    uni.showToast({ title: '请输入名称', icon: 'none' });
    return;
  }
  try {
    await finance.addCategory({
      name,
      icon: newIcon.value,
      color: colorMap[newIcon.value] || '#78909C',
      type: currentType.value,
    });
    showAddDialog.value = false;
    newName.value = '';
    newIcon.value = '📌';
    uni.showToast({ title: '已添加', icon: 'success' });
  } catch (e: any) {
    uni.showToast({ title: e?.message || '添加失败', icon: 'none' });
  }
}

onMounted(() => {
  if (!finance.categories.length) {
    finance.loadCategories();
  }
});
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f7f8fa;
  display: flex;
  flex-direction: column;
}

/* 顶栏 */
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  padding: 0 32rpx;
  margin-top: env(safe-area-inset-top, 44px);
  background: #fff;
}

.nav-back {
  position: relative;
  width: 68rpx;
  height: 68rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.back-glass {
  position: absolute;
  top: 0; right: 0; bottom: 0; left: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1rpx solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06),
              inset 0 1rpx 0 rgba(255, 255, 255, 0.8);
}

.back-icon {
  position: relative;
  z-index: 1;
  width: 36rpx;
  height: 36rpx;
  margin-left: -2rpx;
}

.nav-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #1e1e1e;
}

.nav-placeholder {
  width: 120rpx;
}

/* 切换 Tab */
.tab-bar {
  display: flex;
  margin: 24rpx 32rpx 0;
  background: #eef2f6;
  border-radius: 16rpx;
  overflow: hidden;
}

.tab-item {
  flex: 1;
  text-align: center;
  height: 72rpx;
  line-height: 72rpx;
  font-size: 28rpx;
  color: #88909b;
  font-weight: 500;
  border-radius: 16rpx;
  transition: all 0.25s;
}

.tab-item.active {
  background: #1e1e1e;
  color: #fff;
  font-weight: 700;
}

/* 列表 */
.list {
  flex: 1;
  margin-top: 16rpx;
  background: #fff;
}

.list-item {
  display: flex;
  align-items: center;
  padding: 0 32rpx;
  height: 100rpx;
  border-bottom: 1rpx solid #f0f1f3;
}

.del-btn {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16rpx;
}

.del-icon {
  font-size: 40rpx;
  color: #EF5350;
}

.item-icon {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  margin-right: 20rpx;
}

.item-name {
  flex: 1;
  font-size: 30rpx;
  color: #1e1e1e;
}

.drag-handle {
  font-size: 32rpx;
  color: #ccc;
  padding: 0 8rpx;
}

.empty {
  padding: 80rpx 0;
  text-align: center;
  color: #88909b;
  font-size: 28rpx;
}

/* 底部添加 */
.bottom-bar {
  background: #fff;
  border-top: 1rpx solid #f0f1f3;
  padding: 24rpx 0 calc(env(safe-area-inset-bottom, 0px) + 24rpx);
  text-align: center;
}

.add-text {
  font-size: 30rpx;
  color: #344054;
  font-weight: 500;
}

/* 弹窗 */
.dialog-mask {
  position: fixed;
  top: 0; right: 0; bottom: 0; left: 0;
  z-index: 20000;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog {
  width: 600rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 40rpx;
}

.dialog-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #1e1e1e;
  text-align: center;
  margin-bottom: 32rpx;
}

.form-row {
  margin-bottom: 24rpx;
}

.form-label {
  font-size: 26rpx;
  color: #88909b;
  margin-bottom: 12rpx;
  display: block;
}

.form-input {
  height: 80rpx;
  border: 2rpx solid #eef2f6;
  border-radius: 12rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  color: #1e1e1e;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 8rpx;
}

.emoji-cell {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12rpx;
  font-size: 28rpx;
  border: 2rpx solid transparent;
  transition: all 0.2s;
}

.emoji-cell.selected {
  border-color: #00d4c8;
  background: rgba(0, 212, 200, 0.1);
}

.dialog-actions {
  display: flex;
  gap: 20rpx;
  margin-top: 32rpx;
}

.btn-cancel,
.btn-confirm {
  flex: 1;
  height: 80rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  font-weight: 600;
}

.btn-cancel {
  background: #eef2f6;
  color: #344054;
}

.btn-confirm {
  background: #00d4c8;
  color: #fff;
}
</style>
