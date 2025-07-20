const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../database');

require('dotenv').config();
const SECRET = process.env.JWT_SECRET || 'your_default_fallback';

const router = express.Router();



// ✅ 登入 API
router.post('/', [
  body('email').isEmail().withMessage('請輸入有效的電子郵件'),
  body('password').notEmpty().withMessage('密碼為必填項目')
], async (req, res) => {
  const { email, password } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      'SELECT id, email, password, is_admin FROM users WHERE email = ? AND is_admin = 1',
      [email]
    );
    connection.release();

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: '帳號或密碼錯誤' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: '帳號或密碼錯誤' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, is_admin: user.is_admin },
      SECRET,
      { expiresIn: '15m' }
    );

    res.json({
      success: true,
      message: '登入成功',
      token,
      expires_in: 900 // 15 分鐘（秒）
    });

  } catch (error) {
    console.error('登入錯誤:', error);
    res.status(500).json({ success: false, message: '伺服器錯誤' });
  }
});


// ✅ Token Refresh API
router.post('/refresh-token', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: '沒有提供 token' });

  try {
    const decoded = jwt.verify(token, SECRET, { ignoreExpiration: true });
    const now = Math.floor(Date.now() / 1000);

    if (decoded.exp - now > 5 * 60) {
      return res.status(400).json({ message: '還沒接近過期，不需要更新' });
    }

    const newToken = jwt.sign({
      id: decoded.id,
      email: decoded.email,
      is_admin: decoded.is_admin
    }, SECRET, { expiresIn: '15m' });

    res.json({ token: newToken, expires_in: 900 });

  } catch (error) {
    console.error('refresh-token 錯誤:', error);
    return res.status(401).json({ message: 'token 錯誤或過期' });
  }
});

module.exports = router;
