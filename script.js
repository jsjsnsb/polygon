class EarningBot {
    constructor() {
        this.tg = window.Telegram.WebApp;
        this.user = null;
        this.profile = null;
        this.init();
    }

    init() {
        this.tg.expand();
        this.tg.MainButton.hide();
        
        // Get user data
        this.user = this.tg.initDataUnsafe?.user;
        
        if (!this.user) {
            document.getElementById('loading').innerHTML = '<p>❌ No Telegram user data available</p>';
            return;
        }

        this.setupEventListeners();
        this.registerUser();
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Earn actions
        document.getElementById('checkinBtn').addEventListener('click', () => {
            this.dailyCheckin();
        });

        document.getElementById('adBtn').addEventListener('click', () => {
            this.watchAd();
        });

        // Referral actions
        document.getElementById('copyBtn').addEventListener('click', () => {
            this.copyReferralCode();
        });

        document.getElementById('shareBtn').addEventListener('click', () => {
            this.shareReferralLink();
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
        document.getElementById(`${tabName}Tab`).classList.add('active');
    }

    async registerUser() {
        try {
            const userData = {
                action: 'register',
                user: {
                    id: this.user.id,
                    first_name: this.user.first_name,
                    last_name: this.user.last_name || '',
                    username: this.user.username || '',
                    language_code: this.user.language_code || '',
                    photo_url: this.user.photo_url || ''
                }
            };

            this.tg.sendData(JSON.stringify(userData));
            await this.loadProfile();
            this.showMainApp();
        } catch (error) {
            console.error('Registration failed:', error);
            document.getElementById('loading').innerHTML = '<p>❌ Registration failed</p>';
        }
    }

    async loadProfile() {
        try {
            const profileData = {
                action: 'get_profile'
            };

            // This would normally be handled by the bot response
            // For demo purposes, we'll simulate the data
            this.profile = {
                balance: 0.0000,
                total_earned: 0.0000,
                ads_today: 0,
                referral_code: `REF${this.user.id}`,
                referral_earnings: 0.0000
            };

            this.updateUI();
        } catch (error) {
            console.error('Failed to load profile:', error);
        }
    }

    showMainApp() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        
        // Update user info
        document.getElementById('userPhoto').src = this.user.photo_url || 'https://via.placeholder.com/100';
        document.getElementById('userName').textContent = `${this.user.first_name} ${this.user.last_name || ''}`;
        document.getElementById('userUsername').textContent = `@${this.user.username || 'N/A'}`;
    }

    updateUI() {
        if (!this.profile) return;

        document.getElementById('balance').textContent = this.profile.balance.toFixed(4);
        document.getElementById('totalEarned').textContent = this.profile.total_earned.toFixed(4);
        document.getElementById('adsToday').textContent = `${this.profile.ads_today}/15`;
        document.getElementById('referralCode').value = this.profile.referral_code;
        document.getElementById('referralEarnings').textContent = this.profile.referral_earnings.toFixed(4);
    }

    dailyCheckin() {
        const data = {
            action: 'checkin'
        };
        
        this.tg.sendData(JSON.stringify(data));
        
        // Disable button temporarily
        const btn = document.getElementById('checkinBtn');
        btn.style.opacity = '0.5';
        btn.style.pointerEvents = 'none';
        
        setTimeout(() => {
            btn.style.opacity = '1';
            btn.style.pointerEvents = 'auto';
        }, 3000);
    }

    async watchAd() {
        try {
            // Show Gigapub ad
            await window.showGiga();
            
            // If ad was successfully shown, send reward request
            const data = {
                action: 'watch_ad'
            };
            
            this.tg.sendData(JSON.stringify(data));
            
            // Update ads counter
            this.profile.ads_today += 1;
            this.updateUI();
            
        } catch (error) {
            console.error('Ad failed to show:', error);
            this.tg.showAlert('Failed to load ad. Please try again.');
        }
    }

    copyReferralCode() {
        const codeInput = document.getElementById('referralCode');
        codeInput.select();
        document.execCommand('copy');
        
        this.tg.showPopup({
            title: '✅ Copied!',
            message: 'Referral code copied to clipboard',
            buttons: [{type: 'ok'}]
        });
    }

    shareReferralLink() {
        const referralLink = `https://t.me/your_bot?start=${this.profile.referral_code}`;
        const shareText = `🎉 Join me on Polygon Earning Bot and start earning crypto!\n\n💰 Daily rewards, ad watching, and referral bonuses!\n\n👇 Use my link:\n${referralLink}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Polygon Earning Bot',
                text: shareText,
                url: referralLink
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(shareText).then(() => {
                this.tg.showPopup({
                    title: '✅ Copied!',
                    message: 'Referral link copied to clipboard',
                    buttons: [{type: 'ok'}]
                });
            });
        }
    }

    requestWithdrawal() {
        const amount = parseFloat(document.getElementById('withdrawAmount').value);
        const binanceId = document.getElementById('binanceId').value.trim();
        
        if (!amount || amount < 0.01) {
            this.tg.showAlert('Minimum withdrawal amount is 0.01 POLYGON');
            return;
        }
        
        if (!binanceId) {
            this.tg.showAlert('Please enter your Binance ID');
            return;
        }
        
        if (amount > this.profile.balance) {
            this.tg.showAlert('Insufficient balance');
            return;
        }
        
        this.tg.showConfirm(
            `Withdraw ${amount.toFixed(4)} POLYGON to Binance ID: ${binanceId}?`,
            (confirmed) => {
                if (confirmed) {
                    const data = {
                        action: 'withdraw',
                        amount: amount,
                        binance_id: binanceId
                    };
                    
                    this.tg.sendData(JSON.stringify(data));
                    
                    // Clear form
                    document.getElementById('withdrawAmount').value = '';
                    document.getElementById('binanceId').value = '';
                    
                    // Update balance optimistically
                    this.profile.balance -= amount;
                    this.updateUI();
                }
            }
        );
    }
}

// Initialize app when page loads
window.addEventListener('load', () => {
    new EarningBot();
});
