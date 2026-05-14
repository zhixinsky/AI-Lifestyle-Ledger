<template>
  <view class="legal-page">
    <view class="nav" :style="{ paddingTop: statusPad, paddingRight: menuSafeRight }">
      <view class="back" @tap="goBack">‹</view>
      <text class="nav-title">用户服务协议</text>
      <view class="nav-spacer" />
    </view>

    <scroll-view scroll-y class="content">
      <view class="paper">
        <text class="title">AI生活账本用户服务协议</text>
        <text class="meta">更新日期：2026年5月13日</text>
        <text class="meta">生效日期：2026年5月13日</text>

        <text class="paragraph">欢迎使用 AI生活账本。请你在注册、登录或使用本小程序前，仔细阅读并充分理解本协议全部内容。你自主勾选同意后，即表示你已阅读、理解并接受本协议。</text>

        <text class="section-title">一、服务内容</text>
        <text class="paragraph">AI生活账本为你提供记账、账单管理、消费统计、预算管理、财富成长辅助、AI账单识别和AI财务问答等服务。具体功能以小程序实际展示为准。</text>
        <text class="paragraph">本服务仅用于日常个人财务记录和辅助分析，不构成投资、理财、税务、法律或其他专业建议。你应结合自身情况独立判断并承担相应决策责任。</text>

        <text class="section-title">二、账号登录与使用</text>
        <text class="paragraph">你可以通过微信快捷登录、手机号验证码登录等方式使用本服务。你应保证提交的信息真实、准确、合法、有效，并妥善保管账号及设备安全。</text>
        <text class="paragraph">因你主动泄露账号信息、设备遗失、授权他人使用或操作不当造成的损失，由你自行承担。</text>

        <text class="section-title">三、用户行为规范</text>
        <text class="paragraph">你不得利用本服务从事违法违规活动，不得上传、发布、传输违法、有害、侵权、虚假或可能干扰服务正常运行的内容。</text>
        <text class="paragraph">你不得对本服务进行反向工程、恶意攻击、批量抓取、绕过安全措施或其他损害平台、其他用户及第三方合法权益的行为。</text>

        <text class="section-title">四、AI功能说明</text>
        <text class="paragraph">AI识别和AI问答结果由算法根据你输入或授权处理的数据生成，可能存在不准确、不完整或不适用于你个人情况的内容。你应自行核对账单、金额、分类和建议。</text>
        <text class="paragraph">涉及重要财务安排、投资理财、借贷、保险、税务等事项时，请咨询具备资质的专业机构或专业人士。</text>

        <text class="section-title">五、费用与会员</text>
        <text class="paragraph">部分功能可能需要付费或开通会员后使用。涉及收费的功能，我们会在你购买前展示价格、服务内容、有效期和支付方式。你应在确认后再进行支付。</text>

        <text class="section-title">六、知识产权</text>
        <text class="paragraph">本小程序中的界面、文本、图片、图标、程序代码、模型交互设计等内容，除依法属于用户或第三方的内容外，相关知识产权归服务提供方或合法权利人所有。</text>
        <text class="paragraph">未经授权，你不得复制、传播、改编、出售或用于商业用途。</text>

        <text class="section-title">七、服务变更、中断与终止</text>
        <text class="paragraph">我们可能根据运营、安全、合规或技术需要，对服务内容进行调整、暂停或终止。我们会尽合理努力保障服务连续性，但不承诺服务永不中断或完全无错误。</text>

        <text class="section-title">八、责任限制</text>
        <text class="paragraph">在法律允许范围内，因不可抗力、网络故障、第三方服务异常、用户操作不当或其他非我们可合理控制原因导致的损失，我们不承担超出法律规定范围的责任。</text>

        <text class="section-title">九、未成年人保护</text>
        <text class="paragraph">若你为未成年人，应在监护人同意和指导下使用本服务。监护人应履行对未成年人使用网络服务的监护责任。</text>

        <text class="section-title">十、协议更新</text>
        <text class="paragraph">我们可能根据法律法规、产品功能或运营需要更新本协议。更新后会在小程序内展示最新版本。若你不同意更新内容，可以停止使用相关服务。</text>

        <text class="section-title">十一、联系我们</text>
        <text class="paragraph">如你对本协议或服务有疑问、投诉或建议，可通过小程序内反馈入口或客服联系方式与我们联系。</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
const statusPad = (() => {
  try {
    const sys = uni.getSystemInfoSync();
    return `${(sys.statusBarHeight || 0) + 16}px`;
  } catch {
    return '32px';
  }
})();

const menuSafeRight = (() => {
  // #ifdef MP-WEIXIN
  try {
    const rect = uni.getMenuButtonBoundingClientRect?.();
    const sys = uni.getSystemInfoSync();
    if (rect?.left) return `${Math.max(24, sys.windowWidth - rect.left + 16)}px`;
  } catch {
    /* ignore */
  }
  // #endif
  return '24rpx';
})();

function goBack() {
  const pages = getCurrentPages();
  if (pages.length > 1) {
    uni.navigateBack();
  } else {
    uni.switchTab({ url: '/pages/index/index' });
  }
}
</script>

<style scoped>
.legal-page {
  min-height: 100vh;
  background: #f7f8fa;
  color: #1e1e1e;
}

.nav {
  position: relative;
  min-height: 96rpx;
  padding-left: 18rpx;
  display: flex;
  align-items: center;
  background: rgba(247, 248, 250, 0.96);
}

.back,
.nav-spacer {
  width: 88rpx;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back {
  font-size: 54rpx;
  color: #1e1e1e;
}

.nav-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 360rpx;
  text-align: center;
  font-size: 32rpx;
  font-weight: 700;
  color: #1e1e1e;
}

.content {
  height: calc(100vh - 128rpx - env(safe-area-inset-top, 0px));
}

.paper {
  padding: 44rpx 36rpx 64rpx;
}

.title {
  display: block;
  font-size: 40rpx;
  font-weight: 800;
  line-height: 1.35;
  margin-bottom: 18rpx;
}

.meta {
  display: block;
  font-size: 24rpx;
  color: #667085;
  line-height: 1.7;
}

.section-title {
  display: block;
  margin-top: 36rpx;
  margin-bottom: 12rpx;
  font-size: 30rpx;
  font-weight: 700;
  line-height: 1.45;
}

.paragraph {
  display: block;
  margin-top: 12rpx;
  font-size: 28rpx;
  color: #344054;
  line-height: 1.8;
}
</style>
