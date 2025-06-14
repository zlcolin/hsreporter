const svgCaptcha = require('svg-captcha');
const express = require('express');
const router = express.Router();

// 存储验证码的Map，key是sessionId，value是{code, timestamp}
const captchaStore = new Map();

// 验证码配置
const captchaConfig = {
    size: 4, // 验证码长度
    noise: 2, // 干扰线条数
    color: true, // 验证码的字符是否有颜色，默认没有，如果设定了背景，则默认有
    background: '#f0f0f0', // 验证码图片背景颜色
    width: 120, // 调整宽度以适应4位数字
    height: 40,
    fontSize: 40,
    charPreset: '0123456789' // 只使用数字
};

// 清理过期的验证码（5分钟过期）
function cleanExpiredCaptchas() {
    const now = Date.now();
    for (const [sessionId, data] of captchaStore) {
        if (now - data.timestamp > 5 * 60 * 1000) { // 5分钟过期
            captchaStore.delete(sessionId);
        }
    }
}

// 定期清理过期验证码
setInterval(cleanExpiredCaptchas, 60 * 1000); // 每分钟清理一次

// 生成验证码
router.get('/generate', (req, res) => {
    const captcha = svgCaptcha.create(captchaConfig);
    const sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    
    // 存储验证码信息
    captchaStore.set(sessionId, {
        code: captcha.text, // 数字验证码不需要转换小写
        timestamp: Date.now()
    });

    res.status(200).json({
        imageUrl: `data:image/svg+xml;base64,${Buffer.from(captcha.data).toString('base64')}`,
        captchaId: sessionId
    });
});

// 验证验证码
router.post('/verify', (req, res) => {
    const { sessionId, code } = req.body;

    if (!sessionId || !code) {
        return res.status(400).json({ success: false, message: '请填入图片验证码' });
    }

    const captchaData = captchaStore.get(sessionId);
    if (!captchaData) {
        return res.status(400).json({ success: false, message: '验证码已过期或不存在' });
    }

    const isValid = code.toLowerCase() === captchaData.code;
    
    // 验证完后删除验证码
    captchaStore.delete(sessionId);

    res.json({
        success: isValid,
        message: isValid ? '验证成功' : '验证码错误'
    });
});

module.exports = { router, captchaStore };