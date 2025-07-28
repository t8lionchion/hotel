

function logout() {
  localStorage.removeItem('token');
  window.location.href = "/backEnd_login.html";
}

// 頁面一載入就檢查 token
const token = localStorage.getItem('token');

if (!token) {
  // 如果沒 token，跳轉回登入頁
  alert('您尚未登入，請先登入');
  window.location.href = '../backEnd_login.html';
} 




// DOM 元素
const autoLogout = document.getElementById('autoLogout');

// 15 分鐘毫秒
const INACTIVITY_LIMIT = 15 * 60 * 1000;

let logoutTimer = null;
let countTimer = null;
let endTime = Date.now() + INACTIVITY_LIMIT;

// ❶ 開始倒數登出計時器
function startInactivityTimer() {
  clearTimeout(logoutTimer);
  logoutTimer = setTimeout(() => {
    alert('閒置過久，自動登出');
    logout();
  }, INACTIVITY_LIMIT);
  endTime = Date.now() + INACTIVITY_LIMIT;
}

// ❷ 顯示剩下倒數時間（每秒執行）
function startCountdownDisplay() {
  countTimer = setInterval(() => {
    const remaining = endTime - Date.now();
    if (remaining <= 0) {
      clearInterval(countTimer);
      autoLogout.textContent = "00:00";
      alert("閒置時間過久, 自動登出");
      logout();
      return;
    }

    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    autoLogout.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, 1000);
}

// ❸ 滑鼠或鍵盤重置時間
function resetInactivityTimer() {
  startInactivityTimer();
}

// ❹ 初始化計時與事件
function initAutoLogout() {
  document.addEventListener('mousemove', resetInactivityTimer);
  document.addEventListener('keypress', resetInactivityTimer);
  startInactivityTimer();
  startCountdownDisplay();
  console.log('Auto logout initialized.');
}

// ✅ 啟動
initAutoLogout(); 
