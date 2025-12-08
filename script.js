// Configuration will be loaded from /config endpoint
let CONFIG = null;
const INDOOR_API_URL = '/api/states/sensor.rtr574_i_52c0090b_temperature';
const OUTDOOR_API_URL = '/api/states/sensor.hioki_wen_du';

const tempValueElement = document.getElementById('temperature-value');
const outdoorTempValueElement = document.getElementById('outdoor-temperature-value');
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

        const [indoorSuccess, outdoorSuccess] = await Promise.all([
            fetchIndoorTemperature(),
            fetchOutdoorTemperature()
        ]);

        if (indoorSuccess || outdoorSuccess) {
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
        adviceText.textContent = 'エアコンの温度を上げてください';
        adviceText.style.color = '#ef4444'; // アドバイスは赤（暖房イメージ）
        adviceContainer.style.display = 'flex';
        adviceContainer.style.borderColor = '#ef4444'; // 枠線も赤
    } else if (temp > 23) { // 23℃超は暑い
        comfortText.textContent = '少し暑い';
        comfortText.style.color = '#ef4444'; // 快適度テキストは赤（暖色）のまま
        adviceText.textContent = 'エアコンの温度を下げてください';
        adviceText.style.color = '#3b82f6'; // アドバイスは青（冷房イメージ）
        adviceContainer.style.display = 'flex';
        adviceContainer.style.borderColor = '#3b82f6'; // 枠線も青
    } else {
        comfortText.textContent = '快適';
        comfortText.style.color = '#22c55e';
        adviceText.textContent = '';
        adviceContainer.style.display = 'none';
    }
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

