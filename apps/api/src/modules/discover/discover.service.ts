import { Injectable, NotFoundException } from '@nestjs/common';
import { ArticleCategory } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DiscoverService {
  constructor(private readonly prisma: PrismaService) {}

  async seedArticles() {
    const articles = [
      {
        title: '记账入门：如何养成每日记账习惯',
        summary: '从零开始学记账，掌握三个简单技巧让记账变成像刷牙一样自然的习惯。',
        content: `# 记账入门：如何养成每日记账习惯

## 为什么要记账？

记账不只是记录数字，更是了解自己消费模式的重要工具。通过记账，你可以：
- 清楚知道钱花在哪里
- 发现不必要的消费
- 为储蓄和投资做更好的规划

## 三个简单技巧

### 1. 随手记
消费后立刻记录，不要等到晚上回忆。用 Moona 的语音记账功能，说一句话就能完成记录。

### 2. 设定提醒
每天晚上 9 点检查当天账单，补录遗漏的消费。

### 3. 每周回顾
每周花 5 分钟看看消费分类，了解自己的消费结构。

## 坚持的秘密

不要追求完美。漏记了一天没关系，重要的是养成持续的习惯。Moona 的 AI 助手会帮你分析消费趋势，让记账变得有成就感。`,
        category: ArticleCategory.knowledge,
      },
      {
        title: '50/30/20 法则：最简单的预算分配方法',
        summary: '学会用 50/30/20 法则管理收入，轻松实现财务平衡。',
        content: `# 50/30/20 法则

## 什么是 50/30/20 法则？

这是一个简单而有效的预算分配原则：
- **50% 必要开支**：房租、水电、交通、饮食等生活必需品
- **30% 想要的东西**：娱乐、购物、旅行等享受型消费
- **20% 储蓄与投资**：存款、基金、保险等

## 如何使用

### 第一步：计算税后收入
把每月到手的工资作为基数。

### 第二步：分配预算
假设月收入 8000 元：
- 必要开支：4000 元
- 自由消费：2400 元
- 储蓄投资：1600 元

### 第三步：用 Moona 追踪
在 Moona 中设置对应的预算类别，AI 会自动帮你监控各项支出是否超标。

## 灵活调整

这个比例不是固定的，可以根据你的实际情况调整。刚开始工作的年轻人，可以适当增加储蓄比例；有房贷的家庭，必要开支比例可能更高。`,
        category: ArticleCategory.tip,
      },
      {
        title: '存钱小妙招：每天少花一杯奶茶钱',
        summary: '一杯奶茶的钱看似微不足道，但积少成多，一年就能存下不少。',
        content: `# 存钱小妙招

## 奶茶效应

一杯奶茶 15-30 元，看起来不多，但算算：
- 每天一杯，月消费 450-900 元
- 一年就是 5400-10800 元
- 如果投资，5 年后可能变成 3-6 万元

## 实用存钱技巧

### 1. 延迟消费法
想买非必需品？先等 24 小时。很多冲动消费在等待后就不想买了。

### 2. 52 周存钱法
第 1 周存 10 元，第 2 周存 20 元...第 52 周存 520 元。一年下来存了 13780 元！

### 3. 零钱罐法
设置 Moona 的存钱目标，每次消费后把零头存进去。

### 4. 替代消费法
自己做咖啡代替星巴克，在家做饭代替外卖。品质不降低，开支大大减少。

## 关键原则

**先储蓄后消费**。发工资当天就把储蓄部分转走，用剩下的钱生活。这就是"支付给自己"的理念。`,
        category: ArticleCategory.tip,
      },
      {
        title: 'AI 记账指南：用对话的方式管理财务',
        summary: '学会使用 Moona 的 AI 功能，让记账效率提升 10 倍。',
        content: `# AI 记账指南

## Moona AI 能做什么？

### 语音记账
直接对 Moona 说："午饭花了 35 元"，AI 自动识别金额、分类并记录。

### 智能分类
AI 会根据你的描述自动匹配最合适的消费分类，准确率超过 95%。

### 财务分析
问 AI："这个月花了多少钱？"、"最大的支出是什么？"，即时获得分析结果。

### 预算建议
AI 会根据你的消费习惯，给出个性化的预算建议和省钱方案。

## 使用技巧

### 自然语言记账
你可以这样说：
- "今天打车花了 25"
- "超市买菜 68.5 元"
- "发工资了，到账 8500"

### 批量导入
如果有多笔消费，可以一次说多笔：
- "早餐 15，午饭 30，晚饭 45"

### 查询分析
- "这周一共花了多少？"
- "上个月吃饭花了多少？"
- "帮我分析一下消费情况"`,
        category: ArticleCategory.knowledge,
      },
      {
        title: '7天记账挑战：开启你的财务自由之路',
        summary: '参加 7 天挑战，养成记账习惯，迈出财务管理的第一步。',
        content: `# 7天记账挑战

## 挑战规则

连续 7 天，每天记录至少一笔账单。完成后获得"坚持记账7天"勋章！

## 每日任务

### Day 1：记录所有消费
今天开始，每一笔花销都记下来。

### Day 2：回顾昨天的消费
看看昨天的记录，哪些是必要消费，哪些可以省下来？

### Day 3：设置预算
根据前两天的数据，为这周设一个简单的预算。

### Day 4：尝试语音记账
用 Moona 的语音功能记账，感受效率提升。

### Day 5：分析消费分类
看看你的钱主要花在哪些分类上。

### Day 6：设定存钱目标
创建一个小目标，比如"每月存 500 元"。

### Day 7：总结与计划
回顾这一周的记账数据，制定下周的财务计划。

## 挑战奖励

完成 7 天挑战，你将获得：
- 🔥 "坚持记账7天" 勋章
- 对自己消费模式的清晰认知
- 一个可持续的记账习惯`,
        category: ArticleCategory.challenge,
      },
    ];

    let seeded = 0;
    for (const article of articles) {
      const existing = await this.prisma.article.findFirst({
        where: { title: article.title },
      });
      if (!existing) {
        await this.prisma.article.create({ data: article });
        seeded++;
      }
    }
    return { seeded };
  }

  async listArticles(category?: ArticleCategory, page = 1, pageSize = 20) {
    const where: any = { published: true };
    if (category) where.category = category;

    const [items, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        select: { id: true, title: true, summary: true, coverUrl: true, category: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.article.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async getArticle(id: string) {
    const article = await this.prisma.article.findUnique({ where: { id } });
    if (!article) throw new NotFoundException('文章不存在');
    return article;
  }
}
