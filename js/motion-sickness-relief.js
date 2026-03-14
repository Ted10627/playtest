// motion-sickness-relief.js
// 白底黑點，等距網格排列，陀螺儀偵測偏移，無陀螺儀則模擬緩慢飄動

const canvas = document.getElementById('dotCanvas');
const ctx = canvas.getContext('2d');

const DOT_RADIUS = 5;       // 黑點半徑
const GRID_SPACING = 40;    // 網格間距
const MAX_OFFSET = 18;      // 最大位移量(px)

let offsetX = 0;
let offsetY = 0;
let gyroAvailable = false;

// ── 繪製點陣 ───────────────────────────────────────────────
function drawDots(ox, oy) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 白底
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 多畫一圈防止邊緣空白
    const cols = Math.ceil(canvas.width / GRID_SPACING) + 2;
    const rows = Math.ceil(canvas.height / GRID_SPACING) + 2;

    const startX = -GRID_SPACING + (ox % GRID_SPACING);
    const startY = -GRID_SPACING + (oy % GRID_SPACING);

    ctx.fillStyle = '#000000';
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const x = startX + c * GRID_SPACING;
            const y = startY + r * GRID_SPACING;
            ctx.beginPath();
            ctx.arc(x, y, DOT_RADIUS, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// ── 調整 Canvas 尺寸 ────────────────────────────────────────
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawDots(offsetX, offsetY);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ── 模擬飄動（無陀螺儀時） ──────────────────────────────────
let floatAngle = 0;
let animFrameId = null;

function floatAnimate() {
    floatAngle += 0.008; // 控制飄動速度
    offsetX = Math.sin(floatAngle * 0.7) * MAX_OFFSET;
    offsetY = Math.cos(floatAngle) * MAX_OFFSET;
    drawDots(offsetX, offsetY);
    animFrameId = requestAnimationFrame(floatAnimate);
}

// ── 陀螺儀處理 ──────────────────────────────────────────────
function handleGyro(event) {
    // beta: 前後傾斜 (-180~180)，gamma: 左右傾斜 (-90~90)
    const beta = event.beta ?? 0;
    const gamma = event.gamma ?? 0;

    // 正規化到 -MAX_OFFSET ~ MAX_OFFSET
    offsetX = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, (gamma / 45) * MAX_OFFSET));
    offsetY = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, ((beta - 45) / 45) * MAX_OFFSET));

    drawDots(offsetX, offsetY);
}

// ── 陀螺儀權限請求 (iOS 13+) ────────────────────────────────
function requestGyroPermission() {
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
        // iOS 需要使用者手勢才能請求
        DeviceOrientationEvent.requestPermission()
            .then(permissionState => {
                if (permissionState === 'granted') {
                    window.addEventListener('deviceorientation', handleGyro);
                    gyroAvailable = true;
                    if (animFrameId) {
                        cancelAnimationFrame(animFrameId);
                        animFrameId = null;
                    }
                }
            })
            .catch(console.error);
    } else if (typeof DeviceOrientationEvent !== 'undefined') {
        // Android / 非 iOS 直接監聽
        window.addEventListener('deviceorientation', (e) => {
            // 確認有實際陀螺儀資料（非全 null）
            if (!gyroAvailable && (e.alpha !== null || e.beta !== null || e.gamma !== null)) {
                gyroAvailable = true;
                if (animFrameId) {
                    cancelAnimationFrame(animFrameId);
                    animFrameId = null;
                }
            }
            if (gyroAvailable) handleGyro(e);
        });
    }
}

// ── 初始化 ──────────────────────────────────────────────────
function init() {
    // iOS 需透過按鈕觸發，在 canvas 上點擊一次即嘗試授權
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
        // 顯示提示並等待點擊
        canvas.addEventListener('click', () => {
            requestGyroPermission();
        }, { once: true });
        // 先啟動模擬
        floatAnimate();
    } else {
        // 非 iOS：直接嘗試監聽
        requestGyroPermission();
        // 500ms 後若陀螺儀還未就緒，啟動模擬
        setTimeout(() => {
            if (!gyroAvailable) floatAnimate();
        }, 500);
    }
}

init();
