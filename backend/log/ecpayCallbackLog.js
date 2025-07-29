// log/ecpayCallbackLog.js
const fs = require('fs');
const path = require('path');

// ✅ 建立 logs 資料夾（若不存在）
const logDir = path.join(__dirname);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// ✅ 寫入成功 callback log
function logSuccess(data) {
  const filePath = path.join(logDir, 'ecpay-success.log');
  const content = `[${new Date().toISOString()}] SUCCESS: ${JSON.stringify(data)}\n`;
  fs.appendFile(filePath, content, err => {
    if (err) console.error('❌ 無法寫入成功 callback log：', err);
  });
}

// ✅ 寫入錯誤 callback log
function logError(data) {
  const filePath = path.join(logDir, 'ecpay-error.log');
  const content = `[${new Date().toISOString()}] ERROR: ${JSON.stringify(data)}\n`;
  fs.appendFile(filePath, content, err => {
    if (err) console.error('❌ 無法寫入錯誤 callback log：', err);
  });
}

module.exports = { logSuccess, logError };
