const express = require('express');
const {pool} = require('../database');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [reports] = await connection.execute('SELECT check_in , total_price ,payment_status FROM bookings order by check_in');
        connection.release();
        res.json(reports);
    } catch (error) {
        console.error('查詢錯誤:', error);
        res.status(500).json({message: '伺服器錯誤'});
    }
});

module.exports = router;