const express = require('express');
const { pool } = require('../database');
const { hash } = require('bcryptjs');
const router = express.Router();

router.get('/', async(req, res) => {
    try {
        const connection = await pool.getConnection();
        const [users] = await connection.execute('SELECT * from users where is_admin = 0');
        connection.release();
        res.json(users);
    }catch(error){
        console.error('查詢錯誤:', error);
        res.status(500).json({ message: '伺服器錯誤' });
    }
});

router.get('/:id', async(req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.execute('SELECT * FROM users WHERE id = ?', [req.params.id]);
        connection.release();
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).json({ message: '使用者不存在' });
        }
    } catch (error) {
        console.error('查詢錯誤:', error);
        res.status(500).json({ message: '伺服器錯誤' });
    }
});

router.post('/create', async(req, res) => {
    try {
        const connection = await pool.getConnection();
        const hashedPassword = await hash('fs101', 10);
        const [result] = await connection.execute(
            'INSERT INTO users (name, phone, email, password) VALUES (?, ?, ?, ?)',
            [req.body.name, req.body.phone, req.body.email, hashedPassword]
        );
        connection.release();
        res.json(result.status= 'ok');
        console.log('新增成功');
    } catch (error) {
        console.error('新增會員錯誤:', error);
        res.status(500).json({ message: '伺服器錯誤', error: error.message });
    }
});

router.delete('/delete/:id', async(req, res) => {
    // console.log('刪除使用者 ID:', req.params.id);
    try {
        const connection = await pool.getConnection();
        const [result] = await connection.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
        connection.release();
        if (result.affectedRows > 0) {
            res.json({ status: 'ok', message: '刪除成功' });
        } else {
            res.status(404).json({ status: 'error', message: '使用者不存在' });
        }
    } catch (error) {
        console.error('刪除使用者錯誤:', error);
        res.status(500).json({ message: '伺服器錯誤/尚有訂單資料，請確認訂單狀態再刪除' });
    }
});

//儲存變更設定
router.patch('/update/:id', async(req, res) => {
    try {
        const connection = await pool.getConnection();
        const [result] = await connection.execute(
            'UPDATE users SET name = ?, phone = ? WHERE id = ?',
            [req.body.name, req.body.phone, req.params.id]
        );
        connection.release();
        if (result.affectedRows > 0) {
            res.json({ status: 'ok', message: '更新成功' });
        } else {
            res.status(404).json({ status: 'error', message: '使用者不存在' });
        }
    } catch (error) {
        console.error('更新使用者錯誤:', error);
        res.status(500).json({ message: '伺服器錯誤' });
    }
});

module.exports = router;