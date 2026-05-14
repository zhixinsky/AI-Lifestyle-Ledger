<template>
  <view class="legal-page">
    <view class="nav" :style="{ paddingTop: statusPad, paddingRight: menuSafeRight }">
      <view class="back" @tap="goBack">‹</view>
      <text class="nav-title">隐私政策</text>
      <view class="nav-spacer" />
    </view>

    <scroll-view scroll-y class="content">
      <view class="paper">
        <text class="title">AI生活账本隐私政策</text>
        <text class="meta">更新日期：2026年5月13日</text>
        <text class="meta">生效日期：2026年5月13日</text>

        <text class="paragraph">AI生活账本重视你的个人信息和隐私保护。请你在使用本小程序前仔细阅读本政策。你自主勾选同意后，即表示你已阅读、理解并同意我们按照本政策处理你的相关信息。</text>

        <text class="section-title">一、我们如何收集和使用信息</text>
        <text class="paragraph">1. 登录信息：当你使用微信快捷登录时，我们会通过微信提供的登录凭证识别你的账号；当你使用手机号登录时，我们会处理你的手机号和验证码，用于完成身份验证和账号登录。</text>
        <text class="paragraph">2. 资料信息：你可自主设置昵称、头像等资料。若你选择微信头像或昵称，我们会在你授权后用于展示账号资料。</text>
        <text class="paragraph">3. 记账数据：你主动录入或确认的收入、支出、金额、分类、时间、备注、账单图片识别结果等信息，将用于账单记录、统计分析、预算管理和AI辅助服务。</text>
        <text class="paragraph">4. 设备和日志信息：为保障服务安全和排查故障，我们可能收集设备型号、系统版本、网络状态、操作日志、错误日志等基础信息。</text>
        <text class="paragraph">5. 支付和会员信息：当你购买会员或付费服务时，我们会处理订单号、支付状态、会员有效期等信息，用于完成交易、开通权益和售后处理。</text>

        <text class="section-title">二、我们调用的系统权限</text>
        <text class="paragraph">1. 微信登录能力：用于完成微信快捷登录。</text>
        <text class="paragraph">2. 手机号能力：用于手机号验证码登录和账号绑定。</text>
        <text class="paragraph">3. 相册、相机或文件能力：仅在你主动上传账单图片、选择头像或使用图片识别功能时调用，用于完成你选择的操作。</text>
        <text class="paragraph">4. 麦克风能力：仅在你主动使用语音记账或语音输入时调用，用于识别语音内容。</text>
        <text class="paragraph">你可以在微信或系统设置中管理相关授权。拒绝授权可能导致部分功能无法使用，但不影响其他基础功能。</text>

        <text class="section-title">三、AI服务中的信息处理</text>
        <text class="paragraph">当你使用AI账单识别、AI分析或AI问答时，我们会处理你主动输入、上传或授权使用的账单内容、问题文本、图片识别结果和相关财务数据，以生成识别结果、统计分析或回复内容。</text>
        <text class="paragraph">请勿在AI对话或备注中输入他人的敏感个人信息、账号密码、银行卡完整信息等不必要内容。</text>

        <text class="section-title">四、我们如何保存信息</text>
        <text class="paragraph">我们会在实现本政策所述目的所必需的期限内保存你的信息。超出保存期限后，我们会依法删除或匿名化处理，法律法规另有规定的除外。</text>
        <text class="paragraph">你的账号注销或你主动删除相关数据后，我们会根据法律法规和产品规则处理对应信息。</text>

        <text class="section-title">五、我们如何保护信息</text>
        <text class="paragraph">我们会采取合理的安全措施保护你的个人信息，包括访问控制、传输加密、权限管理、日志审计等措施。但互联网环境并非绝对安全，请你妥善保管账号、验证码和设备。</text>

        <text class="section-title">六、信息共享、转让和公开披露</text>
        <text class="paragraph">我们不会主动向无关第三方共享你的个人信息，除非取得你的单独同意，或为实现登录、支付、云存储、短信验证、AI识别等必要功能而向相关服务提供方提供必要信息。</text>
        <text class="paragraph">我们不会公开披露你的个人信息，法律法规要求、监管机关要求或为保护用户及公共安全所必需的情形除外。</text>

        <text class="section-title">七、你的权利</text>
        <text class="paragraph">你有权查询、更正、删除你的个人信息，也可以撤回授权、注销账号或向我们提出隐私相关投诉与建议。部分请求可能需要验证你的身份后处理。</text>

        <text class="section-title">八、未成年人信息保护</text>
        <text class="paragraph">若你为未成年人，应在监护人同意和指导下使用本服务。若监护人发现未成年人信息被不当处理，可联系我们处理。</text>

        <text class="section-title">九、政策更新</text>
        <text class="paragraph">我们可能根据法律法规、产品功能或运营情况更新本政策。更新后会在小程序内展示最新版本。涉及重大变更时，我们会以合理方式提醒你再次阅读并确认。</text>

        <text class="section-title">十、联系我们</text>
        <text class="paragraph">如你对本隐私政策或个人信息保护有疑问、投诉、建议，或希望行使个人信息相关权利，可通过小程序内反馈入口或客服联系方式与我们联系。</text>
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
