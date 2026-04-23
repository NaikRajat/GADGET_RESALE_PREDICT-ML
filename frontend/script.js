// ==========================================
// 1. GLOBAL STATE MANAGEMENT
// ==========================================
let state = {
    step: 1,
    brand: '',
    usageMonths: 12,
    originalPrice: 0,
    conditionScore: 100, // Starts perfect, drops based on answers
    answers: { scratches: '', screen: '', buttons: '', battery: '' }
};

// ==========================================
// 2. THEME TOGGLE (Dark/Light Mode)
// ==========================================
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;
themeToggle.addEventListener('click', () => {
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    document.getElementById('themeIcon').innerText = newTheme === 'dark' ? '☀️' : '🌙';
    
    // Update chart colors if it's already rendered
    if(state.step === 4 && state.predictedPrice) {
        renderChart(state.originalPrice, state.predictedPrice);
    }
});

// ==========================================
// 3. NAVIGATION LOGIC (Wizard Steps)
// ==========================================
function updateSteps() {
    // Hide all steps, show current
    document.querySelectorAll('.wizard-step').forEach(el => el.classList.add('hidden'));
    document.getElementById(`step${state.step}`).classList.remove('hidden');

    // Update Step Indicators (Top Progress Bar)
    document.querySelectorAll('.step-item').forEach(el => {
        const stepNum = parseInt(el.dataset.step);
        if (stepNum < state.step) {
            el.classList.add('completed', 'active');
        } else if (stepNum === state.step) {
            el.classList.add('active');
            el.classList.remove('completed');
        } else {
            el.classList.remove('completed', 'active');
        }
    });

    // Toggle Buttons based on Step
    document.getElementById('backBtn').classList.toggle('hidden', state.step === 1 || state.step === 4);
    
    if (state.step === 3) {
        document.getElementById('nextBtn').classList.add('hidden');
        document.getElementById('predictBtn').classList.remove('hidden');
    } else if (state.step === 4) {
        document.getElementById('nextBtn').classList.add('hidden');
        document.getElementById('predictBtn').classList.add('hidden');
        document.getElementById('wizardNav').classList.add('hidden'); // Hide bottom nav on result page
    } else {
        document.getElementById('nextBtn').classList.remove('hidden');
        document.getElementById('predictBtn').classList.add('hidden');
    }
}

document.getElementById('nextBtn').addEventListener('click', () => {
    if (state.step === 1 && !state.brand) return alert('Please select a brand.');
    if (state.step === 2 && !state.originalPrice) return alert('Please enter the original purchase price.');
    state.step++;
    updateSteps();
});

document.getElementById('backBtn').addEventListener('click', () => {
    state.step--;
    updateSteps();
});

// ==========================================
// 4. STEP 1 & 2 INPUT LOGIC
// ==========================================

// Brand Selection
document.querySelectorAll('.brand-card').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.brand-card').forEach(b => b.classList.remove('active'));
        const target = e.currentTarget;
        target.classList.add('active');
        state.brand = target.dataset.brand;
    });
});

// Usage Slider
const usageSlider = document.getElementById('usageSlider');
const usageDisplay = document.getElementById('usageDisplay');
usageSlider.addEventListener('input', (e) => {
    state.usageMonths = parseInt(e.target.value);
    usageDisplay.innerText = state.usageMonths + (state.usageMonths === 1 ? ' month' : ' months');
});

// Original Price Input
const priceInput = document.getElementById('priceInput');
priceInput.addEventListener('input', (e) => {
    state.originalPrice = parseFloat(e.target.value);
});

// Quick Chips (Fast filling for months and prices)
document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
        if (e.target.dataset.usage) {
            usageSlider.value = e.target.dataset.usage;
            usageSlider.dispatchEvent(new Event('input')); // Trigger update
        }
        if (e.target.dataset.price) {
            priceInput.value = e.target.dataset.price;
            priceInput.dispatchEvent(new Event('input')); // Trigger update
        }
    });
});

// ==========================================
// 5. STEP 3: CONDITION SCORING LOGIC
// ==========================================
function updateConditionScore() {
    let score = 100;
    
    // Deductions based on real-world damage impact
    if (state.answers.scratches === 'yes') score -= 10;
    if (state.answers.screen === 'yes') score -= 35; // Broken screens tank value
    if (state.answers.buttons === 'no') score -= 20;
    if (state.answers.battery === 'average') score -= 10;
    if (state.answers.battery === 'poor') score -= 25;
    
    state.conditionScore = Math.max(20, score); // Floor at 20%
    
    // Update UI Meter
    document.getElementById('scoreVal').innerText = state.conditionScore + '/100';
    document.getElementById('scoreFill').style.width = state.conditionScore + '%';
    
    // Update Badge text
    let badgeText = "Excellent";
    if(score < 85) badgeText = "Good Condition";
    if(score < 65) badgeText = "Fair Condition";
    if(score < 45) badgeText = "Poor Condition";
    document.getElementById('scoreBadge').innerText = badgeText;
}

// Add click listeners to Yes/No/Battery buttons
document.querySelectorAll('.cq-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const q = e.target.dataset.q;
        const val = e.target.dataset.val;
        
        // Handle visual active state
        const parent = e.target.closest('.cq-options');
        parent.querySelectorAll('.cq-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        // Save answer and recalculate
        state.answers[q] = val;
        updateConditionScore();
    });
});

// ==========================================
// 6. STEP 4: API CALL & CHART.JS
// ==========================================
let depChartInstance = null;

function renderChart(original, predicted) {
    const ctx = document.getElementById('depChart').getContext('2d');
    if (depChartInstance) depChartInstance.destroy();

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    const textColor = isDark ? '#9ca3af' : '#4b5563';

    // Create a 3-point curve: Purchase -> Midpoint Drop -> Current Resale
    const midpointDrop = original - ((original - predicted) * 0.6); 

    depChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Day 1 (Purchased)', `Mid-Life`, 'Today (Resale)'],
            datasets: [{
                label: 'Device Value (₹)',
                data: [original, midpointDrop, predicted],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                borderWidth: 3,
                fill: true,
                tension: 0.4, // Makes the line curvy
                pointRadius: 5,
                pointBackgroundColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { grid: { color: gridColor }, ticks: { color: textColor } },
                x: { grid: { display: false }, ticks: { color: textColor } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

document.getElementById('predictBtn').addEventListener('click', async () => {
    // Validate that all questions are answered
    if(Object.values(state.answers).some(val => val === '')) {
        return alert('Please answer all 4 condition questions to get an accurate estimate.');
    }

    // Transition to Step 4 Loading
    state.step = 4;
    updateSteps();
    document.getElementById('resultLoading').classList.remove('hidden');
    document.getElementById('resultMain').classList.add('hidden');

    const payload = {
        Brand: state.brand,
        Usage_Months: state.usageMonths,
        Original_Price: state.originalPrice,
        Condition_Score: state.conditionScore
    };

    try {
        // Call FastAPI
        const response = await fetch('http://127.0.0.1:8000/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if(!response.ok) throw new Error("API Request Failed");
        const data = await response.json();
        
        // Save predicted price to state for theme toggles
        state.predictedPrice = data.predicted_price;
        
        // Hide loading, show results
        document.getElementById('resultLoading').classList.add('hidden');
        document.getElementById('resultMain').classList.remove('hidden');
        
        // Update Main Result UI
        document.getElementById('resultPrice').innerText = data.formatted_price;
        document.getElementById('btFinal').innerText = data.formatted_price;
        document.getElementById('resultDeviceInfo').innerText = `${state.brand.toUpperCase()} Device • ${state.usageMonths} Months Old`;
        
        // Calculate Market Confidence based on Condition Score
        const confidence = state.conditionScore < 50 ? "82%" : "94%";
        document.getElementById('confPct').innerText = confidence;
        document.getElementById('confFill').style.width = confidence;

        // Draw Chart
        renderChart(state.originalPrice, data.predicted_price);

    } catch (error) {
        alert("Error connecting to server. Make sure your FastAPI backend is running!");
        state.step = 3;
        updateSteps();
    }
});

// ==========================================
// 7. RESULT ACTIONS (Reset / Recalculate)
// ==========================================
document.getElementById('resetBtn').addEventListener('click', () => location.reload());
document.getElementById('recalcBtn').addEventListener('click', () => {
    state.step = 1;
    document.getElementById('wizardNav').classList.remove('hidden');
    updateSteps();
});