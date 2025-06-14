const express = require('express');
const multer = require('multer');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { router: captchaRouter, captchaStore } = require('./captcha');

const app = express();
const port = process.env.PORT || 3000;

// 加载环境变量
require('dotenv').config();

// Redmine 配置
const REDMINE_URL = process.env.REDMINE_URL;
const REDMINE_API_KEY = process.env.REDMINE_API_KEY;
const REDMINE_PROJECT_ID = process.env.REDMINE_PROJECT_ID;

// 创建 uploads 目录 (如果不存在)
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Multer 配置，用于处理文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir); // 文件存储路径
  },
  filename: function (req, file, cb) {
    // 对中文文件名进行编码处理
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    // 保留原始文件名，添加时间戳防止重名
    cb(null, Date.now() + '-' + originalName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 限制文件大小为 100MB
  fileFilter: function (req, file, cb) {
    // 限制文件类型
    const allowedTypes = /jpeg|jpg|png|gif|mkv|mp4/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: File type not allowed! Only jpg, png, gif, mkv, mp4 are allowed.');
    }
  }
}).array('files', 3); // 最多允许上传 3 个文件，字段名为 'files'

// 中间件
app.use(express.json()); // 解析 JSON 请求体
app.use(express.urlencoded({ extended: true })); // 解析 URL 编码的请求体
app.use('/uploads', express.static(uploadsDir)); // 静态文件服务，用于访问上传的文件

// API 路由
app.use('/api/captcha', captchaRouter);

// 模拟验证码验证函数，实际使用时需根据 captchaRouter 实现修改
const verifyCaptcha = async (captchaId, captcha) => {
  const captchaData = captchaStore.get(captchaId);
  if (!captchaData) {
    return false; // 验证码不存在
  }
  const now = Date.now();
  if (now - captchaData.timestamp > 5 * 60 * 1000) { // 5分钟过期
    captchaStore.delete(captchaId); // 删除过期验证码
    return false;
  }
  const isValid = captcha === captchaData.code;
  if (isValid) {
    captchaStore.delete(captchaId); // 验证成功后删除，防止重复使用
  }
  return isValid;
};

app.post('/api/submit', (req, res) => {
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      console.error('Multer 错误:', err.message);
      return res.status(400).json({ message: 'File upload error: ' + err.message });
    } else if (err) {
      console.error('其他文件上传错误:', err);
      return res.status(400).json({ message: err });
    }

    console.log('接收到的原始请求体:', req.body);
    console.log('接收到的文件:', req.files);

    // 解构赋值前先检查 req.body 是否存在
    const { issueType, description, contactInfo, captcha, captchaId } = req.body || {};
    const files = req.files;

    // 验证必填字段
    if (!issueType || !description) {
      console.error('必填字段缺失，issueType:', issueType, 'description:', description);
      return res.status(400).json({ message: 'Issue type and description are required.' });
    }

    // 验证验证码
    if (!captchaId || !captcha) {
      console.error('验证码信息缺失，captchaId:', captchaId, 'captcha:', captcha);
      return res.status(400).json({ message: '验证码信息缺失，请重新获取验证码。' });
    }
    const isCaptchaValid = await verifyCaptcha(captchaId, captcha);
    if (!isCaptchaValid) {
      console.error('验证码验证失败，captchaId:', captchaId, 'captcha:', captcha);
      return res.status(400).json({ message: '验证码验证失败，请重新输入。' });
    }

    // 解析联系方式
    let contactEmail, contactHsId, contactPhone;
    if (contactInfo) {
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
      const phoneRegex = /^\d{11}$/;

      contactEmail = contactInfo.match(emailRegex)?.[0];
      contactHsId = contactInfo.match(phoneRegex)?.[0];
      contactPhone = contactInfo.match(phoneRegex)?.[0];
    }

    // 验证联系方式格式 (可选)
    if (contactHsId && !/^\d{11}$/.test(contactHsId)) {
      console.error('互生号格式错误:', contactHsId);
      return res.status(400).json({ message: 'Invalid HS Id format. Must be 11 digits.' });
    }
    if (contactPhone && !/^\d{11}$/.test(contactPhone)) {
      console.error('电话号码格式错误:', contactPhone);
      return res.status(400).json({ message: 'Invalid phone number format. Must be 11 digits.' });
    }

    try {
      // 1. 上传文件到 Redmine (获取 token)
      const uploadTokens = [];
      if (files && files.length > 0) {
        for (const file of files) {
          const fileData = fs.readFileSync(file.path);
          // 对上传到Redmine的文件名进行编码处理
          const encodedFilename = encodeURIComponent(file.originalname);
          const uploadResponse = await axios.post(`${REDMINE_URL}/uploads.json`,
            fileData,
            {
              headers: {
                'X-Redmine-API-Key': REDMINE_API_KEY,
                'Content-Type': 'application/octet-stream',
                'Content-Disposition': `attachment; filename*=UTF-8''${encodedFilename}`
              }
            }
          );
          if (uploadResponse.data && uploadResponse.data.upload) {
            uploadTokens.push({
              token: uploadResponse.data.upload.token,
              filename: file.originalname,
              content_type: file.mimetype
            });
          } else {
            console.error('Redmine file upload failed for:', file.originalname, uploadResponse.data);
            // 可以选择忽略失败的文件或返回错误
          }
        }
      }

      // 2. 创建 Redmine 问题单
      let issueDescription = `**问题类型:** ${issueType}\n\n**问题描述:**\n${description}\n\n`;
      if (contactEmail) issueDescription += `**联系邮箱:** ${contactEmail}\n`;
      if (contactHsId) issueDescription += `**互生号:** ${contactHsId}\n`;
      if (contactPhone) issueDescription += `**电话号码:** ${contactPhone}\n`;

      const issueData = {
        issue: {
          project_id: REDMINE_PROJECT_ID,
          subject: `[${issueType}] 用户反馈 - ${description.substring(0, 50)}${description.length > 50 ? '...' : ''}`,
          description: issueDescription,
          // 可以根据 issueType 设置 tracker_id, priority_id 等
          // tracker_id: issueType === '提交 Bug' ? 1 : (issueType === '我要吐槽' ? 2 : 3), // 假设 Bug=1, Feature=2, Support=3
          uploads: uploadTokens
        }
      };

      const createIssueResponse = await axios.post(`${REDMINE_URL}/issues.json`,
        issueData,
        {
          headers: {
            'X-Redmine-API-Key': REDMINE_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      if (createIssueResponse.data && createIssueResponse.data.issue) {
        // 成功创建问题单
        res.status(201).json({ 
          message: 'Issue submitted successfully!', 
          issueId: createIssueResponse.data.issue.id 
        });
      } else {
        console.error('Redmine issue creation failed:', createIssueResponse.data);
        res.status(500).json({ message: 'Failed to create Redmine issue.' });
      }

      // 可选：创建成功后删除本地临时文件
      if (files && files.length > 0) {
        files.forEach(file => fs.unlinkSync(file.path));
      }

    } catch (error) {
      console.error('Error submitting issue to Redmine:', error.response ? error.response.data : error.message);
      // 可选：发生错误时删除本地临时文件
      if (files && files.length > 0) {
          files.forEach(file => {
              try {
                  fs.unlinkSync(file.path);
              } catch (unlinkErr) {
                  console.error('Error deleting temp file:', unlinkErr);
              }
          });
      }
      res.status(500).json({ message: 'An error occurred while submitting the issue.' });
    }
  });
});

// 启动服务器
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});