// ✅ 最上方先引入模組
const express = require('express');
const router = express.Router();
const ecpay_payment = require('ecpay-payment');
const {pool} = require('../database'); // ✅ 一定要放在最上方，才能在 callback 使用

// ✅ 測試金鑰
const options = {
  MerchantID: '3002607',
  HashKey: 'pwFHCqoQZGmho4w6',
  HashIV: 'EkRm7iFT261dpevs',
  ReturnURL: 'https://hosttest250723.ddns.net/api/payment/callback',
  ClientBackURL: 'https://hosttest250723.ddns.net/bookings.html'
};

// ✅ 建立綠界付款訂單（aio）- 原始路由
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
      CustomField1: bookingId?.toString() || 'noid',
      OrderResultURL: 'https://hosttest250723.ddns.net/bookings.html'

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

// ✅ 建立綠界付款訂單（create-order路由 - 相容前端請求）
router.post('/create-order', (req, res) => {
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
      CustomField1: bookingId?.toString() || 'noid',
      OrderResultURL: 'https://hosttest250723.ddns.net/bookings.html'
    };

    const create = new ecpay_payment(options);
    const html = create.payment_client.aio_check_out_all(base_param, {});

    // 返回 JSON 格式，讓前端可以處理
    res.json({
      success: true,
      html: html,
      paymentUrl: 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5', // 綠界測試環境
      paymentParams: base_param
    });
  } catch (err) {
    console.error('❌ 建立金流失敗：', err);
    res.status(500).json({
      success: false,
      message: '建立金流訂單失敗',
      error: err.message
    });
  }
});
const { logSuccess, logError } = require('../log/ecpayCallbackLog'); // ✅ 引入 log 模組

router.post('/callback', async (req, res) => {
  try {
    console.log('🔁 callback req.body:', req.body);

    const {
      RtnCode,
      CustomField1,
      PaymentDate,
      PaymentType,
      TradeNo,
      PaymentMethod,
      MerchantTradeNo
    } = req.body;

    if (RtnCode === '1' || RtnCode === 1) {
      const bookingId = CustomField1;

   await pool.execute(`
        UPDATE bookings SET
          payment_status = 'paid',
          payment_method = ?,
          payment_date = ?,
          payment_number = ?,
          payment_type = ?,
          ecpay_merchant_trade_no = ?,
          ecpay_payment_date = ?
        WHERE id = ?
      `, [
        PaymentMethod || null,
        PaymentDate || null,
        TradeNo || null,
        PaymentType || null,
        MerchantTradeNo || null,
        PaymentDate || null,
        bookingId
      ]); 

      console.log(`✅ 更新訂單 ${bookingId} 付款資訊成功`);
      logSuccess(bookingId, req.body);
      res.send('1|OK');
    } else {
      console.warn(`❗ RtnCode != 1，收到的是 ${RtnCode}`);
      logError(req.body);
      res.send('0|FAIL');
    }
  } catch (err) {
    console.error('❌ callback 發生錯誤:', err);
    logError(req.body);
    res.send('0|FAIL');
  }
});


router.get('/status', async (req, res) => {
  try {
    const { bookingId } = req.query;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: '缺少 bookingId'
      });
    }

    const [rows] = await pool.execute(
      'SELECT payment_status FROM bookings WHERE id = ?',
      [bookingId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '找不到對應的訂單'
      });
    }

    res.status(200).json({
      success: true,
      payment_status: rows[0].payment_status
    });
  } catch (err) {
    console.error('❌ 取得訂單狀態失敗:', err);
    res.status(500).json({
      success: false,
      message: '取得訂單狀態失敗',
      error: err.message
    });
  }
});

module.exports = router;
