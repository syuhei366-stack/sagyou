// Configuration will be loaded from /config endpoint
let CONFIG = null;
const API_URL = '/api/states/sensor.rtr574_i_52c0090b_temperature';

const tempValueElement = document.getElementById('temperature-value');
const lastUpdatedElement = document.getElementById('last-updated');
const statusDot = document.querySelector('.dot');
const statusText = document.querySelector('.status-text');
const comfortText = document.getElementById('comfort-text');
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

async function fetchTemperature() {
    if (isFetching) return;
    isFetching = true;

    try {
        statusText.textContent = '更新中...';
        statusDot.className = 'dot active';

        const headers = {
            'Content-Type': 'application/json'
        };

        // Add Authorization header if token is available
        if (CONFIG && CONFIG.HA_TOKEN) {
            headers['Authorization'] = `Bearer ${CONFIG.HA_TOKEN}`;
        }

        const response = await fetch(API_URL, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Check if state exists and is valid
        if (data.state && data.state !== 'unavailable' && data.state !== 'unknown') {
            const temperature = parseFloat(data.state);
            if (!isNaN(temperature)) {
                updateDisplay(temperature);
                updateStatus(true);
            } else {
                throw new Error(`Invalid temperature value: ${data.state}`);
            }
        } else {
            console.warn('Sensor unavailable or unknown state:', data.state);
            updateStatus(false, `センサー状態: ${data.state}`);
            tempValueElement.textContent = '--';
        }

    } catch (error) {
        console.error('Error fetching data:', error);
        updateStatus(false, error.message);
    } finally {
        isFetching = false;
        // Schedule next fetch
        setTimeout(fetchTemperature, 60000);
    }
}

function updateDisplay(temperature) {
    // Animate the number change
    const currentVal = parseFloat(tempValueElement.textContent) || 0;
    const newVal = parseFloat(temperature);

    if (currentVal !== newVal) {
        animateValue(tempValueElement, currentVal, newVal, 1000);
    } else {
        tempValueElement.textContent = newVal.toFixed(1);
    }

    updateComfort(newVal);

    const now = new Date();
    lastUpdatedElement.textContent = now.toLocaleTimeString();
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

function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = progress * (end - start) + start;
        obj.innerHTML = value.toFixed(1);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

function updateComfort(temp) {
    // Range: 10°C to 35°C for the meter
    const min = 10;
    const max = 35;
    const percentage = Math.max(0, Math.min(100, ((temp - min) / (max - min)) * 100));

    meterMarker.style.left = `${percentage}%`;

    if (temp < 18) {
        comfortText.textContent = '少し寒い';
        comfortText.style.color = '#3b82f6';
    } else if (temp > 24) {
        comfortText.textContent = '少し暑い';
        comfortText.style.color = '#ef4444';
    } else {
        comfortText.textContent = '快適';
        comfortText.style.color = '#22c55e';
    }
}

// Initialize: Load config then start fetching
(async function init() {
    const configLoaded = await loadConfig();
    if (configLoaded) {
        fetchTemperature();
    } else {
        console.error('Failed to load configuration. Temperature fetching will not start.');
        updateStatus(false, '設定の読み込みに失敗しました');
    }
})();

