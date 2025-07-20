const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { pool } = require('../database');

const router = express.Router();

// 使用者註冊
router.post('/register', [
  body('firstname').notEmpty().withMessage('名字為必填項目'),
  body('lastname').notEmpty().withMessage('姓氏為必填項目'),
  body('email').isEmail().withMessage('請輸入有效的電子郵件'),
  body('phone').notEmpty().withMessage('電話號碼為必填項目'),
  body('password').isLength({ min: 5 }).withMessage('密碼至少需要5個字元'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('密碼確認不符');
    }
    return true;
  })
], async (req, res) => {
  try {
    // 驗證輸入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '輸入資料有誤',
        errors: errors.array()
      });
    }

    const { firstname, lastname, email, phone, password } = req.body;
    const fullName = `${firstname} ${lastname}`;

    const connection = await pool.getConnection();

    try {
      // 檢查電子郵件是否已存在
      const [existingUsers] = await connection.execute(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      if (existingUsers.length > 0) {
        return res.status(400).json({
          success: false,
          message: '此電子郵件已被註冊'
        });
      }

      // 加密密碼
      const hashedPassword = await bcrypt.hash(password, 10);

      // 建立新使用者
      const [newUser] = await connection.execute(
        'INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)',
        [fullName, email, hashedPassword, phone]
      );

      res.json({
        success: true,
        message: '註冊成功！',
        userId: newUser.insertId
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('註冊錯誤:', error);
    res.status(500).json({
      success: false,
      message: '註冊失敗，請稍後再試'
    });
  }
});

// 使用者登入
router.post('/login', [
  body('email').isEmail().withMessage('請輸入有效的電子郵件'),
  body('password').notEmpty().withMessage('密碼為必填項目')
], async (req, res) => {
  try {
    // 驗證輸入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '輸入資料有誤',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    const connection = await pool.getConnection();

    try {
      // 查詢使用者
      const [users] = await connection.execute(
        'SELECT id, name, email, password, phone, is_admin FROM users WHERE email = ?',
        [email]
      );

      if (users.length === 0) {
        return res.status(401).json({
          success: false,
          message: '電子郵件或密碼錯誤'
        });
      }

      const user = users[0];

      // 驗證密碼
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: '電子郵件或密碼錯誤'
        });
      }

      // 登入成功，回傳使用者資訊（不包含密碼）
      const { password: _, ...userInfo } = user;

      res.json({
        success: true,
        message: '登入成功！',
        user: userInfo
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('登入錯誤:', error);
    res.status(500).json({
      success: false,
      message: '登入失敗，請稍後再試'
    });
  }
});

// 獲取使用者資料
router.get('/user/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const connection = await pool.getConnection();

    try {
      // 查詢使用者資料（不包含密碼）
      const [users] = await connection.execute(
        'SELECT id, name, email, phone FROM users WHERE email = ?',
        [email]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: '找不到該使用者'
        });
      }

      const user = users[0];

      res.json({
        success: true,
        user: user
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('獲取使用者資料錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取使用者資料失敗，請稍後再試'
    });
  }
});

module.exports = router; 