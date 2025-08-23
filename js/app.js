// Telegram WebApp initialization
let tg = window.Telegram.WebApp;
let user = null;
let userBalance = 0;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    try {
        // Initialize Telegram WebApp
        tg.ready();
        tg.expand();
        
        // Get user data
        user = tg.initDataUnsafe?.user;
        
        if (!user) {
            showToast('Please open this app from Telegram bot', 'error');
            return;
        }

        // Show loading
        document.getElementById('loading').classList.remove('hidden');
        
        // Check or create user
        await checkOrCreateUser();
        
        // Load user data
        await loadUserData();
        
        // Initialize UI
        initializeUI();
        
        // Hide loading and show app
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        
    } catch (error) {
        console.error('Initialization error:', error);
        showToast('Failed to initialize app', 'error');
    }
}

async function checkOrCreateUser() {
    try {
        const userData = {
            id: user.id,
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            username: user.username || '',
            language_code: user.language_code || 'en',
            photo_url: user.photo_url || '',
            referral_code: null
        };

        // Send data to bot
        tg.sendData(JSON.stringify(userData));
        
        // Also send to backend API
        const response = await fetch('/api/user/check-or-create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            throw new Error('Failed to check or create user');
        }

        const data = await response.json();
        return data;
        
    } catch (error) {
        console.error('Error checking/creating user:', error);
        throw error;
    }
}

async function loadUserData() {
    try {
        const response = await API.getUserData(user.id);
        
        if (response.success) {
            updateUserUI(response.user);
            userBalance = response.user.balance;
        } else {
            throw new Error('Failed to load user data');
        }
        
    } catch (error) {
        console.error('Error loading user data:', error);
        showToast('Failed to load user data', 'error');
    }
}

function updateUserUI(userData) {
    // Update header
    document.getElementById('userPhoto').src = userData.photo_url || 'https://via.placeholder.com/100';
    document.getElementById('userName').textContent = `${userData.first_name} ${userData.last_name}`;
    document.getElementById('userBalance').textContent = `${userData.balance.toFixed(4)} POLYGON`;
    document.getElementById('mainBalance').textContent = userData.balance.toFixed(4);
    
    // Update dashboard stats
    document.getElementById('todayEarning').textContent = userData.today_earning.toFixed(4);
    document.getElementById('lifetimeEarning').textContent = userData.lifetime_earning.toFixed(4);
    document.getElementById('referralCount').textContent = userData.referral_count || 0;
    document.getElementById('adsWatched').textContent = `${userData.ads_watched_today}/${userData.ads_limit}`;
    
    // Update earn tab
    document.getElementById('adsProgress').textContent = `${userData.ads_watched_today}/${userData.ads_limit} ads today`;
    
    // Update referral tab
    document.getElementById('totalReferrals').textContent = userData.referral_count || 0;
    document.getElementById('referralEarnings').textContent = (userData.referral_earnings || 0).toFixed(4);
    
    // Update withdraw tab
    document.getElementById('availableBalance').textContent = userData.balance.toFixed(4);
    
    // Update checkin button
    updateCheckinButton(userData.last_checkin);
    
    // Update ads button
    updateAdsButton(userData.ads_watched_today, userData.ads_limit);
    
    // Set referral link
    setReferralLink(userData.referral_code);
}

function initializeUI() {
    // Tab navigation
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    navButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Update navigation
            navButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Update content
            tabContents.forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(targetTab).classList.add('active');
            
            // Load tab-specific data
            loadTabData(targetTab);
        });
    });
    
    // Daily checkin button
    document.getElementById('checkinBtn').addEventListener('click', handleCheckin);
    
    // Watch ad button
    document.getElementById('watchAdBtn').addEventListener('click', handleWatchAd);
    
    // Copy referral link
    document.getElementById('copyLinkBtn').addEventListener('click', copyReferralLink);
    
    // Share referral link
    document.getElementById('shareLinkBtn').addEventListener('click', shareReferralLink);
    
    // Withdrawal form
    document.getElementById('withdrawBtn').addEventListener('click', handleWithdrawal);
    
    // Load initial tab data
    loadTabData('dashboard');
}

function loadTabData(tabName) {
    switch(tabName) {
        case 'dashboard':
            loadRecentActivity();
            break;
        case 'tasks':
            loadTasks();
            break;
        case 'withdraw':
            loadWithdrawalHistory();
            break;
    }
}

async function loadRecentActivity() {
    try {
        const response = await API.getRecentEarnings(user.id);
        const container = document.getElementById('recentEarnings');
        
        if (response.success && response.earnings.length > 0) {
            container.innerHTML = response.earnings.map(earning => `
                <div class="activity-item">
                    <div class="activity-desc">${earning.description}</div>
                    <div class="activity-amount">+${earning.amount.toFixed(4)} POLYGON</div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p style="text-align: center; color: #888;">No recent activity</p>';
        }
    } catch (error) {
        console.error('Error loading recent activity:', error);
    }
}

async function loadTasks() {
    try {
        const response = await API.getTasks(user.id);
        const container = document.getElementById('tasksList');
        
        if (response.success && response.tasks.length > 0) {
            container.innerHTML = response.tasks.map(task => `
                <div class="task-item">
                    <div class="task-info">
                        <h4>${task.title}</h4>
                        <p>${task.description}</p>
                        <div class="task-reward">+${task.reward.toFixed(4)} POLYGON</div>
                    </div>
                    <button class="earn-btn" onclick="completeTask(${task.id})">
                        ${task.completed ? 'Completed' : 'Complete'}
                    </button>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p style="text-align: center; color: #888;">No tasks available</p>';
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
    }
}

async function loadWithdrawalHistory() {
    try {
        const response = await API.getWithdrawals(user.id);
        const container = document.getElementById('withdrawalHistory');
        
        if (response.success && response.withdrawals.length > 0) {
            container.innerHTML = response.withdrawals.map(withdrawal => `
                <div class="history-item">
                    <div>
                        <div>${withdrawal.amount.toFixed(4)} POLYGON</div>
                        <div style="font-size: 12px; color: #888;">${new Date(withdrawal.created_at).toLocaleDateString()}</div>
                    </div>
                    <div class="history-status status-${withdrawal.status}">
                        ${withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p style="text-align: center; color: #888;">No withdrawal history</p>';
        }
    } catch (error) {
        console.error('Error loading withdrawal history:', error);
    }
}

async function handleCheckin() {
    const btn = document.getElementById('checkinBtn');
    const btnText = document.getElementById('checkinText');
    
    try {
        showLoadingOverlay(true);
        
        const response = await API.dailyCheckin(user.id);
        
        if (response.success) {
            showToast(`Daily check-in complete! +${response.reward.toFixed(4)} POLYGON`, 'success');
            userBalance += response.reward;
            updateBalanceDisplay();
            updateCheckinButton(new Date().toISOString());
            loadUserData(); // Refresh user data
        } else {
            showToast(response.message || 'Check-in failed', 'error');
        }
        
    } catch (error) {
        console.error('Checkin error:', error);
        showToast('Check-in failed', 'error');
    } finally {
        showLoadingOverlay(false);
    }
}

async function handleWatchAd() {
    const btn = document.getElementById('watchAdBtn');
    
    try {
        btn.disabled = true;
        btn.textContent = 'Loading Ad...';
        
        // Check ad limit
        const userData = await API.getUserData(user.id);
        if (userData.user.ads_watched_today >= userData.user.ads_limit) {
            showToast('Daily ad limit reached!', 'error');
            return;
        }
        
        // Show Gigapub ad
        const adWatched = await showGigaAd();
        
        if (adWatched) {
            // Record ad view
            const response = await API.watchAd(user.id);
            
            if (response.success) {
                showToast(`Ad watched! +${response.reward.toFixed(4)} POLYGON`, 'success');
                userBalance += response.reward;
                updateBalanceDisplay();
                loadUserData(); // Refresh user data
            } else {
                showToast('Failed to record ad view', 'error');
            }
        }
        
    } catch (error) {
        console.error('Ad watch error:', error);
        showToast('Failed to watch ad', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Watch Ad';
    }
}

async function completeTask(taskId) {
    try {
        showLoadingOverlay(true);
        
        const response = await API.completeTask(user.id, taskId);
        
        if (response.success) {
            showToast(`Task completed! +${response.reward.toFixed(4)} POLYGON`, 'success');
            userBalance += response.reward;
            updateBalanceDisplay();
            loadTasks(); // Refresh tasks
            loadUserData(); // Refresh user data
        } else {
            showToast(response.message || 'Failed to complete task', 'error');
        }
        
    } catch (error) {
        console.error('Task completion error:', error);
        showToast('Failed to complete task', 'error');
    } finally {
        showLoadingOverlay(false);
    }
}

async function handleWithdrawal() {
    const binanceId = document.getElementById('binanceId').value.trim();
    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    
    if (!binanceId) {
        showToast('Please enter your Binance ID', 'error');
        return;
    }
    
    if (!amount || amount < 0.5) {
        showToast('Minimum withdrawal amount is 0.5 POLYGON', 'error');
        return;
    }
    
    if (amount > userBalance) {
        showToast('Insufficient balance', 'error');
        return;
    }
    
    try {
        showLoadingOverlay(true);
        
        const response = await API.requestWithdrawal(user.id, amount, binanceId);
        
        if (response.success) {
            showToast('Withdrawal request submitted! Please wait for admin approval.', 'success');
            document.getElementById('binanceId').value = '';
            document.getElementById('withdrawAmount').value = '';
            loadWithdrawalHistory();
            loadUserData(); // Refresh user data
        } else {
            showToast(response.message || 'Withdrawal request failed', 'error');
        }
        
    } catch (error) {
        console.error('Withdrawal error:', error);
        showToast('Withdrawal request failed', 'error');
    } finally {
        showLoadingOverlay(false);
    }
}

function updateCheckinButton(lastCheckin) {
    const btn = document.getElementById('checkinBtn');
    const btnText = document.getElementById('checkinText');
    
    if (!lastCheckin) {
        btn.disabled = false;
        btnText.textContent = 'Check In';
        return;
    }
    
    const lastCheckinDate = new Date(lastCheckin);
    const today = new Date();
    const isToday = lastCheckinDate.toDateString() === today.toDateString();
    
    if (isToday) {
        btn.disabled = true;
        btnText.textContent = 'Already Checked In';
    } else {
        btn.disabled = false;
        btnText.textContent = 'Check In';
    }
}

function updateAdsButton(watchedToday, limit) {
    const btn = document.getElementById('watchAdBtn');
    
    if (watchedToday >= limit) {
        btn.disabled = true;
        btn.textContent = 'Daily Limit Reached';
    } else {
        btn.disabled = false;
        btn.textContent = 'Watch Ad';
    }
}

function setReferralLink(referralCode) {
    if (referralCode) {
        const botUsername = 'your_bot_username'; // Replace with actual bot username
        const referralLink = `https://t.me/${botUsername}?start=${referralCode}`;
        document.getElementById('referralLink').value = referralLink;
    }
}

function copyReferralLink() {
    const linkInput = document.getElementById('referralLink');
    linkInput.select();
    linkInput.setSelectionRange(0, 99999);
    
    try {
        document.execCommand('copy');
        showToast('Referral link copied!', 'success');
    } catch (err) {
        showToast('Failed to copy link', 'error');
    }
}

function shareReferralLink() {
    const link = document.getElementById('referralLink').value;
    const shareText = `🎉 Join me on Polygon Earning Bot and earn POLYGON daily!\n\n💰 Earn through:\n• Daily check-ins\n• Watching ads\n• Completing tasks\n• Referring friends\n\n🔗 Join now: ${link}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Join Polygon Earning Bot',
            text: shareText,
            url: link
        });
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(shareText).then(() => {
            showToast('Referral message copied to clipboard!', 'success');
        }).catch(() => {
            showToast('Failed to copy message', 'error');
        });
    }
}

function updateBalanceDisplay() {
    document.getElementById('userBalance').textContent = `${userBalance.toFixed(4)} POLYGON`;
    document.getElementById('mainBalance').textContent = userBalance.toFixed(4);
    document.getElementById('availableBalance').textContent = userBalance.toFixed(4);
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

function showLoadingOverlay(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.classList.remove('hidden');
    } else {
        overlay.classList.add('hidden');
    }
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Handle page visibility changes
document.addEventListener('visibilitychange', function() {
    if (!document.hidden && user) {
        // Refresh data when page becomes visible
        loadUserData();
    }
});

// Auto-refresh user data every 30 seconds
setInterval(() => {
    if (user && !document.hidden) {
        loadUserData();
    }
}, 30000);
