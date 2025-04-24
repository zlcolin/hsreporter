const express = require('express');
const multer = require('multer');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

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
    // 保留原始文件名，添加时间戳防止重名
    cb(null, Date.now() + '-' + file.originalname);
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
app.post('/api/submit', (req, res) => {
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      // Multer 错误
      return res.status(400).json({ message: 'File upload error: ' + err.message });
    } else if (err) {
      // 其他错误 (例如文件类型不允许)
      return res.status(400).json({ message: err });
    }

    // 文件上传成功，处理表单数据
    const { issueType, description, contactEmail, contactHsId, contactPhone } = req.body;
    const files = req.files;

    // 验证必填字段
    if (!issueType || !description) {
      return res.status(400).json({ message: 'Issue type and description are required.' });
    }

    // 验证联系方式格式 (可选)
    const phoneRegex = /^\d{11}$/;
    if (contactHsId && !phoneRegex.test(contactHsId)) {
        return res.status(400).json({ message: 'Invalid HS ID format. Must be 11 digits.' });
    }
    if (contactPhone && !phoneRegex.test(contactPhone)) {
        return res.status(400).json({ message: 'Invalid phone number format. Must be 11 digits.' });
    }

    try {
      // 1. 上传文件到 Redmine (获取 token)
      const uploadTokens = [];
      if (files && files.length > 0) {
        for (const file of files) {
          const fileData = fs.readFileSync(file.path);
          const uploadResponse = await axios.post(`${REDMINE_URL}/uploads.json`,
            fileData,
            {
              headers: {
                'X-Redmine-API-Key': REDMINE_API_KEY,
                'Content-Type': 'application/octet-stream'
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