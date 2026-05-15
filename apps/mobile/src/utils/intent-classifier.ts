export type VoiceIntent = 'transfer' | 'expense' | 'income' | 'analysis' | 'chat' | 'unknown';

export interface IntentClassifyResult {
  intent: VoiceIntent;
  amount?: number;
  category?: string;
  tag?: string;
  remark?: string;
  confidence: number;
  needAiFallback: boolean;
  matchedKeyword?: string;
}

type CategoryMatch = {
  category: string;
  tag: string;
  matchedKeyword: string;
  confidence: number;
};

const PREFERENCE_KEY = 'mili_voice_category_preferences';

const expenseKeywords = [
  '花了', '买了', '支付', '消费', '付款', '用了', '扣了', '支出', '点了', '下单', '交了', '吃了', '喝了',
];

const transferKeywords = [
  '转账', '转给', '还款', '收款', '微信转', '支付宝转',
];

const incomeKeywords = [
  '收入', '赚了', '到账', '发工资', '工资', '奖金', '提成', '退款', '收款', '转入', '支付宝到账',
  '微信提现', '红包', '报销', '兼职', '理财', '收益', '分红',
];

const analysisKeywords = [
  '分析', '统计', '这个月', '本月', '预算', '消费情况', '花太多', '存不下钱', '最近支出',
  '账单', '收入情况', '支出情况', '这个月花了多少钱', '这个月收入多少', '存钱',
];

const expenseCategoryWords: Record<string, string[]> = {
  餐饮: ['早餐', '午餐', '午饭', '晚餐', '晚饭', '夜宵', '饭', '吃饭', '外卖', '奶茶', '咖啡', '火锅', '烧烤', '麦当劳', '肯德基', '瑞幸', '星巴克', '饮料', '餐厅'],
  购物: ['淘宝', '京东', '拼多多', '抖音商城', '快手', '小红书', '买东西', '购物', '商场', '网购'],
  日用: ['纸巾', '洗发水', '牙膏', '牙刷', '洗衣液', '肥皂', '沐浴露', '生活用品', '日用品'],
  交通: ['打车', '滴滴', '出租车', '地铁', '公交', '车费', '停车', '停车费', '高速', '高速费', '机票', '火车票', '动车票'],
  蔬菜: ['青菜', '白菜', '土豆', '番茄', '西红柿', '黄瓜', '萝卜', '菜市场', '买菜'],
  水果: ['苹果', '香蕉', '橙子', '葡萄', '西瓜', '草莓', '榴莲', '买水果'],
  零食: ['零食', '薯片', '饼干', '糖', '巧克力', '辣条', '冰淇淋', '雪糕'],
  运动: ['健身', '球馆', '篮球', '羽毛球', '游泳', '瑜伽', '跑步', '运动装备'],
  娱乐: ['电影', '游戏', 'KTV', '会员', '视频会员', '演唱会', '剧本杀', '密室'],
  通讯: ['话费', '流量', '手机费', '宽带', '网费', '电话费'],
  服饰: ['衣服', '裤子', '鞋', '帽子', '包', '服装', '穿搭', '袜子'],
  住房: ['房租', '租金', '房贷', '物业', '物业费', '水费', '电费', '燃气费', '暖气费'],
  居家: ['家具', '家电', '床上用品', '锅', '碗', '厨具', '收纳', '家居'],
  烟酒: ['烟', '香烟', '酒', '白酒', '啤酒', '红酒', '茶叶'],
  汽车: ['加油', '油费', '保养', '洗车', '修车', '车险', '停车', '违章', '年检'],
  数码: ['手机', '电脑', '耳机', '键盘', '鼠标', '相机', '充电器', '数据线', '平板'],
  培训: ['培训', '课程', '网课', '补课', '学费', '报名费'],
  孩子: ['孩子', '宝宝', '奶粉', '尿不湿', '玩具', '儿童', '幼儿园'],
  美容: ['美容', '美甲', '美发', '理发', '护肤', '化妆品', '口红', '面膜'],
  长辈: ['爸', '妈', '爸爸', '妈妈', '父母', '老人', '爷爷', '奶奶', '外公', '外婆'],
  社交: ['聚会', '请客', '请朋友', 'AA', '朋友吃饭', '应酬'],
  旅行: ['酒店', '住宿', '门票', '景区', '旅游', '旅行', '机票', '火车票', '行李'],
  医疗: ['医院', '挂号', '药', '买药', '体检', '牙科', '看病', '医保'],
  书籍: ['书', '买书', '小说', '教材', '电子书'],
  学习: ['学习资料', '资料', '文具', '笔', '本子', '考试', '报名', '证书'],
  宠物: ['猫', '狗', '宠物', '猫粮', '狗粮', '宠物医院', '宠物用品'],
  礼金: ['红包', '份子钱', '礼金', '随礼', '人情'],
  礼物: ['礼物', '送礼', '生日礼物', '纪念日礼物'],
  办公: ['办公', '打印', '复印', '文件', '办公用品', '电脑配件'],
  维修: ['维修', '修理', '上门维修', '修电脑', '修手机', '修空调'],
  捐赠: ['捐款', '公益', '慈善', '捐赠'],
  彩票: ['彩票', '刮刮乐', '双色球', '大乐透'],
  亲友: ['亲戚', '朋友', '家人', '同事'],
  快递: ['快递', '运费', '邮费', '顺丰', '京东快递', '菜鸟', '寄件'],
};

const incomeCategoryWords: Record<string, string[]> = {
  工资: ['工资', '发工资', '薪资', '月薪', '工资到账', '发薪', '薪水'],
  兼职: ['兼职', '接单', '外快', '副业', '跑腿', '推广', '佣金', '代练', '接活'],
  理财: ['理财', '基金收益', '股票盈利', '股票赚了', '利息', '余额宝', '收益', '分红', '盈利'],
  奖金: ['奖金', '绩效', '提成', '年终奖', '奖励'],
  红包: ['红包', '微信红包', '收红包', '转账红包'],
  退款: ['退款', '退回', '返现', '退货', '退款到账'],
  报销: ['报销', '报销到账', '公司报销'],
};

const cnDigit: Record<string, number> = {
  零: 0, 〇: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9,
};

function normalizeText(text: string) {
  return text.replace(/，/g, ',').replace(/\s+/g, '').trim();
}

function includesAny(text: string, words: string[]) {
  return words.find((word) => text.includes(word));
}

function parseChineseInteger(input: string) {
  if (!input) return undefined;
  let total = 0;
  let section = 0;
  let number = 0;
  let matched = false;

  for (const ch of input) {
    if (cnDigit[ch] !== undefined) {
      number = cnDigit[ch];
      matched = true;
    } else if (ch === '十') {
      section += (number || 1) * 10;
      number = 0;
      matched = true;
    } else if (ch === '百') {
      section += (number || 1) * 100;
      number = 0;
      matched = true;
    } else if (ch === '千') {
      section += (number || 1) * 1000;
      number = 0;
      matched = true;
    } else if (ch === '万') {
      total += (section + number || 1) * 10000;
      section = 0;
      number = 0;
      matched = true;
    } else {
      return undefined;
    }
  }
  const value = total + section + number;
  return matched && value > 0 ? value : undefined;
}

export function amountParser(text: string) {
  const normalized = normalizeText(text);
  const numericPatterns = [
    /[¥￥](\d+(?:\.\d+)?)([kKwW千万]?)/,
    /(\d+(?:\.\d+)?)([kKwW千万])(?:元|块|块钱)?/,
    /(\d+(?:\.\d+)?)(?:元|块|块钱)/,
    /(?:花了|买了|支付|消费|付款|用了|扣了|支出|点了|下单|交了|吃了|喝了|收入|赚了|到账|发工资|工资|奖金|提成|退款|收款|转入|红包|报销|兼职|收益|分红)(\d+(?:\.\d+)?)([kKwW千万]?)/,
  ];

  for (const pattern of numericPatterns) {
    const match = normalized.match(pattern);
    if (!match?.[1]) continue;
    let value = Number(match[1]);
    const unit = match[2];
    if (unit === '千') value *= 1000;
    if (unit === '万' || unit === 'w' || unit === 'W') value *= 10000;
    if (unit === 'k' || unit === 'K') value *= 1000;
    return value;
  }

  const plainNumeric = normalized.match(/^(\d+(?:\.\d+)?)$/);
  if (plainNumeric?.[1]) return Number(plainNumeric[1]);

  const hasMoneySemantic = includesAny(normalized, [...expenseKeywords, ...incomeKeywords]) ||
    Object.values(expenseCategoryWords).some((words) => includesAny(normalized, words)) ||
    Object.values(incomeCategoryWords).some((words) => includesAny(normalized, words));
  if (hasMoneySemantic) {
    const standalone = normalized.match(/(\d+(?:\.\d+)?)/);
    if (standalone?.[1]) return Number(standalone[1]);
  }

  const numericCandidate = normalized.match(/(\d+(?:\.\d+)?)/);
  if (numericCandidate?.[1]) return Number(numericCandidate[1]);

  const cnMatch = normalized.match(/[零〇一二两三四五六七八九十百千万]+/);
  if (cnMatch) return parseChineseInteger(cnMatch[0]);
  return undefined;
}

function readPreferences(): Record<string, { category: string; type: VoiceIntent }> {
  try {
    return uni.getStorageSync(PREFERENCE_KEY) || {};
  } catch {
    return {};
  }
}

export function saveVoiceCategoryPreference(keyword: string, type: 'expense' | 'income', category: string) {
  if (!keyword || !category) return;
  try {
    const prefs = readPreferences();
    prefs[`${type}:${keyword}`] = { category, type };
    uni.setStorageSync(PREFERENCE_KEY, prefs);
  } catch {
    /* ignore */
  }
}

function preferenceMatch(keyword: string | undefined, type: 'expense' | 'income') {
  if (!keyword) return undefined;
  return readPreferences()[`${type}:${keyword}`]?.category;
}

function classifyByWords(text: string, dict: Record<string, string[]>, type: 'expense' | 'income'): CategoryMatch | undefined {
  for (const [category, words] of Object.entries(dict)) {
    const matchedKeyword = includesAny(text, words);
    if (!matchedKeyword) continue;
    const preferred = preferenceMatch(matchedKeyword, type);
    return {
      category: preferred || category,
      tag: matchedKeyword,
      matchedKeyword,
      confidence: preferred ? 0.98 : 0.9,
    };
  }
  return undefined;
}

export function expenseCategoryClassifier(text: string) {
  return classifyByWords(text, expenseCategoryWords, 'expense');
}

export function incomeCategoryClassifier(text: string) {
  return classifyByWords(text, incomeCategoryWords, 'income');
}

function buildRemark(text: string, amount?: number) {
  let remark = text.trim();
  if (amount !== undefined) {
    remark = remark
      .replace(/[¥￥]\d+(?:\.\d+)?[kKwW千万]?/g, '')
      .replace(/\d+(?:\.\d+)?(?:元|块|块钱|[kKwW千万])?/g, '')
      .replace(/[零〇一二两三四五六七八九十百千万]+(?:元|块|块钱)?/g, '');
  }
  remark = remark
    .replace(/^(我|帮我|记一笔|记录一下|记账|记一下)/, '')
    .replace(/(花了|买了|支付|消费|付款|用了|扣了|支出|点了|下单|交了|吃了|喝了|收入|赚了|到账|发工资|工资|奖金|提成|退款|收款|转入|红包|报销|兼职|理财|收益|分红)/g, '')
    .trim();
  return remark || text.trim();
}

export function classifyVoiceIntent(text: string): IntentClassifyResult {
  const raw = text.trim();
  const normalized = normalizeText(raw);
  if (!normalized) return { intent: 'unknown', confidence: 0, needAiFallback: true };

  const amount = amountParser(normalized);
  const transferKeyword = includesAny(normalized, transferKeywords);
  const incomeKeyword = includesAny(normalized, incomeKeywords);
  const expenseKeyword = includesAny(normalized, expenseKeywords);
  const incomeCategory = incomeCategoryClassifier(normalized);
  const expenseCategory = expenseCategoryClassifier(normalized);
  const analysisKeyword = includesAny(normalized, analysisKeywords);

  if (transferKeyword) {
    return {
      intent: 'transfer',
      amount,
      remark: buildRemark(raw, amount),
      confidence: 0.9,
      needAiFallback: true,
      matchedKeyword: transferKeyword,
    };
  }

  if (incomeKeyword || incomeCategory) {
    const category = incomeCategory || {
      category: '其它收入',
      tag: incomeKeyword || '其它收入',
      matchedKeyword: incomeKeyword || '其它收入',
      confidence: 0.62,
    };
    const confident = category.confidence >= 0.7;
    return {
      intent: 'income',
      amount,
      category: category.category,
      tag: category.tag,
      remark: buildRemark(raw, amount),
      confidence: confident ? 0.95 : 0.66,
      needAiFallback: !confident,
      matchedKeyword: category.matchedKeyword,
    };
  }

  // 明确支出词或分类命中时，本地高置信可直接记账。
  if (amount !== undefined && (expenseKeyword || expenseCategory)) {
    const category = expenseCategory || {
      category: '',
      tag: expenseKeyword || '',
      matchedKeyword: expenseKeyword || '',
      confidence: 0.55,
    };
    const confident = category.confidence >= 0.7;
    return {
      intent: 'expense',
      amount,
      category: confident ? category.category : undefined,
      tag: category.tag || undefined,
      remark: buildRemark(raw, amount),
      confidence: confident ? 0.95 : 0.62,
      needAiFallback: !confident,
      matchedKeyword: category.matchedKeyword || expenseKeyword,
    };
  }

  if (amount !== undefined) {
    return {
      intent: 'expense',
      amount,
      remark: buildRemark(raw, amount),
      confidence: 0.5,
      needAiFallback: true,
    };
  }

  if (analysisKeyword) {
    return {
      intent: 'analysis',
      remark: raw,
      confidence: 0.85,
      needAiFallback: true,
      matchedKeyword: analysisKeyword,
    };
  }

  return {
    intent: 'chat',
    remark: raw,
    confidence: 0.55,
    needAiFallback: true,
  };
}
