// Configuration will be loaded from /config endpoint
let CONFIG = null;
const INDOOR_API_URL = '/api/states/sensor.rtr574_i_52c0090b_temperature';
const INDOOR_HUMIDITY_API_URL = '/api/states/sensor.rtr574_i_52c0090b_humidity';
const OUTDOOR_API_URL = '/api/states/sensor.hioki_wen_du';

const tempValueElement = document.getElementById('temperature-value');
const outdoorTempValueElement = document.getElementById('outdoor-temperature-value');
const humidityValueElement = document.getElementById('humidity-value');
const lastUpdatedElement = document.getElementById('last-updated');
const statusDot = document.querySelector('.dot');
const statusText = document.querySelector('.status-text');
const comfortText = document.getElementById('comfort-text');
const adviceText = document.getElementById('advice-text');
const meterMarker = document.getElementById('meter-marker');

let isFetching = false;

// Load configuration from server
async function loadConfig() {
    try {
        const response = await fetch('/config');
        if (response.ok) {
            CONFIG = await response.json();
            console.log('Configuration loaded successfully');
            return true;
        }
    } catch (error) {
        console.error('Failed to load configuration:', error);
    }
    return false;
}

async function fetchIndoorTemperature() {
    try {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (CONFIG && CONFIG.HA_TOKEN) {
            headers['Authorization'] = `Bearer ${CONFIG.HA_TOKEN}`;
        }

        const response = await fetch(INDOOR_API_URL, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.state && data.state !== 'unavailable' && data.state !== 'unknown') {
            const temperature = parseFloat(data.state);
            if (!isNaN(temperature)) {
                updateIndoorDisplay(temperature);
                return true;
            }
        }
    } catch (error) {
        console.error('Error fetching indoor temperature:', error);
    }
    return false;
}

async function fetchIndoorHumidity() {
    try {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (CONFIG && CONFIG.HA_TOKEN) {
            headers['Authorization'] = `Bearer ${CONFIG.HA_TOKEN}`;
        }

        const response = await fetch(INDOOR_HUMIDITY_API_URL, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.state && data.state !== 'unavailable' && data.state !== 'unknown') {
            const humidity = parseFloat(data.state);
            if (!isNaN(humidity)) {
                updateHumidityDisplay(humidity);
                return true;
            }
        }
    } catch (error) {
        console.error('Error fetching indoor humidity:', error);
    }
    return false;
}

async function fetchOutdoorTemperature() {
    try {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (CONFIG && CONFIG.HA_TOKEN) {
            headers['Authorization'] = `Bearer ${CONFIG.HA_TOKEN}`;
        }

        const response = await fetch(OUTDOOR_API_URL, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.state && data.state !== 'unavailable' && data.state !== 'unknown') {
            const temperature = parseFloat(data.state);
            if (!isNaN(temperature)) {
                updateOutdoorDisplay(temperature);
                return true;
            }
        }
    } catch (error) {
        console.error('Error fetching outdoor temperature:', error);
    }
    return false;
}

async function fetchAllTemperatures() {
    if (isFetching) return;
    isFetching = true;

    try {
        statusText.textContent = '更新中...';
        statusDot.className = 'dot active';

        const [indoorSuccess, outdoorSuccess, humiditySuccess] = await Promise.all([
            fetchIndoorTemperature(),
            fetchOutdoorTemperature(),
            fetchIndoorHumidity()
        ]);

        if (indoorSuccess || outdoorSuccess || humiditySuccess) {
            updateStatus(true);
            const now = new Date();
            lastUpdatedElement.textContent = now.toLocaleTimeString();
        } else {
            updateStatus(false, 'データ取得失敗');
        }
    } catch (error) {
        console.error('Error fetching temperatures:', error);
        updateStatus(false, error.message);
    } finally {
        isFetching = false;
        setTimeout(fetchAllTemperatures, 60000);
    }
}

function updateIndoorDisplay(temperature) {
    const currentVal = parseFloat(tempValueElement.textContent) || 0;
    const newVal = parseFloat(temperature);

    if (currentVal !== newVal) {
        animateValue(tempValueElement, currentVal, newVal, 1000, updateComfort);
    } else {
        tempValueElement.textContent = newVal.toFixed(1);
        updateComfort(newVal);
    }
}

function updateOutdoorDisplay(temperature) {
    const currentVal = parseFloat(outdoorTempValueElement.textContent) || 0;
    const newVal = parseFloat(temperature);

    if (currentVal !== newVal) {
        animateValue(outdoorTempValueElement, currentVal, newVal, 1000);
    } else {
        outdoorTempValueElement.textContent = newVal.toFixed(1);
    }
}

function updateHumidityDisplay(humidity) {
    const currentVal = parseFloat(humidityValueElement.textContent) || 0;
    const newVal = parseFloat(humidity);

    if (currentVal !== newVal) {
        animateValue(humidityValueElement, currentVal, newVal, 1000);
    } else {
        humidityValueElement.textContent = newVal.toFixed(1);
    }
}

function updateStatus(isSuccess, message = '') {
    if (isSuccess) {
        statusDot.classList.add('active');
        statusDot.style.backgroundColor = '#22c55e'; // Green
        statusText.textContent = '接続完了';
        statusText.style.color = '#16a34a';
    } else {
        statusDot.classList.remove('active');
        statusDot.style.backgroundColor = '#ef4444'; // Red
        statusText.textContent = message || 'エラー';
        statusText.style.color = '#dc2626';
    }
}

function animateValue(obj, start, end, duration, onUpdate) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = progress * (end - start) + start;
        obj.innerHTML = value.toFixed(1);

        if (onUpdate) {
            onUpdate(value);
        }

        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

function updateComfort(temp) {
    // Range: 10°C to 30°C for the meter
    const min = 10;
    const max = 30;
    const percentage = Math.max(0, Math.min(100, ((temp - min) / (max - min)) * 100));

    console.log(`updateComfort called with temp: ${temp}, percentage: ${percentage}`);

    meterMarker.style.left = `${percentage}%`;

    const adviceContainer = document.getElementById('advice-container');

    if (temp < 19) { // 19℃未満は寒い
        comfortText.textContent = '少し寒い';
        comfortText.style.color = '#3b82f6'; // 快適度テキストは青（寒色）のまま
        adviceText.textContent = '暖房の温度を２２℃に上げてください';
        adviceText.style.color = '#ef4444'; // アドバイスは赤（暖房イメージ）
        adviceContainer.style.display = 'flex';
        adviceContainer.style.borderColor = '#ef4444'; // 枠線も赤
    } else if (temp > 23) { // 23℃超は暑い
        comfortText.textContent = '少し暑い';
        comfortText.style.color = '#ef4444'; // 快適度テキストは赤（暖色）のまま
        adviceText.textContent = '暖房の温度を２２℃にしてください';
        adviceText.style.color = '#3b82f6'; // アドバイスは青（冷房イメージ）
        adviceContainer.style.display = 'flex';
        adviceContainer.style.borderColor = '#3b82f6'; // 枠線も青
    } else {
        comfortText.textContent = '快適';
        comfortText.style.color = '#22c55e';
        adviceText.textContent = '快適です。この状態を維持しましょう！';
        adviceText.style.color = '#22c55e'; // 快適時は緑
        adviceContainer.style.display = 'flex';
        adviceContainer.style.borderColor = '#22c55e'; // 枠線も緑
    }

    // 背景色を温度に応じて変更（温度バーと同じグラデーション）
    // 10℃ = 青(#3b82f6), 20℃ = 緑(#22c55e), 30℃ = 赤(#ef4444)
    const bgColor = calculateBackgroundColor(temp, min, max);
    document.body.style.backgroundColor = bgColor;
}

// 温度に応じた背景色を計算する関数
function calculateBackgroundColor(temp, min, max) {
    // 色の定義 (RGB)
    const coldColor = { r: 59, g: 130, b: 246 };   // #3b82f6 (青)
    const comfortColor = { r: 34, g: 197, b: 94 }; // #22c55e (緑)
    const hotColor = { r: 239, g: 68, b: 68 };     // #ef4444 (赤)

    // 温度を0-1の範囲に正規化
    const normalizedTemp = Math.max(0, Math.min(1, (temp - min) / (max - min)));

    let r, g, b;

    if (normalizedTemp <= 0.5) {
        // 青から緑へ (0 - 0.5)
        const t = normalizedTemp * 2; // 0-1に再正規化
        r = Math.round(coldColor.r + (comfortColor.r - coldColor.r) * t);
        g = Math.round(coldColor.g + (comfortColor.g - coldColor.g) * t);
        b = Math.round(coldColor.b + (comfortColor.b - coldColor.b) * t);
    } else {
        // 緑から赤へ (0.5 - 1)
        // 暑さを強調するため、少し早めに赤みがかるように調整 (平方根を使ってカーブを変える)
        let t = (normalizedTemp - 0.5) * 2;
        t = Math.pow(t, 0.7); // 1より小さい指数でカーブを膨らませ、赤への変化を早める

        r = Math.round(comfortColor.r + (hotColor.r - comfortColor.r) * t);
        g = Math.round(comfortColor.g + (hotColor.g - comfortColor.g) * t);
        b = Math.round(comfortColor.b + (hotColor.b - comfortColor.b) * t);
    }

    // 背景色は少し薄くするため、白と混ぜる（透明度的な効果）
    const alpha = 0.4; // 色味を少し強くする (0.3 -> 0.4)
    const bgR = Math.round(r * alpha + 255 * (1 - alpha));
    const bgG = Math.round(g * alpha + 255 * (1 - alpha));
    const bgB = Math.round(b * alpha + 255 * (1 - alpha));

    return `rgb(${bgR}, ${bgG}, ${bgB})`;
}

// Initialize: Load config then start fetching
(async function init() {
    const configLoaded = await loadConfig();
    if (configLoaded) {
        fetchAllTemperatures();
    } else {
        console.error('Failed to load configuration. Temperature fetching will not start.');
        updateStatus(false, '設定の読み込みに失敗しました');
    }
})();

