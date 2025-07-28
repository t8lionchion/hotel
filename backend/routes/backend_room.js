const express = require('express');
const { pool } = require('../database');
const router = express.Router();

router.get('/', async(req, res) => {
    try{
        const connection = await pool.getConnection();
        const [room_check] = await connection.execute('SELECT * from room_types');
        connection.release();
        res.json(room_check);
    }catch(error){
        console.error('查詢錯誤:', error);
        res.status(500).json({ message: '伺服器錯誤' });
    }
});

router.get('/edit/:id', async(req, res) => {
    try{
        const { id } = req.params;
        const connection = await pool.getConnection();
        const [edit_room] = await connection.execute('SELECT * FROM room_types WHERE id = ?', [id]);
        connection.release();
        res.json(edit_room[0]);
    }catch(error){
        console.error('查詢錯誤:', error);
        res.status(500).json({ message: '伺服器錯誤' });
    }
});

router.post('/add',async(req,res)=>{
    try{
        const { name, capacity, price, description, image_url } = req.body;

        const connection = await pool.getConnection();
        const [add_room] = await connection.execute(
            `INSERT INTO room_types (name, capacity, price, description, image_url) VALUES (?, ?, ?, ?, ?)`,[name, capacity, price, description, image_url]
          );
          connection.release();
          res.json({ message: '新增成功', insertId: add_room.insertId });
    }catch(error){
        console.error('新增房型錯誤:', error);
        res.status(500).json({ message: '伺服器錯誤' });
    }
})

router.delete('/delete/:id',async(req,res)=>{
    try{
        const { id } = req.params;
        const connection = await pool.getConnection();
        const [delete_room] = await connection.execute('DELETE FROM room_types WHERE id = ?', [id]);
        connection.release();
        res.json({ message: '刪除成功', deleteId: delete_room.insertId });
    }catch(error){
        console.error('刪除房型錯誤:', error);
        res.status(500).json({ message: '伺服器錯誤' });
    }
})

router.patch('/update/:id',async(req,res)=>{
    try{
        const { id } = req.params;
        const { name, capacity, price, description, image_url } = req.body;
        const connection = await pool.getConnection();
        const [update_room] = await connection.execute(
            `UPDATE room_types SET name = ?, capacity = ?, price = ?, description = ?, image_url = ? WHERE id = ?`,
            [name, capacity, price, description, image_url, id]
          );
          connection.release();
          res.json({ message: '更新成功', updateId: update_room.insertId });
    }catch(error){
        console.error('更新房型錯誤:', error);
        res.status(500).json({ message: '伺服器錯誤' });
    }
})


module.exports = router;