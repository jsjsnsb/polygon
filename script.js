// Telegram WebApp
let tg = window.Telegram.WebApp;
tg.ready();

// Global state
let userCoins = 0;
let adsWatchedToday = 0;
let hasCheckedInToday = false;

// DOM elements
const coinAmountEl = document.getElementById('coinAmount');
const adsWatchedEl = document.getElementById('adsWatched');
const adsRemainingEl = document.getElementById('adsRemaining');
const watchAdBtn = document.getElementById('watchAdBtn');
const checkInBtn = document.getElementById('checkInBtn');
const inviteBtn = document.getElementById('inviteBtn');
const withdrawBtn = document.getElementById('withdrawBtn');
const statsBtn = document.getElementById('statsBtn');
const loadingEl = document.getElementById('loading');
const mainContentEl = document.getElementById('mainContent');
const messageContainer = document.getElementById('messageContainer');

// Utility
function showLoading() { loadingEl.classList.add('show'); mainContentEl.style.display = 'none'; }
function hideLoading() { loadingEl.classList.remove('show'); mainContentEl.style.display = 'block'; }

function showMessage(text, type='success') {
    const msg = document.createElement('div');
    msg.className = `message ${type}`;
    msg.textContent = text;
    messageContainer.appendChild(msg);
    setTimeout(() => msg.remove(), 5000);
}

function updateUI() {
    coinAmountEl.textContent = userCoins;
    adsWatchedEl.textContent = adsWatchedToday;
    adsRemainingEl.textContent = Math.max(0, 30 - adsWatchedToday);
    
    watchAdBtn.disabled = adsWatchedToday >= 30;
    watchAdBtn.innerHTML = adsWatchedToday >= 30 ? '<span class="icon">⏰</span>Daily Limit Reached' : '<span class="icon">📺</span>Watch Ad & Earn Coins';
    
    checkInBtn.disabled = hasCheckedInToday;
    checkInBtn.innerHTML = hasCheckedInToday ? '<span class="icon">✅</span>Checked In' : '<span class="icon">✅</span>Daily Check-in';
}

// Referral
function getReferralId() { return new URLSearchParams(window.location.search).get('ref'); }

// Initialize user
function initializeUser() {
    showLoading();
    const user = tg.initDataUnsafe?.user;
    if(!user){ showMessage('Failed to get user data', 'error'); hideLoading(); return; }
    const referralId = getReferralId();
    const userData = { id:user.id, first_name:user.first_name||'', last_name:user.last_name||'', username:user.username||'', lang:user.language_code||'en', photo:user.photo_url||'', referral_id: referralId?parseInt(referralId):null };
    tg.sendData(JSON.stringify(userData));

    setTimeout(() => {
        userCoins = Math.floor(Math.random()*100);
        adsWatchedToday = Math.floor(Math.random()*15);
        hasCheckedInToday = Math.random()>0.5;
        updateUI();
        hideLoading();
        showMessage(referralId ? '🎉 Referred by a friend! Bonus awarded!' : 'Welcome! You\'re logged in successfully! 🎉');
    }, 2000);
}

// Watch Ad
async function watchAd() {
    if(adsWatchedToday>=30){ showMessage('Daily limit reached!', 'error'); return; }
    try {
        watchAdBtn.disabled = true;
        watchAdBtn.innerHTML = '<span class="icon">⏳</span>Loading Ad...';
        await window.showGiga();
        userCoins++; adsWatchedToday++;
        updateUI();
        showMessage('🎉 You earned 1 coin!');
        tg.sendData(JSON.stringify({type:'ad_watched', coins_earned:1, total_ads:adsWatchedToday}));
    } catch(e) { console.error(e); showMessage('Ad failed to load.', 'error'); }
    finally { updateUI(); }
}

// Daily Check-in
function dailyCheckIn() {
    if(hasCheckedInToday){ showMessage('Already checked in!', 'error'); return; }
    userCoins += 3; hasCheckedInToday = true;
    updateUI();
    showMessage('✅ Daily check-in successful!');
    tg.sendData(JSON.stringify({type:'daily_checkin', coins_earned:3}));
}

// Invite Friends
function inviteFriends() {
    const user = tg.initDataUnsafe?.user;
    if(!user){ showMessage('User data not available', 'error'); return; }
    const botUsername = 'YOUR_BOT_USERNAME';
    const referralLink = `https://t.me/${botUsername}?start=${user.id}`;
    const shareText = `🎉 Join me!\n💰 Earn coins\n👥 Referral bonus!\n${referralLink}`;
    tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`);
}

// Stats
function showStats() {
    const mockReferrals = Math.floor(Math.random()*10);
    const mockBonus = Math.floor(Math.random()*50);
    showMessage(`📊 Stats:\n💰 Coins: ${userCoins}\n📺 Ads: ${adsWatchedToday}\n👥 Referred: ${mockReferrals}\n🎁 Bonus: ${mockBonus}`);
}

// Withdraw
function initiateWithdraw() {
    if(userCoins<10){ showMessage('Minimum withdrawal: 10 coins!', 'error'); return; }
    const binanceId = prompt('Enter Binance ID:'), amount = prompt('Enter amount:');
    if(!binanceId||!amount){ showMessage('Withdrawal cancelled', 'error'); return; }
    const num = parseInt(amount);
    if(isNaN(num)||num<=0){ showMessage('Invalid amount!', 'error'); return; }
    if(num>userCoins){ showMessage('Insufficient coins!', 'error'); return; }
    tg.sendData(JSON.stringify({type:'withdrawal_request', binance_id:binanceId, amount:num}));
    showMessage(`✅ Withdrawal request for ${num} coins submitted!`);
}

// Event listeners
watchAdBtn.addEventListener('click', watchAd);
checkInBtn.addEventListener('click', dailyCheckIn);
inviteBtn.addEventListener('click', inviteFriends);
withdrawBtn.addEventListener('click', initiateWithdraw);
statsBtn.addEventListener('click', showStats);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    tg.setHeaderColor('#667eea'); tg.setBackgroundColor('#667eea'); tg.expand();
    initializeUser();
});

// Refresh on visibility change
document.addEventListener('visibilitychange', () => { if(!document.hidden) updateUI(); });
