class TelegramEarningApp {
    constructor() {
        this.tg = window.Telegram.WebApp;
        this.userData = null;
        this.userStats = {
            balance: 0,
            totalEarned: 0,
            adsWatchedToday: 0,
            totalReferrals: 0,
            lastCheckin: null,
            referralCode: ''
        };
        this.init();
    }

    async init() {
        this.tg.expand();
        this.tg.MainButton.hide();
        
        await this.loadUserData();
        this.setupEventListeners();
        this.updateUI();
        
        document.getElementById('loading').style.display = 'none';
        document.getElementById('main-app').style.display = 'block';
    }

    loadUserData() {
        return new Promise((resolve) => {
            const user = this.tg.initDataUnsafe?.user;
            if (user) {
                this.userData = {
                    id: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name || '',
                    username: user.username || '',
                    lang: user.language_code || '',
                    photo: user.photo_url || 'https://via.placeholder.com/100'
                };
                
                // Send user data to bot for registration
                this.tg.sendData(JSON.stringify(this.userData));
                
                // Load user stats (in real app, this would come from backend)
                this.loadUserStats();
            }
            resolve();
        });
    }

    loadUserStats() {
        // Simulate loading user stats from backend
        // In real implementation, this would be an API call
        const savedStats = this.getLocalStats();
        this.userStats = { ...this.userStats, ...savedStats };
        this.userStats.referralCode = `REF${this.userData.id}`;
    }

    getLocalStats() {
        // Simulate backend data with local storage simulation
        const userId = this.userData?.id;
        if (!userId) return {};
        
        // In a real app, this would be fetched from your backend
        return {
            balance: Math.random() * 5,
            totalEarned: Math.random() * 10,
            adsWatchedToday: Math.floor(Math.random() * 5),
            totalReferrals: Math.floor(Math.random() * 10),
            lastCheckin: new Date().toDateString()
        };
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Check-in button
        document.getElementById('checkinBtn').addEventListener('click', () => {
            this.performCheckin();
        });

        // Watch ad button
        document.getElementById('watchAdBtn').addEventListener('click', () => {
            this.watchAd();
        });

        // Copy referral code
        document.getElementById('copyCodeBtn').addEventListener('click', () => {
            this.copyReferralCode();
        });

        // Share invitation
        document.getElementById('shareBtn').addEventListener('click', () => {
            this.shareInvitation();
        });

        // Withdrawal
        document.getElementById('withdrawBtn').addEventListener('click', () => {
            this.requestWithdrawal();
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');
    }

    updateUI() {
        if (!this.userData) return;

        // Update profile
        document.getElementById('userPhoto').src = this.userData.photo;
        document.getElementById('userName').textContent = 
            `${this.userData.first_name} ${this.userData.last_name}`.trim();
        document.getElementById('userHandle').textContent = 
            this.userData.username ? `@${this.userData.username}` : `ID: ${this.userData.id}`;

        // Update balance and stats
        document.getElementById('userBalance').textContent = 
            `${this.userStats.balance.toFixed(4)} POLYGON`;
        document.getElementById('totalEarned').textContent = 
            `${this.userStats.totalEarned.toFixed(4)} POLYGON`;
        document.getElementById('adsWatched').textContent = 
            `${this.userStats.adsWatchedToday}/10`;
        document.getElementById('totalReferrals').textContent = 
            this.userStats.totalReferrals.toString();
        document.getElementById('lastCheckin').textContent = 
            this.userStats.lastCheckin || 'Never';

        // Update referral code
        document.getElementById('referralCode').value = this.userStats.referralCode;

        // Update ad progress
        const progressPercent = (this.userStats.adsWatchedToday / 10) * 100;
        document.getElementById('adProgressFill').style.width = `${progressPercent}%`;

        // Update button states
        this.updateButtonStates();
    }

    updateButtonStates() {
        const checkinBtn = document.getElementById('checkinBtn');
        const watchAdBtn = document.getElementById('watchAdBtn');
        const withdrawBtn = document.getElementById('withdrawBtn');

        // Check-in button
        const today = new Date().toDateString();
        if (this.userStats.lastCheckin === today) {
            checkinBtn.textContent = 'Already Checked In';
            checkinBtn.disabled = true;
        }

        // Watch ad button
        if (this.userStats.adsWatchedToday >= 10) {
            watchAdBtn.textContent = 'Daily Limit Reached';
            watchAdBtn.disabled = true;
            document.getElementById('adStatus').textContent = 'Come back tomorrow!';
        }

        // Withdraw button
        if (this.userStats.balance < 1.0) {
            withdrawBtn.disabled = true;
        }
    }

    async performCheckin() {
        const checkinBtn = document.getElementById('checkinBtn');
        const originalText = checkinBtn.textContent;
        
        checkinBtn.textContent = 'Checking in...';
        checkinBtn.disabled = true;

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Update user stats
        this.userStats.balance += 0.05;
        this.userStats.totalEarned += 0.05;
        this.userStats.lastCheckin = new Date().toDateString();

        this.updateUI();
        this.showMessage('✅ Daily check-in complete! +0.05 POLYGON earned!', 'success');
    }

    async watchAd() {
        const watchAdBtn = document.getElementById('watchAdBtn');
        
        if (this.userStats.adsWatchedToday >= 10) {
            this.showMessage('❌ Daily ad limit reached!', 'error');
            return;
        }

        watchAdBtn.textContent = 'Loading ad...';
        watchAdBtn.disabled = true;

        try {
            // Show Gigapub ad
            await window.showGiga();
            
            // Reward user after successful ad view
            this.userStats.balance += 0.01;
            this.userStats.totalEarned += 0.01;
            this.userStats.adsWatchedToday += 1;
            
            this.updateUI();
            this.showMessage('✅ Ad watched! +0.01 POLYGON earned!', 'success');
            
        } catch (error) {
            console.error('Ad error:', error);
            this.showMessage('❌ Ad failed to load. Please try again.', 'error');
        } finally {
            watchAdBtn.textContent = 'Watch Ad';
            watchAdBtn.disabled = false;
            
            if (this.userStats.adsWatchedToday >= 10) {
                watchAdBtn.textContent = 'Daily Limit Reached';
                watchAdBtn.disabled = true;
            }
        }
    }

    copyReferralCode() {
        const referralInput = document.getElementById('referralCode');
        referralInput.select();
        referralInput.setSelectionRange(0, 99999);
        
        try {
            document.execCommand('copy');
            this.showMessage('✅ Referral code copied!', 'success');
        } catch (err) {
            // Fallback for newer browsers
            navigator.clipboard.writeText(referralInput.value).then(() => {
                this.showMessage('✅ Referral code copied!', 'success');
            }).catch(() => {
                this.showMessage('❌ Failed to copy code', 'error');
            });
        }
    }

    shareInvitation() {
        const botUsername = 'tgbotweb_bot'; // Replace with your bot username
        const referralCode = this.userStats.referralCode;
        const shareText = `🎁 Join me on POLYGON Earning Bot and start earning crypto!\n\nUse my referral code: ${referralCode}\n\n`;
        const shareUrl = `https://t.me/share/url?url=https://t.me/${botUsername}?start=${referralCode}&text=${encodeURIComponent(shareText)}`;
        
        window.open(shareUrl, '_blank');
    }

    async requestWithdrawal() {
        const binanceId = document.getElementById('binanceId').value.trim();
        const amount = parseFloat(document.getElementById('withdrawAmount').value);
        const withdrawBtn = document.getElementById('withdrawBtn');

        if (!binanceId) {
            this.showMessage('❌ Please enter your Binance ID', 'error');
            return;
        }

        if (!amount || amount < 1.0) {
            this.showMessage('❌ Minimum withdrawal is 1.0 POLYGON', 'error');
            return;
        }

        if (amount > this.userStats.balance) {
            this.showMessage('❌ Insufficient balance', 'error');
            return;
        }

        withdrawBtn.textContent = 'Processing...';
        withdrawBtn.disabled = true;

        // Simulate withdrawal request
        await new Promise(resolve => setTimeout(resolve, 2000));

        // In real app, send withdrawal request to backend
        const withdrawalData = {
            action: 'withdraw',
            user_id: this.userData.id,
            amount: amount,
            binance_id: binanceId
        };

        // Send withdrawal request to bot
        this.tg.sendData(JSON.stringify(withdrawalData));

        // Update local balance
        this.userStats.balance -= amount;
        this.updateUI();

        this.showMessage('✅ Withdrawal request submitted! Admin will process it soon.', 'success');
        
        // Clear form
        document.getElementById('binanceId').value = '';
        document.getElementById('withdrawAmount').value = '';
        
        withdrawBtn.textContent = 'Request Withdrawal';
        withdrawBtn.disabled = false;
    }

    showMessage(message, type = 'success') {
        // Remove existing messages
        document.querySelectorAll('.success-message, .error-message').forEach(el => el.remove());
        
        const messageEl = document.createElement('div');
        messageEl.className = `${type}-message`;
        messageEl.textContent = message;
        
        const activeTab = document.querySelector('.tab-content.active');
        activeTab.insertBefore(messageEl, activeTab.firstChild);
        
        // Auto remove message after 3 seconds
        setTimeout(() => {
            messageEl.remove();
        }, 3000);
    }
}

// Initialize app when page loads
window.addEventListener('load', () => {
    new TelegramEarningApp();
});
