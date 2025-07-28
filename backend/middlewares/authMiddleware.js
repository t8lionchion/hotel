const jwt = require('jsonwebtoken');
const SECRET = 'your_jwt_secret_key';

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: '未提供授權 Token' });
  }

  const token = authHeader.split(' ')[1]; // 取得 Bearer 後面的 token

  try {
    const decoded = jwt.verify(token, SECRET); // 驗證 token 有效性
    req.user = decoded; // 把解碼後的 user 資料存到 req 裡
    next(); // 放行
  } catch (err) {
    return res.status(401).json({ message: 'Token 無效或已過期' });
  }
}

module.exports = verifyToken;
