const mysql = require('mysql2/promise');
const config = require('./config');

// 建立資料庫連線池
const pool = mysql.createPool(config.database);

// 測試資料庫連線
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ 資料庫連線成功');
    connection.release();
  } catch (error) {
    console.error('❌ 資料庫連線失敗:', error.message);
  }
}

// 初始化資料表（如果不存在）
async function initTables() {
  try {
    const connection = await pool.getConnection();
    
    // 建立 users 表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        is_admin TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 建立 room_types 表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS room_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        capacity INT NOT NULL,
        image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 建立 room_availability 表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS room_availability (
        id INT AUTO_INCREMENT PRIMARY KEY,
        room_type_id INT NOT NULL,
        date DATE NOT NULL,
        available_rooms INT NOT NULL DEFAULT 10,
        FOREIGN KEY (room_type_id) REFERENCES room_types(id),
        UNIQUE KEY unique_room_date (room_type_id, date)
      )
    `);

    // 建立 guests 表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS guests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        booking_id INT NOT NULL,
        adults INT NOT NULL DEFAULT 1,
        children INT NOT NULL DEFAULT 0,
        FOREIGN KEY (booking_id) REFERENCES bookings(id)
      )
    `);


    
    // 更新 status 欄位的 ENUM 值
    console.log('更新 status 欄位...');
    try {
      await connection.execute(`
        ALTER TABLE bookings 
        MODIFY COLUMN status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending'
      `);
    } catch (error) {
      console.log('status 欄位已是最新版本');
    }

    console.log('✅ 資料表初始化完成');
    connection.release();
  } catch (error) {
    console.error('❌ 資料表初始化失敗:', error.message);
  }
}

module.exports = {
  pool,
  testConnection,
  initTables
}; 