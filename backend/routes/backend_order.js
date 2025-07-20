const express = require('express');
const { pool } = require('../database');
const { hash } = require('bcryptjs');
const router = express.Router();

// 訂單路由
router.get('/', async(req, res) => {
    try {
        const connection = await pool.getConnection();
        const [bookings] = await connection.execute('SELECT b.id, b.room_type_id,b.user_id,  b.check_in, b.check_out,b.total_price, b.special_requests , b.payment_status ,u.name as customer_name , u.phone as customer_phone ,g.adults , g.children , rt.name as room_type_name  from bookings as b left join guests as g on b.id = g.booking_id left join room_types as rt on b.room_type_id = rt.id left join users as u on b.user_id = u.id where b.check_in >= CURDATE() order by b.id');
        connection.release();
        res.json(bookings);
    }catch(error){
        console.error('查詢錯誤:', error);
        res.status(500).json({ message: '伺服器錯誤' });
    }
});

router.get('/edit/:id', async(req, res) => {
    try {
        const { id } = req.params;
        const connection = await pool.getConnection();
        const [edit_order] = await connection.execute('SELECT b.id, b.room_type_id, b.check_in, b.check_out,b.total_price, b.special_requests , b.payment_status ,u.name as customer_name , u.phone as customer_phone ,g.adults , g.children , rt.name as room_type_name , rt.price from bookings as b left join guests as g on b.id = g.booking_id left join room_types as rt on b.room_type_id = rt.id left join users as u on b.user_id = u.id where b.check_in >= CURDATE() and b.id = ?', [id]);
        connection.release();
        res.json(edit_order[0]);
    }catch(error){
        console.error('查詢錯誤:', error);
        res.status(500).json({ message: '伺服器錯誤' });
    }
});


router.patch('/update/:id', async(req, res) => {
    const connection = await pool.getConnection();
    try {
        const { room_type_name, customer_name, customer_phone, check_in, check_out, adults, children, special_requests, payment_status } = req.body;
        const id = req.params.id || req.body.editId;

        await connection.beginTransaction();

        // 1. 查出 user_id
        const [bookingRows] = await connection.execute('SELECT user_id FROM bookings WHERE id = ?', [id]);
        if (bookingRows.length === 0) throw new Error('找不到訂單');
        const user_id = bookingRows[0].user_id;

        // 2. 查出房型 id
        const [roomTypeRows] = await connection.execute('SELECT id FROM room_types WHERE name = ?', [room_type_name]);
        if (roomTypeRows.length === 0) throw new Error('找不到房型');
        const room_type_id = roomTypeRows[0].id;

        // 3. 更新 users
        await connection.execute('UPDATE users SET name = ?, phone = ? WHERE id = ?', [customer_name, customer_phone, user_id]);

        // 4. 更新 guests
        await connection.execute('UPDATE guests SET adults = ?, children = ? WHERE booking_id = ?', [Number(adults), Number(children), id]);

        // 5. 更新 bookings
        await connection.execute(
            'UPDATE bookings SET room_type_id = ?, check_in = ?, check_out = ?, special_requests = ?, payment_status = ? WHERE id = ?',
            [room_type_id, check_in, check_out, special_requests, payment_status, id]
        );

        await connection.commit();
        res.json({ message: '編輯成功' });
    } catch (error) {
        await connection.rollback();
        console.error('編輯失敗:', error);
        res.status(500).json({ message: '伺服器錯誤' });
    } finally {
        connection.release();
    }
});




//刪除項目
//目前先用availability 狀態先不管
//SQL 要再改
router.delete('/delete/:id', async(req, res) => {
        const { id } = req.params;
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
        
            // 先刪除 guests（避免 FK 限制）
            await connection.execute('DELETE FROM guests WHERE booking_id = ?', [id]);
        
            // 再刪除 bookings
            await connection.execute('DELETE FROM bookings WHERE id = ?', [id]);
        
            await connection.commit();
            res.json({ message: '刪除成功' });
            console.log('刪除成功');
            } 
        catch (error) {
            await connection.rollback();
            console.error('刪除失敗，已回復:', error);
            res.status(500).json({ message: '伺服器錯誤' });
        } finally {
            connection.release();
            console.log('---finally---');
        }
});

//抓房間價格
router.get('/room_price', async(req, res) => {
    try {
        const { room_type_name } = req.params;
        const connection = await pool.getConnection();
        const [roomType] = await connection.execute('SELECT price , name FROM room_types');
        connection.release();
        
        if (roomType.length === 0) {
            return res.status(404).json({ message: '房型不存在' });
        }
        
        res.json({ roomType });
    } catch (error) {
        console.error('查詢房間價格錯誤:', error);
        res.status(500).json({ message: '伺服器錯誤' });
    }
});


// 新增訂房
router.post('/add', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { room_type_name, customer_name, customer_phone, check_in, check_out, adults, children, special_requests, price , email} = req.body;
        await connection.beginTransaction();

        // 1. 查詢房型 id
        const [roomTypeRows] = await connection.execute('SELECT id FROM room_types WHERE name = ?', [room_type_name]);
        if (roomTypeRows.length === 0) throw new Error('房型不存在');
        const room_type_id = roomTypeRows[0].id;

        // 2. 新增顧客，取得 user_id
        const hashedPassword = await hash('fs101', 10);
        const [userResult] = await connection.execute('INSERT INTO users (name, phone , email, password) VALUES (?, ?, ?, ?)', [customer_name, customer_phone, email, hashedPassword]);
        const user_id = userResult.insertId;

        // 4. 新增訂單，取得 booking_id
        const [bookingResult] = await connection.execute(
            'INSERT INTO bookings (user_id, room_type_id, check_in, check_out, total_price, special_requests) VALUES (?, ?, ?, ?, ?, ?)',
            [user_id, room_type_id, check_in, check_out, price, special_requests]
        );
        const booking_id = bookingResult.insertId;

         // 3. 新增入住人資料
        await connection.execute('INSERT INTO guests (booking_id, adults, children) VALUES (?, ?, ?)', [booking_id, adults, children]);

        

        await connection.commit();
        res.json({ message: '新增訂房成功' });
    } catch (error) {
        await connection.rollback();
        console.error('新增訂房失敗:', error);
        res.status(500).json({ message: '伺服器錯誤' });
    } finally {
        connection.release();
    }
    
});

module.exports = router;