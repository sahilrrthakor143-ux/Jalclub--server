// API Configuration
const API_BASE_URL = 'http://localhost:8080/api';

// Global Variables
let currentUser = null;
let currentToken = null;
let selectedColor = null;
let betAmount = 100;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const token = localStorage.getItem('jalclub_token');
    const user = localStorage.getItem('jalclub_user');
    
    if (token && user) {
        currentToken = token;
        currentUser = JSON.parse(user);
        showGameContainer();
        loadUserData();
    } else {
        showAuthContainer();
    }

    // Auth Form Listeners
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
});

// ========== AUTH FUNCTIONS ==========

function toggleAuth() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authTitle = document.getElementById('authTitle');
    
    if (loginForm.style.display === 'none') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        authTitle.textContent = 'Login to JalClub';
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        authTitle.textContent = 'Create Account';
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentToken = data.token;
            currentUser = { id: data.userId, email: data.email, walletBalance: data.walletBalance };
            
            localStorage.setItem('jalclub_token', currentToken);
            localStorage.setItem('jalclub_user', JSON.stringify(currentUser));
            
            showToast('Login successful!', 'success');
            showGameContainer();
            loadUserData();
        } else {
            showToast(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('regFullName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const phone = document.getElementById('regPhone').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, fullName, phone })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Registration successful! Please login.', 'success');
            toggleAuth();
            document.getElementById('registerForm').reset();
        } else {
            showToast(data.message || 'Registration failed', 'error');
        }
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
    }
}

function logout() {
    localStorage.removeItem('jalclub_token');
    localStorage.removeItem('jalclub_user');
    currentToken = null;
    currentUser = null;
    showAuthContainer();
    showToast('Logged out successfully', 'info');
}

// ========== UI FUNCTIONS ==========

function showAuthContainer() {
    document.getElementById('authContainer').style.display = 'flex';
    document.getElementById('gameContainer').style.display = 'none';
}

function showGameContainer() {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'flex';
    document.getElementById('userEmail').textContent = currentUser.email;
}

// ========== USER DATA FUNCTIONS ==========

async function loadUserData() {
    try {
        const response = await fetch(`${API_BASE_URL}/wallet/details`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        
        const data = await response.json();
        
        document.getElementById('walletBalance').textContent = data.currentBalance?.toFixed(2) || '0.00';
        document.getElementById('totalBets').textContent = data.totalBets || '0';
        document.getElementById('totalWon').textContent = (data.totalWinnings || 0).toFixed(2);
        
        const winRate = data.totalBets > 0 ? ((data.totalBets / 2) * 100).toFixed(0) : '0';
        document.getElementById('winRate').textContent = winRate + '%';
        
        loadBetHistory();
    } catch (error) {
        console.log('Error loading user data:', error);
    }
}

async function loadBetHistory() {
    try {
        const response = await fetch(`${API_BASE_URL}/bets/history`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        
        const bets = await response.json();
        const historyContainer = document.getElementById('betHistory');
        historyContainer.innerHTML = '';
        
        if (Array.isArray(bets) && bets.length > 0) {
            bets.slice(0, 5).forEach(bet => {
                const betItem = document.createElement('div');
                betItem.className = `bet-item ${bet.status.toLowerCase()}`;
                betItem.innerHTML = `
                    <p><strong>${bet.selectedColor}</strong> - ₹${bet.betAmount}</p>
                    <p class="result">${bet.status === 'WON' ? '✅ Won' : bet.status === 'LOST' ? '❌ Lost' : '⏳ Pending'}</p>
                `;
                historyContainer.appendChild(betItem);
            });
        } else {
            historyContainer.innerHTML = '<p style="text-align:center; color:#999;">No bets yet</p>';
        }
    } catch (error) {
        console.log('Error loading bet history:', error);
    }
}

// ========== BET FUNCTIONS ==========

function selectColor(color) {
    // Remove previous selection
    document.querySelectorAll('.color-box').forEach(box => {
        box.classList.remove('selected');
    });
    
    // Add selection to clicked color
    event.target.closest('.color-box').classList.add('selected');
    
    selectedColor = color;
    document.getElementById('selectedColor').textContent = color;
    updatePotentialWin();
    
    showToast(`Selected: ${color}`, 'info');
}

function updateBetAmount() {
    betAmount = parseFloat(document.getElementById('betAmount').value) || 100;
    document.getElementById('displayBetAmount').textContent = betAmount.toFixed(2);
    updatePotentialWin();
}

function updatePotentialWin() {
    const potential = betAmount * 2;
    document.getElementById('potentialWin').textContent = potential.toFixed(2);
    
    document.getElementById('betAmount').addEventListener('change', updateBetAmount);
    document.getElementById('betAmount').addEventListener('input', updateBetAmount);
}

function addCustomAmount() {
    const amount = prompt('Enter amount (₹10 - ₹10000):', '100');
    if (amount) {
        const numAmount = parseFloat(amount);
        if (numAmount >= 10 && numAmount <= 10000) {
            document.getElementById('betAmount').value = numAmount;
            updateBetAmount();
        } else {
            showToast('Amount should be between ₹10 and ₹10000', 'error');
        }
    }
}

async function placeBet() {
    if (!selectedColor) {
        showToast('Please select a color', 'error');
        return;
    }
    
    betAmount = parseFloat(document.getElementById('betAmount').value);
    
    if (betAmount < 10 || betAmount > 10000) {
        showToast('Bet amount should be between ₹10 and ₹10000', 'error');
        return;
    }
    
    if (currentUser.walletBalance < betAmount) {
        showToast('Insufficient wallet balance', 'error');
        return;
    }
    
    try {
        document.getElementById('placeBetBtn').disabled = true;
        
        const response = await fetch(`${API_BASE_URL}/bets/place`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                betAmount: betAmount,
                selectedColor: selectedColor
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Bet placed successfully!', 'success');
            
            // Wait 2 seconds then get result
            setTimeout(() => {
                getResult(data.betId);
            }, 2000);
        } else {
            showToast(data.message || 'Bet failed', 'error');
            document.getElementById('placeBetBtn').disabled = false;
        }
    } catch (error) {
        showToast('Error: ' + error.message, 'error');
        document.getElementById('placeBetBtn').disabled = false;
    }
}

async function getResult(betId) {
    try {
        const response = await fetch(`${API_BASE_URL}/bets/${betId}/result`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        
        const data = await response.json();
        
        document.getElementById('resultYourChoice').textContent = data.selectedColor;
        document.getElementById('resultColor').textContent = data.resultColor;
        
        const resultStatus = document.getElementById('resultStatus');
        const resultAmount = document.getElementById('resultAmount');
        
        if (data.status === 'WON') {
            resultStatus.textContent = '🎉 You Won!';
            resultStatus.className = 'result-status won';
            resultAmount.textContent = `You won ₹${data.winningAmount}`;
        } else {
            resultStatus.textContent = '😢 You Lost!';
            resultStatus.className = 'result-status lost';
            resultAmount.textContent = `Better luck next time!`;
        }
        
        document.getElementById('resultContainer').style.display = 'flex';
        document.getElementById('placeBetBtn').disabled = false;
        loadUserData();
    } catch (error) {
        showToast('Error getting result: ' + error.message, 'error');
        document.getElementById('placeBetBtn').disabled = false;
    }
}

function resetBet() {
    selectedColor = null;
    document.getElementById('betAmount').value = '100';
    document.getElementById('selectedColor').textContent = 'None';
    document.getElementById('displayBetAmount').textContent = '0';
    document.getElementById('potentialWin').textContent = '0';
    
    document.querySelectorAll('.color-box').forEach(box => {
        box.classList.remove('selected');
    });
    
    showToast('Bet reset', 'info');
}

function playAgain() {
    document.getElementById('resultContainer').style.display = 'none';
    resetBet();
}

// ========== WALLET FUNCTIONS ==========

function addMoney() {
    document.getElementById('addMoneyModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('addMoneyModal').style.display = 'none';
}

function confirmAddMoney() {
    const amount = parseFloat(document.getElementById('addMoneyAmount').value);
    
    if (amount < 10 || amount > 100000) {
        showToast('Amount should be between ₹10 and ₹100000', 'error');
        return;
    }
    
    // Simulate adding money (In real scenario, integrate with payment gateway)
    currentUser.walletBalance += amount;
    localStorage.setItem('jalclub_user', JSON.stringify(currentUser));
    
    document.getElementById('walletBalance').textContent = currentUser.walletBalance.toFixed(2);
    showToast(`₹${amount} added to wallet!`, 'success');
    closeModal();
    loadUserData();
}

// ========== UTILITY FUNCTIONS ==========

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}