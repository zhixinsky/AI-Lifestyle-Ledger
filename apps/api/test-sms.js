const crypto = require('crypto');

const SMS_APP_ID = 'EUCP-EMY-SMS1-1DAHO';
const SMS_SECRET_KEY = 'CD745860E60D1F55';
const SMS_BASE_URL = 'http://www.btom.cn:8080';

const secretKey = Buffer.from(SMS_SECRET_KEY, 'utf-8');

function aesEncrypt(data) {
  const cipher = crypto.createCipheriv('aes-128-ecb', secretKey, null);
  cipher.setAutoPadding(true);
  return Buffer.concat([cipher.update(data), cipher.final()]);
}

function aesDecrypt(data) {
  const decipher = crypto.createDecipheriv('aes-128-ecb', secretKey, null);
  decipher.setAutoPadding(true);
  return Buffer.concat([decipher.update(data), decipher.final()]);
}

async function testCreateTemplate() {
  const body = {
    templateContent: '【育文游】您的验证码为{#code#}，5分钟内有效，请勿泄露。',
    templateType: 2,
    requestTime: Date.now(),
    requestValidPeriod: 60,
  };

  const json = JSON.stringify(body);
  console.log('Request JSON:', json);

  const encrypted = aesEncrypt(Buffer.from(json, 'utf-8'));
  const url = `${SMS_BASE_URL}/inter/createTemplateSMS`;
  console.log(`POST ${url}`);
  console.log(`appId: ${SMS_APP_ID}`);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        appId: SMS_APP_ID,
        'Content-Type': 'application/octet-stream',
      },
      body: encrypted,
    });

    console.log('HTTP Status:', res.status);
    const resultCode = res.headers.get('result');
    console.log('Result header:', resultCode);

    if (resultCode === 'SUCCESS') {
      const resBuffer = Buffer.from(await res.arrayBuffer());
      const decrypted = aesDecrypt(resBuffer);
      const parsed = JSON.parse(decrypted.toString('utf-8'));
      console.log('Response:', JSON.stringify(parsed, null, 2));
      return parsed.templateId;
    } else {
      console.log('All response headers:');
      res.headers.forEach((v, k) => console.log(`  ${k}: ${v}`));
      const raw = await res.text();
      console.log('Raw body:', raw);
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
  return null;
}

async function testSendSms(templateId, mobile) {
  const body = {
    smses: [{ mobile, customSmsId: `test_${Date.now()}` }],
    templateId,
    requestTime: Date.now(),
    requestValidPeriod: 60,
  };

  const json = JSON.stringify(body);
  console.log('\n--- Send SMS ---');
  console.log('Request JSON:', json);

  const encrypted = aesEncrypt(Buffer.from(json, 'utf-8'));
  const url = `${SMS_BASE_URL}/inter/sendTemplateNormalSMS`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        appId: SMS_APP_ID,
        'Content-Type': 'application/octet-stream',
      },
      body: encrypted,
    });

    console.log('HTTP Status:', res.status);
    const resultCode = res.headers.get('result');
    console.log('Result header:', resultCode);

    if (resultCode === 'SUCCESS') {
      const resBuffer = Buffer.from(await res.arrayBuffer());
      const decrypted = aesDecrypt(resBuffer);
      const parsed = JSON.parse(decrypted.toString('utf-8'));
      console.log('Response:', JSON.stringify(parsed, null, 2));
    } else {
      console.log('All response headers:');
      res.headers.forEach((v, k) => console.log(`  ${k}: ${v}`));
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}

async function main() {
  const templateId = await testCreateTemplate();
  if (templateId) {
    const phone = process.argv[2];
    if (phone) {
      await testSendSms(templateId, phone);
    } else {
      console.log('\nTemplate created OK! To send test SMS run:');
      console.log(`  node test-sms.js <your_phone_number>`);
    }
  }
}

main();
