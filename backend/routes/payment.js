// ✅ 最上方先引入模組
const express = require('express');
const router = express.Router();
const ecpay_payment = require('ecpay-payment');
const pool = require('../database'); // ✅ 一定要放在最上方，才能在 callback 使用

// ✅ 測試金鑰（請勿上線使用）
const options = {
  MerchantID: '2000132',
  HashKey: '5294y06JbISpM5x9',
  HashIV: 'v77hoKGq4kWxNNIS',
  ReturnURL: 'http://localhost:3000/api/payment/callback',
  ClientBackURL: 'http://localhost:3000/bookings.html'
};

// ✅ 建立綠界付款訂單（aio）
router.post('/', (req, res) => {
  try {
    const { bookingId, amount, description } = req.body;

    const now = new Date();
    const MerchantTradeDate = `${now.getFullYear()}/${(now.getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')} ${now
      .getHours()
      .toString()
      .padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now
      .getSeconds()
      .toString()
      .padStart(2, '0')}`;

    const base_param = {
      MerchantTradeNo: 'ORDER' + Date.now(),
      MerchantTradeDate,
      TotalAmount: String(amount),
      TradeDesc: description || '網站預訂房間',
      ItemName: '住宿房型 x1',
      ReturnURL: options.ReturnURL,
      ClientBackURL: options.ClientBackURL,
      ChoosePayment: 'ALL',
      PaymentType: 'aio',
      EncryptType: 1,
      CustomField1: bookingId?.toString() || 'noid'
    };

    const create = new ecpay_payment(options);
    const html = create.payment_client.aio_check_out_all(base_param, {});

    res.send(html);
  } catch (err) {
    console.error('❌ 建立金流失敗：', err);
    res
      .status(500)
      .send(`<h1>建立金流訂單失敗</h1><pre>${err.message}</pre>`);
  }
});

// ✅ 綠界付款完成後回呼（ReturnURL）
router.post('/callback', async (req, res) => {
  try {
    // ✅ 印出完整內容觀察（很重要）
    console.log('🔁 綠界 callback req.body：', req.body);

    const {
      RtnCode,
      CustomField1, // bookingId
      PaymentDate,
      PaymentType,
      TradeNo,
      PaymentMethod,
      MerchantTradeNo
    } = req.body;

    if (RtnCode === '1' || RtnCode === 1) {
      const bookingId = CustomField1;

      await pool.execute(
        `
        UPDATE bookings SET
          payment_status = 'confirmed',
          payment_method = ?,
          payment_date = ?,
          payment_number = ?,
          payment_type = ?,
          ecpay_merchant_trade_no = ?,
          ecpay_payment_date = ?
        WHERE bookingId = ?
      `,
        [
          PaymentMethod || null,
          PaymentDate || null,
          TradeNo || null,
          PaymentType || null,
          MerchantTradeNo || null,
          PaymentDate || null,
          bookingId
        ]
      );

      console.log(`✅ 綠界通知成功：訂單 ${bookingId} 已更新付款資訊`);
      res.send('1|OK');
    } else {
      console.warn('❗ 綠界通知失敗：RtnCode ≠ 1，收到的是', RtnCode);
      res.send('0|FAIL');
    }
  } catch (err) {
    console.error('❌ 綠界 callback 錯誤：', err);
    res.send('0|FAIL');
  }
});

module.exports = router;
