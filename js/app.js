let currentUser = null;
let userStats = {
    balance: 0,
    adsWatched: 0,
    referrals: 0
};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    // Get user data from session
    const userData = sessionStorage.getItem('userData');
    if (userData) {
        currentUser = JSON.parse(userData);
        initDashboard();
        loadUserStats();
    } else {
        // Redirect to login if no user data
        window.location.href = 'index.html';
    }
});

function initDashboard() {
    if (!currentUser) return;
    
    // Set header info
    document.getElementById('headerPhoto').src = currentUser.photo_url || 'https://via.placeholder.com/50?text=User';
    document.getElementById('headerName').textContent = `${currentUser.first_name} ${currentUser.last_name}`;
    
    // Set referral link
    const botUsername = 'tgbotweb_bot'; // Replace with your bot username
    const referralLink = `https://t.me/${botUsername}?start=${currentUser.id}`;
    document.getElementById('referralLink').value = referralLink;
}

async function loadUserStats() {
    try {
        const response = await fetch(`api/user.php?user_id=${currentUser.id}`);
        const data = await response.json();
        
        if (data.success) {
            userStats = data.user;
            updateStatsDisplay();
        }
    } catch (error) {
        console.error('Error loading user stats:', error);
    }
}

function updateStatsDisplay() {
    document.getElementById('headerBalance').textContent = `${userStats.balance.toFixed(4)} MATIC`;
    document.getElementById('totalBalance').textContent = userStats.balance.toFixed(4);
    document.getElementById('adsWatched').textContent = userStats.ads_watched;
    document.getElementById('totalReferrals').textContent = userStats.referrals;
}

function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
}

async function watchAd() {
    const watchAdBtn = document.getElementById('watchAdBtn');
    const adStatus = document.getElementById('adStatus');
    
    watchAdBtn.disabled = true;
    adStatus.textContent = '⏳ Loading ad...';
    
    try {
        // Show Gigapub ad
        await window.showGiga();
        
        // If ad completed successfully, reward user
        const response = await fetch('api/ads.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: currentUser.id,
                action: 'watch_ad'
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            userStats.balance += data.reward;
            userStats.ads_watched += 1;
            updateStatsDisplay();
            adStatus.textContent = `✅ Ad completed! Earned ${data.reward} MATIC`;
            
            // Set cooldown
            setTimeout(() => {
                watchAdBtn.disabled = false;
                adStatus.textContent = '';
            }, data.cooldown * 60 * 1000); // Convert minutes to milliseconds
            
        } else {
            adStatus.textContent = `❌ ${data.message}`;
            watchAdBtn.disabled = false;
        }
        
    } catch (error) {
        console.error('Ad error:', error);
        adStatus.textContent = '❌ Ad failed to load';
        watchAdBtn.disabled = false;
    }
}

function copyReferralLink() {
    const referralInput = document.getElementById('referralLink');
    referralInput.select();
    document.execCommand('copy');
    
    // Show feedback
    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = '✅ Copied!';
    setTimeout(() => {
        btn.textContent = originalText;
    }, 2000);
}

async function joinChannel() {
    // Open Telegram channel
    window.open('https://t.me/your_channel', '_blank');
    
    // Mark task as completed (you can add verification logic)
    const response = await fetch('api/tasks.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user_id: currentUser.id,
            task_type: 'join_channel',
            reward: 0.05
        })
    });
    
    const data = await response.json();
    if (data.success) {
        userStats.balance += 0.05;
        updateStatsDisplay();
        alert('✅ Task completed! Earned 0.05 MATIC');
    }
}

function shareBot() {
    const shareText = `🤖 Join this amazing Telegram bot and start earning MATIC! 💰\n\n${document.getElementById('referralLink').value}`;
    
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(shareText)}`);
    } else {
        // Fallback for web
        navigator.clipboard.writeText(shareText);
        alert('📋 Share text copied to clipboard!');
    }
}

async function requestWithdraw() {
    const binanceId = document.getElementById('binanceId').value;
    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    
    if (!binanceId) {
        alert('❌ Please enter your Binance ID');
        return;
    }
    
    if (!amount || amount < 1) {
        alert('❌ Minimum withdrawal amount is 1.0 MATIC');
        return;
    }
    
    if (amount > userStats.balance) {
        alert('❌ Insufficient balance');
        return;
    }
    
    try {
        const response = await fetch('api/withdrawal.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: currentUser.id,
                binance_id: binanceId,
                amount: amount
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            userStats.balance -= amount;
            updateStatsDisplay();
            alert('✅ Withdrawal request submitted! Processing time: 24-48 hours');
            document.getElementById('binanceId').value = '';
            document.getElementById('withdrawAmount').value = '';
        } else {
            alert(`❌ ${data.message}`);
        }
        
    } catch (error) {
        console.error('Withdrawal error:', error);
        alert('❌ Error submitting withdrawal request');
    }
}

// Load configuration on page load
async function loadConfig() {
    try {
        const response = await fetch('api/config.php');
        const config = await response.json();
        
        document.getElementById('adReward').textContent = config.ad_reward || '0.01';
        document.getElementById('adCooldown').textContent = config.ad_cooldown_minutes || '60';
        
    } catch (error) {
        console.error('Error loading config:', error);
    }
}

// Load config when page loads
loadConfig();
