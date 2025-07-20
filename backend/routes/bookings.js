const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { pool } = require('../database');

const router = express.Router();

// 查詢使用者的訂單
router.get('/user/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const connection = await pool.getConnection();

    try {
      // 先查詢使用者ID
      const [users] = await connection.execute(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: '找不到該使用者'
        });
      }

      const userId = users[0].id;

      // 查詢該使用者的所有訂單
      const [bookings] = await connection.execute(`
        SELECT 
          b.id,
          b.check_in,
          b.check_out,
          b.status,
          b.total_price,
          b.special_requests,
          b.created_at,
          rt.name as room_type_name,
          rt.description as room_description,
          rt.image_url,
          g.adults,
          g.children
        FROM bookings b
        JOIN room_types rt ON b.room_type_id = rt.id
        JOIN guests g ON b.id = g.booking_id
        WHERE b.user_id = ?
        ORDER BY b.created_at DESC
      `, [userId]);

      // 處理訂單資料，添加狀態分類
      const processedBookings = bookings.map(booking => {
        const checkIn = new Date(booking.check_in);
        const checkOut = new Date(booking.check_out);
        const now = new Date();
        
        let category = 'past';
        if (checkIn > now) {
          category = 'upcoming';
        } else if (checkIn <= now && checkOut >= now) {
          category = 'current';
        }

        return {
          ...booking,
          category,
          bookingNumber: `#JM${booking.id.toString().padStart(8, '0')}`,
          checkInFormatted: checkIn.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' }),
          checkOutFormatted: checkOut.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' }),
          guestsText: `${booking.adults}位成人${booking.children > 0 ? `，${booking.children}位兒童` : ''}`,
          priceFormatted: `$${(booking.total_price / 1000).toFixed(1)}K`
        };
      });

      res.json({
        success: true,
        bookings: processedBookings
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('查詢訂單錯誤:', error);
    res.status(500).json({
      success: false,
      message: '查詢訂單失敗，請稍後再試'
    });
  }
});

// 取消訂單
router.put('/cancel/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;

    const connection = await pool.getConnection();

    try {
      // 檢查訂單是否存在且狀態為pending或confirmed
      const [bookings] = await connection.execute(
        'SELECT id, status FROM bookings WHERE id = ?',
        [bookingId]
      );

      if (bookings.length === 0) {
        return res.status(404).json({
          success: false,
          message: '找不到該訂單'
        });
      }

      const booking = bookings[0];

      if (booking.status === 'cancelled') {
        return res.status(400).json({
          success: false,
          message: '訂單已經被取消'
        });
      }

      if (booking.status === 'completed') {
        return res.status(400).json({
          success: false,
          message: '已完成的訂單無法取消'
        });
      }

      // 更新訂單狀態為取消
      await connection.execute(
        'UPDATE bookings SET status = ? WHERE id = ?',
        ['cancelled', bookingId]
      );

      res.json({
        success: true,
        message: '訂單已成功取消'
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('取消訂單錯誤:', error);
    res.status(500).json({
      success: false,
      message: '取消訂單失敗，請稍後再試'
    });
  }
});



// 提交訂單
router.post('/submit', [
  body('guestName').notEmpty().withMessage('姓名為必填項目'),
  body('guestEmail').isEmail().withMessage('請輸入有效的電子郵件'),
  body('guestPhone').notEmpty().withMessage('電話號碼為必填項目'),
  body('checkinDate').notEmpty().withMessage('入住日期為必填項目'),
  body('checkoutDate').notEmpty().withMessage('退房日期為必填項目'),
  body('adults').isInt({ min: 1 }).withMessage('成人數量至少為1'),
  body('children').isInt({ min: 0 }).withMessage('兒童數量不能為負數'),
  body('roomId').notEmpty().withMessage('房型為必填項目'),
  body('totalPrice').isFloat({ min: 0 }).withMessage('總價必須大於0')
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

    const {
      guestName,
      guestEmail,
      guestPhone,
      checkinDate,
      checkoutDate,
      adults,
      children,
      roomId,
      totalPrice,
      specialRequests
    } = req.body;

    const connection = await pool.getConnection();

    try {
      // 開始交易
      await connection.beginTransaction();

      // 1. 檢查或建立使用者
      let userId;
      const [existingUsers] = await connection.execute(
        'SELECT id FROM users WHERE email = ?',
        [guestEmail]
      );

      if (existingUsers.length > 0) {
        // 使用者已存在，更新資訊
        userId = existingUsers[0].id;
        await connection.execute(
          'UPDATE users SET name = ?, phone = ? WHERE id = ?',
          [guestName, guestPhone, userId]
        );
      } else {
        // 建立新使用者（使用預設密碼）
        const defaultPassword = 'password123';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        
        const [newUser] = await connection.execute(
          'INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)',
          [guestName, guestEmail, hashedPassword, guestPhone]
        );
        userId = newUser.insertId;
      }

      // 2. 檢查或建立房型
      let roomTypeId;
      const roomData = getRoomData(roomId);
      
      const [existingRoomTypes] = await connection.execute(
        'SELECT id FROM room_types WHERE name = ?',
        [roomData.title]
      );

      if (existingRoomTypes.length > 0) {
        roomTypeId = existingRoomTypes[0].id;
      } else {
        // 建立新房型
        const [newRoomType] = await connection.execute(
          'INSERT INTO room_types (name, description, price, capacity, image_url) VALUES (?, ?, ?, ?, ?)',
          [roomData.title, roomData.description, roomData.basePrice, parseInt(adults) + parseInt(children), roomData.image]
        );
        roomTypeId = newRoomType.insertId;
      }

      // 3. 建立訂單
      const [newBooking] = await connection.execute(
        'INSERT INTO bookings (user_id, room_type_id, check_in, check_out, total_price, special_requests) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, roomTypeId, checkinDate, checkoutDate, totalPrice, specialRequests || null]
      );

      const bookingId = newBooking.insertId;

      // 4. 建立入住人數記錄
      await connection.execute(
        'INSERT INTO guests (booking_id, adults, children) VALUES (?, ?, ?)',
        [bookingId, adults, children]
      );

      // 5. 更新房型可用性（簡單處理，實際應該更複雜）
      const checkIn = new Date(checkinDate);
      const checkOut = new Date(checkoutDate);
      
      for (let date = new Date(checkIn); date < checkOut; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0];
        
        // 檢查是否已有該日期的可用性記錄
        const [existingAvailability] = await connection.execute(
          'SELECT id, available_rooms FROM room_availability WHERE room_type_id = ? AND date = ?',
          [roomTypeId, dateStr]
        );

        if (existingAvailability.length > 0) {
          // 更新現有記錄
          const newAvailable = Math.max(0, existingAvailability[0].available_rooms - 1);
          await connection.execute(
            'UPDATE room_availability SET available_rooms = ? WHERE id = ?',
            [newAvailable, existingAvailability[0].id]
          );
        } else {
          // 建立新記錄
          await connection.execute(
            'INSERT INTO room_availability (room_type_id, date, available_rooms) VALUES (?, ?, ?)',
            [roomTypeId, dateStr, 9] // 預設10間，訂走1間剩9間
          );
        }
      }

      // 提交交易
      await connection.commit();

      res.json({
        success: true,
        message: '訂單提交成功！',
        bookingId: bookingId,
        userId: userId
      });

    } catch (error) {
      // 回滾交易
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('訂單提交錯誤:', error);
    res.status(500).json({
      success: false,
      message: '訂單提交失敗，請稍後再試'
    });
  }
});

// 取得房型資料的輔助函數
function getRoomData(roomId) {
  const roomData = {
    'room1': {
      title: '濱海豪華客房',
      description: '享受寬敞的私人露台，俯瞰壯麗的濱海景致',
      image: 'room/room1.webp',
      basePrice: 15000
    },
    'room2': {
      title: '濱海步道豪華客房',
      description: '充滿自然光的現代空間，擁有壯觀的私人濱海步道景觀',
      image: 'room/room2.webp',
      basePrice: 16000
    },
    'room3': {
      title: '濱海露台客房',
      description: '金色色調與柔和設計，享受壯麗的濱海全景',
      image: 'room/room3.webp',
      basePrice: 17000
    },
    'room4': {
      title: '海景豪華客房',
      description: '開放式浴室設計，享受杜拜地標性海景',
      image: 'room/room4.webp',
      basePrice: 18000
    },
    'room5': {
      title: '海景露台客房',
      description: '專屬露台，欣賞杜拜地標性海景日落',
      image: 'room/room5.webp',
      basePrice: 19000
    },
    'room6': {
      title: '海景家庭房',
      description: '為家庭設計，享有壯觀海景與額外舒適設施',
      image: 'room/room6.webp',
      basePrice: 22000
    },
    'room7': {
      title: '濱海豪華套房',
      description: '寬敞的獨立客廳與露台，俯瞰壯麗濱海景致',
      image: 'room/room7.webp',
      basePrice: 28000
    },
    'room8': {
      title: '濱海步道豪華套房',
      description: '享受陽光與壯觀步道景觀的寬敞套房',
      image: 'room/room8.webp',
      basePrice: 30000
    },
    'room9': {
      title: '濱海露台套房',
      description: '適合家庭入住，享有壯觀濱海露台景觀',
      image: 'room/room9.webp',
      basePrice: 32000
    },
    'room10': {
      title: '海景豪華套房',
      description: '寬敞的獨立客廳與壯觀海景露台',
      image: 'room/room10.webp',
      basePrice: 35000
    },
    'room11': {
      title: '海景全景客房',
      description: '全景露台，俯瞰杜拜閃耀海岸線',
      image: 'room/room11.webp',
      basePrice: 38000
    },
    'room12': {
      title: '海景露台套房',
      description: '寬敞套房，享受室內外生活與壯觀海景',
      image: 'room/room12.webp',
      basePrice: 42000
    },
    'room13': {
      title: '海景尊貴露台套房',
      description: '尊貴套房，享有阿拉伯灣與私人濱海景觀',
      image: 'room/room13.webp',
      basePrice: 45000
    },
    'room14': {
      title: '珍珠套房',
      description: '兩臥室尊貴套房，適合高端活動與聚會',
      image: 'room/room14.webp',
      basePrice: 60000
    },
    'room15': {
      title: '總統套房',
      description: '兩臥室宮殿級套房，配備私人泳池與專屬管家',
      image: 'room/room15.webp',
      basePrice: 80000
    },
    'room16': {
      title: '皇家套房',
      description: '一臥室尊榮套房，享有壯觀全景與私人泳池',
      image: 'room/room16.webp',
      basePrice: 100000
    },
    'room17': {
      title: '兩臥室濱海家庭房',
      description: '兩間濱海客房連通，適合全家舒適入住',
      image: 'room/room17.webp',
      basePrice: 35000
    },
    'room18': {
      title: '兩臥室海景家庭房',
      description: '兩間海景客房連通，享受壯觀海景與寬敞空間',
      image: 'room/room18.webp',
      basePrice: 38000
    },
    'room19': {
      title: '兩臥室濱海家庭套房',
      description: '濱海豪華套房與客房連通，適合家庭或團體',
      image: 'room/room19.webp',
      basePrice: 45000
    },
    'room20': {
      title: '兩臥室海景家庭套房',
      description: '兩臥室套房，享有壯觀海景與寬敞露台',
      image: 'room/room20.webp',
      basePrice: 48000
    },
    'room21': {
      title: '五臥室皇家套房',
      description: '尊榮五臥室套房，配備私人泳池、酒吧與遊戲區',
      image: 'room/room21.webp',
      basePrice: 150000
    }
  };

  return roomData[roomId] || roomData['room1'];
}

module.exports = router; 