window.onload = () => {
  const tg = window.Telegram.WebApp;
  tg.expand();

  const user = tg.initDataUnsafe?.user;
  const statusEl = document.getElementById("status");
  const profileEl = document.getElementById("profile");

  if (user) {
    statusEl.classList.add("hidden");
    profileEl.classList.remove("hidden");

    document.getElementById("profile-photo").src = user.photo_url || 'https://via.placeholder.com/100';
    document.getElementById("profile-name").textContent = `${user.first_name} ${user.last_name || ''}`;
    document.getElementById("profile-username").textContent = `@${user.username}`;
    document.getElementById("profile-id").textContent = `User ID: ${user.id}`;
    document.getElementById("profile-lang").textContent = `Language: ${user.language_code}`;

    document.getElementById("watchAdBtn").onclick = () => {
      window.showGiga()
        .then(() => {
          document.getElementById("adResult").innerText = "🎉 You earned 1 coin!";
          // Optionally notify backend via fetch or telegram-web-app sendData
        })
        .catch(() => {
          document.getElementById("adResult").innerText = "Ad failed or skipped.";
        });
    };
  } else {
    statusEl.textContent = "No Telegram user info";
  }
};
