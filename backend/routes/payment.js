const express = require('express');
const router = express.Router();
const ecpay_payment = require('ecpay-payment');
const { pool } = require('../database'); // 假設你的資料庫連線在這

// 綠界設定（請替換成自己的商店資料）
const options = {
    MerchantID: '你的MerchantID',
    HashKey: '你的HashKey',
    HashIV: '你的HashIV',
    ReturnURL: 'http://hosttest250723.ddns.net/api/payment/ecpay-callback', // 綠界回傳網址
    ClientBackURL: 'http://hosttest250723.ddns.net/thankyou.html', // 付款完成後返回網址
    // 注意：本地測試請用 ngrok 等工具讓綠界能回傳
};

// 建立訂單API
router.post('/create-order', async (req, res) => {
    try {
        const { bookingId, amount, description } = req.body;

        // 可依需求查詢 booking 資料確認資訊
        // const [rows] = await pool.execute('SELECT * FROM bookings WHERE id = ?', [bookingId]);
        // if (!rows.length) return res.json({ success: false, message: '無此訂單' });

        // 綠界SDK初始化
        const base_param = {
            MerchantTradeNo: `HOTEL${Date.now()}`, // 訂單編號需唯一
            MerchantTradeDate: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
            TotalAmount: parseInt(amount, 10),
            TradeDesc: description || '旅館訂單',
            ItemName: '訂房一筆',
            ReturnURL: options.ReturnURL,
            ClientBackURL: options.ClientBackURL,
            ChoosePayment: 'ALL',
        };

        // 建立表單
        try {
            const create = new ecpay_payment(options);
            const html = create.payment_client.aio_check_out_all(base_param);

            // 可將訂單編號存入 bookings.payment_number 等資料庫欄位
            // await pool.execute('UPDATE bookings SET payment_number = ? WHERE id = ?', [base_param.MerchantTradeNo, bookingId]);

            res.json({
                success: true,
                htmlForm: html // 前端可用 innerHTML 放入並自動送出
            });
        } catch (ecpayErr) {
            res.json({ success: false, message: `綠界API錯誤: ${ecpayErr.message}` });
        }
    } catch (err) {
        res.json({ success: false, message: `伺服器錯誤: ${err.message}` });
    }
});

module.exports = router;