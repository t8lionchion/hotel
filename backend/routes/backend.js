const express = require('express');
const {body , validationResult}=require('express-validator');
const verifyToken = require('../middlewares/authMiddleware');
const { pool } = require('../database');

const router = express.Router();
// 今日入住  退房 未付款 
//房間可用數 已預約
// 即將入住提醒
router.get('/today_check',async(req,res)=>{
    try {
    const connection = await pool.getConnection();
    const [bookings] = await connection.execute('SELECT check_in, payment_date, check_out , date(check_out) as check_out_date FROM bookings WHERE DATE(check_in) = CURDATE() OR DATE(check_out) = CURDATE()');
    connection.release();
    res.json(bookings); 
    // console.log(bookings);     
    } catch (error) {
        console.error('查詢訂單錯誤:', error);
        res.status(500).json({ message: '伺服器錯誤' });
    }
})

router.get('/room_check',async(req,res)=>{
    try {
    const connection = await pool.getConnection();
    const [room_check] = await connection.execute('SELECT available_rooms FROM room_availability');
    connection.release();
    res.json(room_check);      
    } catch (error) {
        console.error('查詢訂單錯誤:', error);
        res.status(500).json({ message: '伺服器錯誤' });
    }
})

router.get('/coming_soon',async(req,res)=>{
    try {
    const connection = await pool.getConnection();
    const [coming_soon] = await connection.execute('SELECT b.check_in , g.booking_id , b.room_type_id, sum(g.adults + g.children) as total_guests  FROM bookings as b left join guests as g on b.id = g.booking_id where check_in >= curdate() order by b.check_in asc limit 1');
    connection.release();
    res.json(coming_soon);      
    } catch (error) {
        console.error('查詢訂單錯誤:', error);
        res.status(500).json({ message: '伺服器錯誤' });
    }
})

module.exports = router;
