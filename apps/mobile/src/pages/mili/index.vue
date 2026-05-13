<template>
  <view class="page">
    <!-- 动态氛围底 -->
    <view class="page-bg" aria-hidden="true">
      <view class="page-bg__base" />
      <view class="page-bg__mint" />
      <view class="page-bg__cyan" />
      <view class="page-bg__lilac" />
      <view class="page-bg__grain" />
    </view>

    <view class="mili-main">
      <view class="hub">
          <view class="hub-top" :style="{ paddingTop: statusPad }">
            <text class="hub-greet">{{ timeHello }}，{{ userName }}</text>
            <text class="hub-sub">{{ miliSubtitle }}</text>
          </view>

          <view class="air-cards">
            <view class="air-card air-card-spend">
              <view class="air-card-head">
                <text class="air-label">本月已消费</text>
                <image
                  class="air-head-icon"
                  :src="eyeToggleIconUri"
                  mode="aspectFit"
                  @tap.stop="toggleHideSpend"
                />
              </view>
              <view class="air-card-body">
                <text class="air-amount">{{ spendAmountDisplay }}</text>
                <text class="air-trend">{{ compareTrendText }}</text>
                <view class="health-curve-box">
                  <view class="health-glow-line" />
                  <image class="health-curve-img" :src="healthCurveUri" mode="scaleToFill" />
                </view>
              </view>
            </view>
            <view class="air-card air-card-insight">
              <view class="air-card-head air-card-head-insight">
                <text class="air-label insight-title">AI 米粒观察</text>
                <text class="air-sparkle" aria-hidden="true">✨</text>
              </view>
              <view class="air-card-body air-card-body-insight">
                <view class="insight-body">
                  <text class="insight-copy">{{ insightDisplay }}</text>
                </view>
              </view>
              <image class="insight-avatar" src="/static/images/ai1.png" mode="aspectFit" />
            </view>
          </view>

          <view class="orb-stage">
            <view class="ai-orbit-wrap" aria-hidden="true">
              <view class="glow-base" />
              <view class="orbit orbit-1" />
              <view class="orbit orbit-2" />
              <view class="orbit orbit-3" />
            </view>
            <view
              v-for="p in orbFloatSlots"
              :key="p.id"
              class="orb-float-pill"
              :class="[`orb-float-pill--s${p.position}`, { 'orb-float-pill--show': p.visible }]"
            >
              <view class="orb-float-pill__bubble">
                <view class="orb-float-pill__text">{{ p.text }}</view>
                <view class="orb-float-pill__tail" aria-hidden="true" />
              </view>
            </view>
            <view class="mili-orb" :class="orbState">
              <view class="orb-mascot-slot">
                <image class="orb-mascot" src="/static/images/ai.png" mode="aspectFit" />
              </view>
            </view>
          </view>

          <view class="hub-bottom-actions">
            <view v-if="voiceTranscriptVisible" class="voice-live-zone">
              <text v-if="voiceLiveText" class="voice-live-text">{{ voiceLiveText }}</text>
              <text v-else-if="recording" class="voice-live-placeholder">正在聆听…</text>
              <text v-if="parsing" class="voice-live-parsing">AI 理解中…</text>
            </view>

            <view
              class="voice-pill"
              :class="{ active: recording, busy: parsing }"
              @touchstart.prevent="onHoldStart"
              @touchend.prevent="onHoldEnd"
              @touchcancel.prevent="onHoldEnd"
              @mousedown.prevent="onHoldStart"
              @mouseup.prevent="onHoldEnd"
              @mouseleave.prevent="onHoldEnd"
            >
              <view class="voice-pill__glass" aria-hidden="true" />
              <view class="voice-pill__sheen" aria-hidden="true" />
              <view class="voice-pill__rim" aria-hidden="true" />
              <view class="voice-pill__content">
                <view class="voice-pill__row">
                  <image class="voice-pill__mic" :src="voiceMicSrc" mode="aspectFit" />
                  <view class="voice-copy">
                    <text class="voice-title">{{ recording ? '松开 识别' : parsing ? 'AI 识别中…' : '按住说话' }}</text>
                    <text class="voice-sub">{{ voiceSubLine }}</text>
                  </view>
                </view>
              </view>
            </view>

            <view class="manual-glass" @tap="openEditor">
              <image class="manual-icon" :src="manualPencilIcon" mode="aspectFit" />
              <text class="manual-label">手动记录</text>
              <image class="manual-chevron" :src="manualChevronIcon" mode="aspectFit" />
            </view>
          </view>
        </view>
    </view>

    <AppTabbar current="mili" />

    <TransactionEditor
      v-model="form"
      variant="sheet"
      :visible="editorVisible"
      :saving="saving"
      :categories="categories"
      @save="handleEditorSave"
      @close="editorVisible = false"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import AppTabbar from '@/components/AppTabbar.vue';
import TransactionEditor from '@/components/TransactionEditor.vue';
import { aiApi } from '@/api/ai';
import { useAiStore } from '@/stores/ai';
import { useFinanceStore } from '@/stores/finance';
import { useAuthStore } from '@/stores/auth';
import { useTransactionForm } from '@/composables/useTransactionForm';
import { svgToUri, makeSvgIcon } from '@/utils/icons';
import { dailyExpenseFromTrend, buildSpendCurveSvgRaw } from './spend-curve';

const aiStore = useAiStore();
const finance = useFinanceStore();
const authStore = useAuthStore();

const categories = computed(() => finance.categories);

const userName = computed(() => authStore.user?.nickname || '用户');

const timeHello = computed(() => {
  const h = new Date().getHours();
  if (h < 5) return '夜深了';
  if (h < 12) return '早上好';
  if (h < 14) return '中午好';
  if (h < 18) return '下午好';
  if (h < 23) return '晚上好';
  return '夜深了';
});

const summary = computed(
  () =>
    finance.dashboard || {
      todayExpense: 0,
      monthExpense: 0,
      monthIncome: 0,
      monthlyBudget: 5000,
      streakDays: 0,
      recentTransactions: [],
    }
);

const SUBTITLE_EMPTY = '我是你的AI生活助手米粒，有什么想和我聊聊的吗？';

const SUBTITLE_WITH_DATA = [
  '新的一天开始啦，记账小习惯从今天养成吧。',
  '每一笔记录，都会让米粒更懂你一点点。',
  '今天也记得和米粒打声招呼，聊聊花销或心情吧。',
  '坚持记账的你超棒，米粒在这儿陪你慢慢变好。',
  '有账单想记？按住说话，米粒帮你整理好分类与时间。',
  '看看今天的支出节奏，要不要和米粒一起做个小复盘？',
];

const hasUserRecords = computed(() => {
  const s = summary.value;
  if (s.recentTransactions?.length) return true;
  if (s.monthExpense > 0 || s.monthIncome > 0) return true;
  if (s.streakDays > 0) return true;
  return false;
});

const miliSubtitle = computed(() => {
  if (!hasUserRecords.value) {
    return SUBTITLE_EMPTY;
  }
  const d = new Date();
  const seed = d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate();
  return SUBTITLE_WITH_DATA[seed % SUBTITLE_WITH_DATA.length];
});

function calendarMonthStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function statsQueryMonth() {
  return calendarMonthStr();
}

/** 与接口返回的 statistics.month（YYYY-MM）对齐，用于按日序列与「今天」锚点 */
const statsMonthMeta = computed(() => {
  const label = finance.statistics?.month;
  if (label && /^\d{4}-\d{2}/.test(label)) {
    const y = parseInt(label.slice(0, 4), 10);
    const mo = parseInt(label.slice(5, 7), 10);
    if (y > 1970 && mo >= 1 && mo <= 12) {
      return { year: y, month: mo, label: `${label.slice(0, 4)}-${label.slice(5, 7)}` };
    }
  }
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1, label: calendarMonthStr(d) };
});

const isViewingCurrentMonth = computed(() => statsMonthMeta.value.label === calendarMonthStr());

const healthCurveUri = computed(() => {
  const { year, month } = statsMonthMeta.value;
  const trend = finance.statistics?.trend;
  const series = dailyExpenseFromTrend(trend, year, month);
  const n = series.length;
  let todayIdx = n > 0 ? n - 1 : 0;
  if (isViewingCurrentMonth.value && n > 0) {
    todayIdx = Math.min(Math.max(0, new Date().getDate() - 1), n - 1);
  }
  return svgToUri(buildSpendCurveSvgRaw(series, todayIdx));
});

const MILI_HIDE_SPEND_KEY = 'mili_hide_month_spend';

const hideMonthSpend = ref(false);

const monthSpend = computed(() => {
  const n = summary.value.monthExpense ?? 0;
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
});

const spendAmountDisplay = computed(() => {
  if (hideMonthSpend.value) return '¥······';
  return `¥${monthSpend.value}`;
});

const EYE_ICON_COLOR = 'rgba(48, 92, 80, 0.58)';
const EYE_ON_PATHS =
  '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"/><circle cx="12" cy="12" r="2.5"/>';
const EYE_OFF_PATHS =
  '<path d="M10.7 5.1A11 11 0 0 1 12 5c6.7 0 10 6 10 6a15 15 0 0 1-2 3.5"/><path d="M5.2 5.2A14 14 0 0 0 2 12s3.5 6 10 6c2.9 0 5.3-1 7-2.3"/><path d="M14 14a2.5 2.5 0 0 1-3.5-3.5"/><line x1="2" y1="2" x2="22" y2="22"/>';

const eyeToggleIconUri = computed(() =>
  makeSvgIcon(hideMonthSpend.value ? EYE_OFF_PATHS : EYE_ON_PATHS, EYE_ICON_COLOR, 1.85)
);

function toggleHideSpend() {
  hideMonthSpend.value = !hideMonthSpend.value;
  try {
    uni.setStorageSync(MILI_HIDE_SPEND_KEY, hideMonthSpend.value);
  } catch {
    /* ignore */
  }
}

const compareTrendText = computed(() => {
  const t = finance.statistics?.trend;
  if (!t || t.length < 6) return '继续保持记账，洞察会更准';
  const sorted = [...t].sort((a, b) => a.date.localeCompare(b.date));
  const mid = Math.floor(sorted.length / 2);
  const a = sorted.slice(0, mid).reduce((s, x) => s + (x.expense || 0), 0);
  const b = sorted.slice(mid).reduce((s, x) => s + (x.expense || 0), 0);
  if (a <= 0) return '继续保持记账，洞察会更准';
  const pct = Math.round((1 - b / Math.max(a, 1)) * 100);
  if (pct >= 3) return `比上月少 ${pct}% ↓`;
  if (pct <= -3) return `比上月多 ${Math.abs(pct)}% ↑`;
  return '支出节奏较平稳';
});

const insightDisplay = computed(
  () => aiStore.insight?.text || '记一笔账，让米粒更了解你的日常节奏～'
);

const ORB_HINT_POOL = [
  '这个月花了多少？',
  '最近消费正常吗？',
  '分析我的消费习惯',
  '今天午饭 35 元',
  '我吃饭花了 25',
  '我购物花了 80',
  '打车花了 23',
  '外卖这个月花了多少？',
  '工资到账 8000',
  '帮我看看余额够不够',
  '这笔账记在哪一类？',
  '上周和这周谁花得多？',
  '要不要设个月度预算？',
  '咖啡奶茶花了多少？',
  '房租水电一共多少？',
  '记一笔：下午茶 28',
  '昨晚聚餐人均多少？',
  '试试说「超市 86」',
  '娱乐支出多不多？',
];

type OrbFloatSlot = { id: number; text: string; visible: boolean; position: number };

const ORB_SLOT_COUNT = 6;
const ORB_POSITIONS = [0, 1, 2, 3, 4, 5] as const;

const orbFloatSlots = ref<OrbFloatSlot[]>([]);
let orbFloatTimers: ReturnType<typeof setTimeout>[] = [];

const orbFloatDynamicHints = computed(() => {
  const lines: string[] = [];
  const exp = summary.value.monthExpense ?? 0;
  const inc = summary.value.monthIncome ?? 0;
  const m = new Date().getMonth() + 1;
  if (exp > 0) {
    lines.push(
      `${m}月已消费 ${exp.toLocaleString('zh-CN', { maximumFractionDigits: 0 })} 元，算多吗？`
    );
  }
  if (inc > 0) {
    lines.push(`${m}月收入 ${inc.toLocaleString('zh-CN', { maximumFractionDigits: 0 })} 元`);
  }
  return lines;
});

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function clearOrbFloatTimers() {
  orbFloatTimers.forEach((tid) => clearTimeout(tid));
  orbFloatTimers = [];
}

function scheduleOrbFloatTimer(fn: () => void, ms: number) {
  const id = setTimeout(() => {
    orbFloatTimers = orbFloatTimers.filter((x) => x !== id);
    fn();
  }, ms);
  orbFloatTimers.push(id);
}

function currentOrbTexts(exceptIndex?: number) {
  const s = new Set<string>();
  orbFloatSlots.value.forEach((slot, j) => {
    if (exceptIndex !== undefined && j === exceptIndex) return;
    if (!slot.visible || !slot.text) return;
    s.add(slot.text);
  });
  return s;
}

function pickHintAvoiding(exceptIndex: number) {
  const avoid = currentOrbTexts(exceptIndex);
  const dyn = orbFloatDynamicHints.value.filter(Boolean);
  const merged = shuffleArray([...dyn, ...shuffleArray([...ORB_HINT_POOL])]);
  for (const t of merged) {
    if (!avoid.has(t)) return t;
  }
  return ORB_HINT_POOL[Math.floor(Math.random() * ORB_HINT_POOL.length)]!;
}

function pickPositionAvoiding(exceptIndex: number) {
  const used = new Set<number>();
  orbFloatSlots.value.forEach((slot, j) => {
    if (j === exceptIndex || !slot.visible) return;
    used.add(slot.position);
  });
  const free = ORB_POSITIONS.filter((p) => !used.has(p));
  const pool = free.length ? free : [...ORB_POSITIONS];
  return pool[Math.floor(Math.random() * pool.length)]!;
}

function scheduleOrbSlotCycle(slotIndex: number) {
  const visibleMs = 4200 + Math.random() * 7800;
  scheduleOrbFloatTimer(() => {
    const s = orbFloatSlots.value[slotIndex];
    if (!s) return;
    s.visible = false;
    const gapMs = 520 + Math.random() * 4000;
    scheduleOrbFloatTimer(() => {
      const s2 = orbFloatSlots.value[slotIndex];
      if (!s2) return;
      s2.text = pickHintAvoiding(slotIndex);
      s2.position = pickPositionAvoiding(slotIndex);
      s2.id = Date.now() + slotIndex + Math.floor(Math.random() * 1e6);
      s2.visible = true;
      scheduleOrbSlotCycle(slotIndex);
    }, gapMs);
  }, visibleMs);
}

function initOrbFloatSlots() {
  clearOrbFloatTimers();
  orbFloatSlots.value = Array.from({ length: ORB_SLOT_COUNT }, (_, i) => ({
    id: Date.now() + i,
    text: ORB_HINT_POOL[i % ORB_HINT_POOL.length]!,
    visible: false,
    position: i % ORB_POSITIONS.length,
  }));
  for (let i = 0; i < ORB_SLOT_COUNT; i++) {
    const startMs = Math.random() * 3200 + i * 220;
    scheduleOrbFloatTimer(() => {
      const s = orbFloatSlots.value[i];
      if (!s) return;
      s.text = pickHintAvoiding(i);
      s.position = pickPositionAvoiding(i);
      s.id = Date.now() + i + Math.floor(Math.random() * 1e6);
      s.visible = true;
      scheduleOrbSlotCycle(i);
    }, startMs);
  }
}

const statusPad = ref('120rpx');
const recording = ref(false);
const parsing = ref(false);
const editorVisible = ref(false);
const voiceLiveText = ref('');

const voiceTranscriptVisible = computed(
  () => recording.value || !!voiceLiveText.value || parsing.value
);

const orbState = computed(() => {
  if (parsing.value) return 'think';
  if (recording.value) return 'listen';
  return '';
});

/** 与主按钮统一的深绿描边麦克风（SVG → data URI，各端一致） */
const voiceMicSrc = makeSvgIcon(
  '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><path d="M12 18v4"/><path d="M8 22h8"/>',
  '#134338',
  '2'
);

const MANUAL_TONE = '#4a5a54';

const manualPencilIcon = makeSvgIcon(
  '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5"/>',
  MANUAL_TONE,
  '2'
);

const manualChevronIcon = makeSvgIcon('<path d="M9 6l6 6-6 6"/>', MANUAL_TONE, '2.2');

const voiceSubLine = computed(() => {
  if (parsing.value) return '正在解析语音…';
  if (recording.value) return '松开后自动识别账单';
  return '一句话记录生活';
});

const { saving, form, save } = useTransactionForm(async () => {
  await Promise.all([
    finance.loadDashboard(),
    finance.loadTransactions(),
    finance.loadStatistics({ period: 'month', month: statsQueryMonth() }),
  ]);
});

let wxRecordManager: any = null;
// #ifndef MP-WEIXIN
let recognition: any = null;
// #endif

function setStatusPad() {
  try {
    const h = uni.getSystemInfoSync().statusBarHeight || 44;
    statusPad.value = `${h + 20}px`;
  } catch {
    statusPad.value = '120rpx';
  }
}

onMounted(() => {
  setStatusPad();
  try {
    const v = uni.getStorageSync(MILI_HIDE_SPEND_KEY);
    hideMonthSpend.value = v === true || v === 'true' || v === 1;
  } catch {
    /* ignore */
  }
  // #ifdef MP-WEIXIN
  uni.hideTabBar();
  // #endif
  if (authStore.isLoggedIn) {
    finance.loadDashboard().catch(() => {});
    authStore.loadProfile().catch(() => {});
    Promise.all([
      finance.loadStatistics({ period: 'month', month: statsQueryMonth() }).catch(() => {}),
      aiStore.loadInsight().catch(() => {}),
    ]);
  }
  initOrbFloatSlots();
});

onShow(() => {
  if (!finance.categories.length) {
    finance.loadCategories();
  }
  if (authStore.isLoggedIn) {
    finance.loadDashboard().catch(() => {});
    authStore.loadProfile().catch(() => {});
    Promise.all([
      finance.loadStatistics({ period: 'month', month: statsQueryMonth() }).catch(() => {}),
      aiStore.loadInsight().catch(() => {}),
    ]);
  }
});

function openEditor() {
  form.value = {
    type: 'expense',
    amount: 0,
    categoryId: '',
    occurredAt: new Date().toISOString(),
    remark: '',
    tags: [],
  };
  editorVisible.value = true;
  if (!finance.categories.length) {
    finance.loadCategories();
  }
}

async function handleEditorSave() {
  await save();
  editorVisible.value = false;
  aiStore.loadInsight().catch(() => {});
}

async function parseVoiceBill(text: string) {
  const t = text.trim();
  if (!t || parsing.value) return;
  parsing.value = true;
  try {
    const result = await aiApi.parseBill(t);
    if (result.transactions.length > 0) {
      aiStore.setParsed(t, result.logId, result.transactions);
      uni.navigateTo({ url: '/pages/ai-confirm/index' });
      return;
    }
    const enc = encodeURIComponent(t);
    let path: string;
    if (enc.length > 900) {
      try {
        uni.setStorageSync('MILI_VOICE_PREFILL', t);
      } catch {
        /* ignore */
      }
      path = '/pages/ai/index?from=mili_bridge';
    } else {
      path = `/pages/ai/index?prefill=${enc}`;
    }
    uni.navigateTo({ url: path });
  } catch {
    uni.showToast({ title: '识别失败，请稍后再试', icon: 'none' });
  } finally {
    parsing.value = false;
    voiceLiveText.value = '';
  }
}

function onHoldStart() {
  if (parsing.value) return;
  voiceLiveText.value = '';
  recording.value = true;
  // #ifdef MP-WEIXIN
  startRecordWx();
  // #endif
  // #ifndef MP-WEIXIN
  startRecordH5();
  // #endif
}

function onHoldEnd() {
  // #ifdef MP-WEIXIN
  stopRecordWx();
  // #endif
  // #ifndef MP-WEIXIN
  stopRecordH5();
  // #endif
}

// #ifdef MP-WEIXIN
function initWxRecord() {
  if (wxRecordManager) return;
  const plugin = requirePlugin('WechatSI');
  wxRecordManager = plugin.getRecordRecognitionManager();
  wxRecordManager.onRecognize = (res: { result?: string }) => {
    if (res?.result) voiceLiveText.value = res.result;
  };
  wxRecordManager.onStop = (res: { result?: string }) => {
    recording.value = false;
    const text = (res.result || '').trim();
    voiceLiveText.value = text;
    if (text) {
      parseVoiceBill(text);
    } else {
      voiceLiveText.value = '';
      uni.showToast({ title: '没听清，请再试一次', icon: 'none' });
    }
  };
  wxRecordManager.onError = () => {
    recording.value = false;
    voiceLiveText.value = '';
    uni.showToast({ title: '语音暂不可用', icon: 'none' });
  };
}

function startRecordWx() {
  initWxRecord();
  wxRecordManager.start({ duration: 60000, lang: 'zh_CN' });
}

function stopRecordWx() {
  if (wxRecordManager) wxRecordManager.stop();
}
// #endif

// #ifndef MP-WEIXIN
function startRecordH5() {
  try {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      recording.value = false;
      uni.showToast({ title: '请使用手动记录', icon: 'none' });
      return;
    }
    let lastText = '';
    recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (e: any) => {
      let final = '';
      let interim = '';
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      lastText = final || interim;
      voiceLiveText.value = lastText;
    };
    recognition.onend = () => {
      recording.value = false;
      const t = lastText.trim();
      voiceLiveText.value = t;
      if (t) {
        parseVoiceBill(t);
      } else {
        voiceLiveText.value = '';
      }
    };
    recognition.onerror = () => {
      recording.value = false;
      voiceLiveText.value = '';
    };
    recognition.start();
  } catch {
    recording.value = false;
  }
}

function stopRecordH5() {
  if (recognition) {
    try {
      recognition.stop();
    } catch {
      /* ignore */
    }
  }
}
// #endif

onUnmounted(() => {
  recording.value = false;
  clearOrbFloatTimers();
});
</script>

<style lang="scss" scoped>
@use '@/styles/mili-vision-page-bg.scss' as *;
@use '@/styles/mili-ai-orbit.scss' as *;
@use '@/styles/mili-orb-float-pills.scss' as *;

.page {
  position: relative;
  min-height: 100vh;
  height: 100vh;
  overflow: hidden;
  color: #1a2e28;
}

.mili-main {
  position: relative;
  z-index: 2;
  height: 100vh;
}

.hub {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 36rpx;
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 200rpx);
  box-sizing: border-box;
  overflow-y: auto;
  overflow-x: hidden;
}

.hub-top {
  width: 100%;
  align-self: stretch;
  text-align: left;
  box-sizing: border-box;
  flex-shrink: 0;
}

.hub-greet {
  display: block;
  font-size: 40rpx;
  font-weight: 800;
  color: rgba(22, 56, 48, 0.94);
  letter-spacing: -0.5rpx;
}

/* —— VisionOS / Liquid Glass 空气卡 —— */
.air-cards {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: 16rpx;
  width: 100%;
  margin-top: 22rpx;
  flex-shrink: 0;
}

.air-card {
  flex: 1 1 0;
  min-width: 0;
  min-height: 248rpx;
  display: flex;
  flex-direction: column;
  border-radius: 48rpx;
  padding: 16rpx 14rpx 14rpx;
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.26);
  backdrop-filter: blur(28px);
  -webkit-backdrop-filter: blur(28px);
  border: 3rpx solid rgba(255, 255, 255, 0.52);
  box-shadow:
    0 0 0 1rpx rgba(255, 255, 255, 0.28),
    0 0 20rpx rgba(255, 255, 255, 0.22),
    0 0 40rpx rgba(200, 255, 236, 0.14),
    0 16rpx 44rpx rgba(127, 255, 212, 0.1),
    0 8rpx 24rpx rgba(24, 56, 48, 0.05),
    inset 0 3rpx 14rpx rgba(255, 255, 255, 0.45),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.72),
    inset 0 -3rpx 12rpx rgba(32, 88, 72, 0.04),
    inset 0 -1rpx 0 rgba(127, 255, 212, 0.08);
}

.air-card-spend {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.air-card-head {
  flex-shrink: 0;
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 8rpx;
  padding-bottom: 10rpx;
  margin-bottom: 4rpx;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.28);
  box-shadow:
    0 1rpx 0 rgba(255, 255, 255, 0.38),
    0 8rpx 14rpx -12rpx rgba(24, 56, 48, 0.04);
}

.air-card-head .air-label {
  flex: 1;
  min-width: 0;
  text-shadow: 0 1rpx 0 rgba(255, 255, 255, 0.5);
}

.air-head-icon {
  width: 34rpx;
  height: 34rpx;
  flex-shrink: 0;
  opacity: 0.9;
}

.air-sparkle {
  font-size: 24rpx;
  line-height: 1;
  flex-shrink: 0;
  opacity: 0.9;
  text-shadow:
    0 0 10rpx rgba(255, 236, 160, 0.4),
    0 1rpx 0 rgba(255, 255, 255, 0.45);
}

.air-card-body {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-top: 0;
  padding: 8rpx 4rpx 8rpx;
  box-sizing: border-box;
  border-radius: 22rpx;
  background: linear-gradient(
    168deg,
    rgba(255, 255, 255, 0.12) 0%,
    rgba(255, 255, 255, 0.04) 42%,
    rgba(255, 255, 255, 0) 78%
  );
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, 0.32),
    inset 0 -8rpx 16rpx -14rpx rgba(24, 56, 48, 0.028);
}

.air-card-body .air-amount {
  margin-top: 0;
}

.air-label {
  font-size: 22rpx;
  font-weight: 600;
  color: rgba(48, 92, 80, 0.55);
  letter-spacing: 0.5rpx;
}

.air-amount {
  margin-top: 8rpx;
  font-size: 32rpx;
  font-weight: 900;
  letter-spacing: -1rpx;
  line-height: 1.2;
  color: rgba(22, 56, 48, 0.94);
}

.air-trend {
  margin-top: 6rpx;
  font-size: 22rpx;
  font-weight: 600;
  line-height: 1.4;
  width: 100%;
  white-space: normal;
  word-break: break-word;
  color: rgba(52, 132, 108, 0.88);
}

.health-curve-box {
  position: relative;
  width: 100%;
  height: 52rpx;
  margin-top: auto;
  margin-bottom: 2rpx;
  flex-shrink: 0;
  border-radius: 0 0 16rpx 16rpx;
  overflow: visible;
}

.health-glow-line {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 2rpx;
  height: 14rpx;
  background: radial-gradient(ellipse 100% 100% at 50% 100%, rgba(127, 255, 212, 0.35), transparent 70%);
  filter: blur(8px);
  opacity: 0.85;
  pointer-events: none;
}

.health-curve-img {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  opacity: 0.92;
}

.air-card-insight {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-height: 0;
}

.insight-title {
  flex-shrink: 0;
}

.insight-body {
  flex: 1 1 auto;
  width: 100%;
  margin-top: 0;
  min-height: 0;
  padding-right: 64rpx;
  padding-bottom: 2rpx;
  box-sizing: border-box;
}

.insight-copy {
  font-size: 22rpx;
  line-height: 1.45;
  font-weight: 600;
  color: rgba(28, 72, 60, 0.88);
  letter-spacing: 0.2rpx;
}

.insight-avatar {
  position: absolute;
  right: 8rpx;
  bottom: 8rpx;
  width: 58rpx;
  height: 58rpx;
  border-radius: 14rpx;
  pointer-events: none;
  z-index: 2;
}

.hub-sub {
  display: block;
  margin-top: 10rpx;
  font-size: 26rpx;
  line-height: 1.45;
  color: rgba(48, 92, 80, 0.62);
  padding-right: 24rpx;
}

.orb-stage {
  position: relative;
  margin-top: 40rpx;
  width: 100%;
  max-width: 700rpx;
  height: 440rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mili-orb {
  position: relative;
  z-index: 3;
  width: 276rpx;
  height: 276rpx;
  border-radius: 50%;
  overflow: hidden;
  display: block;
  background: radial-gradient(
    circle at 50% 44%,
    rgba(255, 255, 255, 0.38) 0%,
    rgba(255, 255, 255, 0.06) 48%,
    transparent 68%
  );
  border: none;
  box-shadow: none;
  animation: orb-breathe 3.6s ease-in-out infinite;
}

.mili-orb.listen {
  animation-duration: 2.2s;
}

.mili-orb.think {
  animation-duration: 1.6s;
  filter: brightness(1.03);
}

@keyframes orb-breathe {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.07);
  }
}

.orb-mascot-slot {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  overflow: hidden;
}

.orb-mascot {
  flex-shrink: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.hub-bottom-actions {
  margin-top: auto;
  width: 100%;
  max-width: 620rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  flex-shrink: 0;
  padding-top: 8rpx;
}

.voice-live-zone {
  width: 100%;
  max-width: 620rpx;
  margin-top: 0;
  padding: 0 12rpx;
  box-sizing: border-box;
  min-height: 44rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.voice-live-text {
  font-size: 26rpx;
  line-height: 1.45;
  color: rgba(22, 72, 58, 0.82);
  text-align: center;
  word-break: break-word;
}

.voice-live-placeholder {
  font-size: 24rpx;
  color: rgba(48, 100, 84, 0.45);
}

.voice-live-parsing {
  font-size: 22rpx;
  color: rgba(46, 130, 108, 0.65);
}

.voice-pill {
  position: relative;
  margin-top: 0;
  width: 100%;
  max-width: 620rpx;
  min-height: 152rpx;
  padding: 0;
  border-radius: 999rpx;
  overflow: hidden;
  border: 1rpx solid rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(28px) saturate(118%);
  -webkit-backdrop-filter: blur(28px) saturate(118%);
  box-shadow:
    0 26rpx 76rpx rgba(92, 200, 168, 0.32),
    0 8rpx 24rpx rgba(64, 160, 130, 0.14),
    inset 0 2rpx 0 rgba(255, 255, 255, 0.82),
    inset 0 -18rpx 40rpx rgba(100, 200, 175, 0.14);
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease,
    opacity 0.25s ease;
}

.voice-pill__glass {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    168deg,
    rgba(232, 255, 246, 0.78) 0%,
    rgba(178, 240, 218, 0.52) 40%,
    rgba(118, 214, 188, 0.46) 72%,
    rgba(86, 196, 170, 0.52) 100%
  );
}

.voice-pill__sheen {
  position: absolute;
  top: 0;
  left: 6%;
  right: 22%;
  height: 46%;
  pointer-events: none;
  border-radius: 999rpx 999rpx 50% 50%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.62) 0%, rgba(255, 255, 255, 0) 92%);
  opacity: 0.88;
}

.voice-pill__rim {
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
  box-shadow: inset 0 0 0 1rpx rgba(255, 255, 255, 0.38);
}

.voice-pill__content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28rpx 32rpx;
  min-height: 152rpx;
  box-sizing: border-box;
}

.voice-pill__row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 22rpx;
  max-width: 100%;
}

.voice-pill.active {
  transform: scale(1.02);
  box-shadow:
    0 34rpx 92rpx rgba(100, 220, 185, 0.38),
    0 10rpx 28rpx rgba(64, 170, 140, 0.18),
    inset 0 2rpx 0 rgba(255, 255, 255, 0.92),
    inset 0 -12rpx 36rpx rgba(120, 220, 195, 0.18);
}

.voice-pill.busy {
  opacity: 0.88;
}

.voice-pill__mic {
  width: 52rpx;
  height: 52rpx;
  flex-shrink: 0;
}

.voice-copy {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
  text-align: center;
}

.voice-title {
  font-size: 44rpx;
  font-weight: 800;
  color: rgba(19, 67, 56, 0.96);
  letter-spacing: 0.02em;
  text-align: center;
}

.voice-sub {
  font-size: 24rpx;
  font-weight: 600;
  color: rgba(46, 130, 108, 0.72);
  text-align: center;
}

.manual-glass {
  margin-top: 28rpx;
  margin-bottom: 12rpx;
  padding: 10rpx 28rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14rpx;
  background: rgba(255, 255, 255, 0.48);
  border: 1rpx solid rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(28rpx);
  -webkit-backdrop-filter: blur(28rpx);
  box-shadow: 0 18rpx 48rpx rgba(127, 255, 212, 0.12);
}

.manual-icon {
  width: 34rpx;
  height: 34rpx;
  flex-shrink: 0;
}

.manual-label {
  font-size: 28rpx;
  font-weight: 700;
  color: #4a5a54;
}

.manual-chevron {
  width: 26rpx;
  height: 26rpx;
  flex-shrink: 0;
}
</style>
