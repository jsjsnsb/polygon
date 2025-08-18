const tg = window.Telegram.WebApp;
tg.expand();

const coinsEl = document.getElementById("coins");
let coins = parseInt(coinsEl.textContent);

document.getElementById("dailyCheckinBtn").addEventListener("click", () => {
    coins += 3;
    coinsEl.textContent = coins;
    alert("✅ Daily check-in rewarded 3 BDT!");
});

document.getElementById("withdrawBtn").addEventListener("click", () => {
    const amount = prompt("Enter amount to withdraw:");
    if (amount && !isNaN(amount)) {
        if (parseInt(amount) <= coins) {
            coins -= parseInt(amount);
            coinsEl.textContent = coins;
            alert(`💰 Withdrawal request submitted: ${amount} BDT`);
        } else {
            alert("🚫 Not enough balance!");
        }
    }
});

// GigaPub Ads
document.getElementById("taskBtn").addEventListener("click", () => {
    window.showGiga()
    .then(() => {
        coins += 1; // reward coin
        coinsEl.textContent = coins;
        alert("🎉 You earned 1 coin from GigaAd!");
    })
    .catch(e => {
        alert("⚠️ Ad failed to load: " + e.message);
    });
});
