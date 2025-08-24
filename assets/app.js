const API_BASE = "/api";
let tg, user, telegram_id;

function qs(sel){ return document.querySelector(sel); }
function qsa(sel){ return [...document.querySelectorAll(sel)]; }

async function api(path, method="GET", body=null) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : null,
    credentials: "include",
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || res.statusText);
  }
  return res.json();
}

function switchTab(name) {
  qsa(".tab").forEach(el => el.classList.remove("active"));
  qsa(".tab-btn").forEach(el => el.classList.remove("active"));
  qs(`#${name}`).classList.add("active");
  qsa(".tab-btn").find(b => b.dataset.tab === name)?.classList.add("active");
}

async function bootstrap() {
  tg = window.Telegram.WebApp;
  tg.expand();

  user = tg.initDataUnsafe?.user;
  if (!user) {
    document.body.innerHTML = "<p style='padding:20px'>No Telegram user info. Open from Telegram.</p>";
    return;
  }
  telegram_id = user.id;

  const userData = {
    id: user.id,
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    username: user.username || "",
    language_code: user.language_code || "",
    photo_url: user.photo_url || "",
    referral_code: null
  };

  // Send data to bot for auto-login message
  tg.sendData(JSON.stringify(userData));

  // Mirror on-page
  qs("#avatar").src = user.photo_url || "https://via.placeholder.com/100";
  qs("#fullName").textContent = `${user.first_name || ""} ${user.last_name || ""}`.trim();
  qs("#username").textContent = user.username ? `@${user.username}` : "";
  qs("#userId").textContent = `User ID: ${user.id}`;
  qs("#lang").textContent = `Language: ${user.language_code || "-"}`;

  // Create or update user in backend
  const created = await api("/users/check-or-create", "POST", userData);
  qs("#balance").textContent = created.balance.toFixed(4);

  // Load earn summary
  await refreshSummary();

  // Tabs
  qsa(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });
  switchTab("dashboard");

  // Daily check-in
  qs("#checkinBtn").addEventListener("click", async () => {
    try {
      const r = await api(`/earn/checkin/${telegram_id}`, "POST");
      await refreshSummary();
      tg.showPopup({ title: "Daily Check-in", message: `+${r.reward.toFixed(2)} POLYGON`, buttons:[{type: "ok"}] });
    } catch (e) {
      tg.showAlert("Already checked in today");
    }
  });

  // Watch ad
  qs("#watchAdBtn").addEventListener("click", async () => {
    const statusEl = qs("#adStatus");
    statusEl.textContent = "Loading ad...";
    try {
      if (window.showGiga && typeof window.showGiga === "function") {
        await window.showGiga(); // show Gigapub ad
      } else {
        // fallback if the ad lib is blocked/unavailable
        await new Promise(res => setTimeout(res, 1500));
      }
      // mark as watched and reward
      const r = await api(`/earn/ad-watched/${telegram_id}`, "POST");
      await refreshSummary();
      statusEl.textContent = `Ad watched! +${r.reward.toFixed(2)} POLYGON`;
    } catch (e) {
      statusEl.textContent = "Ad failed or daily limit reached.";
    }
  });

  // Withdraw
  qs("#withdrawBtn").addEventListener("click", async () => {
    const binanceId = qs("#binanceId").value.trim();
    const amount = parseFloat(qs("#amount").value);
    const info = qs("#withdrawInfo");
    if (!binanceId || !(amount > 0)) {
      info.textContent = "Enter Binance ID and valid amount.";
      return;
    }
    try {
      const r = await api(`/earn/withdraw/${telegram_id}`, "POST", { binance_id: binanceId, amount });
      if (r.ok) {
        info.textContent = "Withdrawal request submitted.";
        await refreshSummary();
      } else {
        info.textContent = r.error || "Request failed.";
      }
    } catch (e) {
      info.textContent = "Error submitting request.";
    }
  });
}

async function refreshSummary() {
  const s = await api(`/earn/summary/${telegram_id}`);
  qs("#adsToday").textContent = s.today_ads;
  qs("#adsLimit").textContent = s.ads_limit;
  qs("#totalAds").textContent = s.totalAdsWatched;
  // refresh balance
  const created = await api("/users/check-or-create", "POST", {
    id: telegram_id,
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    username: user.username || "",
    language_code: user.language_code || "",
    photo_url: user.photo_url || "",
    referral_code: null
  });
  qs("#balance").textContent = created.balance.toFixed(4);
}

window.onload = bootstrap;
