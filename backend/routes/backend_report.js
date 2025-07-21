const express = require('express');
const {pool} = require('../database');
const router = express.Router();


// 假設你有 express 和 mysql2 已設定好
router.get('/', async (req, res) => {
  const { start, end } = req.query;
  const connection = await pool.getConnection();

  try {
    let query = `
      SELECT check_in, SUM(total_price) AS total_price, payment_status
      FROM bookings
    `;
    let params = [];

    if (start && end) {
      // ✅ 使用指定的日期範圍
      query += ` WHERE check_in BETWEEN ? AND ? `;
      params.push(start, end);
    } else {
      // ✅ 預設近 7 天（從今天往前推 6 天）
      query += ` WHERE check_in BETWEEN DATE_SUB(CURDATE(), INTERVAL 13 DAY) AND CURDATE() `;
    }

    query += ` GROUP BY check_in ORDER BY check_in`;

    const [rows] = await connection.execute(query, params);
    res.json(rows);

  } catch (error) {
    console.error('查詢錯誤:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  } finally {
    connection.release();
  }
});


module.exports = router;