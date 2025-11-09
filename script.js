// ==============================
// KONFIGURASI USER LOGIN
// ==============================
const users = {
  "mpiadmin@gmail.com": { password: "AdminMPIB2025", role: "admin" },
  "mpiuser@gmail.com": { password: "UserMPIB2025", role: "user" },
};

let currentUser = JSON.parse(localStorage.getItem("loggedUser"));

document.addEventListener("DOMContentLoaded", () => {
  const loginSection = document.getElementById("loginSection");
  const mainSection = document.getElementById("mainSection");
  const loginForm = document.getElementById("loginForm");
  const uploadSection = document.getElementById("uploadSection");

  if (currentUser) {
    loginSection.style.display = "none";
    mainSection.style.display = "block";
    if (currentUser.role !== "admin") uploadSection.style.display = "none";
  }

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value.trim();
      if (users[email] && users[email].password === password) {
        currentUser = { email, role: users[email].role };
        localStorage.setItem("loggedUser", JSON.stringify(currentUser));
        alert("✅ Login berhasil!");
        loginSection.style.display = "none";
        mainSection.style.display = "block";
        if (currentUser.role !== "admin") uploadSection.style.display = "none";
      } else alert("❌ Email atau password salah!");
    });
  }

  updateNavbarStatus();
  tampilkanUserDiNavbar();
  setupMobileMenu();
  startAutoLogout();
});

function updateNavbarStatus() {
  const loginDesktop = document.getElementById("login-btn-desktop");
  const logoutDesktop = document.getElementById("logout-btn-desktop");
  const loginMobile = document.getElementById("login-btn-mobile");
  const logoutMobile = document.getElementById("logout-btn-mobile");

  if (currentUser) {
    if (loginDesktop) loginDesktop.style.display = "none";
    if (logoutDesktop) logoutDesktop.style.display = "inline-block";
    if (loginMobile) loginMobile.style.display = "none";
    if (logoutMobile) logoutMobile.style.display = "inline-block";

    if (logoutDesktop) logoutDesktop.onclick = logout;
    if (logoutMobile) logoutMobile.onclick = logout;
  } else {
    if (loginDesktop) loginDesktop.style.display = "inline-block";
    if (logoutDesktop) logoutDesktop.style.display = "none";
    if (loginMobile) loginMobile.style.display = "inline-block";
    if (logoutMobile) logoutMobile.style.display = "none";
  }
}

function logout() {
  localStorage.removeItem("loggedUser");
  alert("Anda telah logout.");
  window.location.reload();
}

function tampilkanUserDiNavbar() {
  const navbar = document.querySelector(".nav-container");
  if (currentUser && navbar) {
    const userDiv = document.createElement("div");
    userDiv.classList.add("user-info");
    userDiv.innerHTML = `<span><i class="fa fa-user"></i> ${currentUser.email} (${currentUser.role})</span>`;
    navbar.prepend(userDiv);
  }
}

function setupMobileMenu() {
  const menuToggle = document.getElementById("menuToggle");
  const mobileNav = document.getElementById("mobileNav");
  if (!menuToggle || !mobileNav) return;

  menuToggle.addEventListener("click", () => {
    mobileNav.classList.toggle("active");
  });

  document.addEventListener("click", (e) => {
    if (!mobileNav.contains(e.target) && !menuToggle.contains(e.target)) {
      mobileNav.classList.remove("active");
    }
  });
}

function startAutoLogout() {
  let waktuKunjungan = 20 * 60;
  const hitungMundur = setInterval(() => {
    waktuKunjungan--;
    if (waktuKunjungan <= 0) {
      clearInterval(hitungMundur);
      alert("⏰ Waktu habis, logout otomatis!");
      logout();
    }
  }, 1000);

  ["mousemove", "keydown", "click", "scroll"].forEach((evt) => {
    document.addEventListener(evt, () => (waktuKunjungan = 20 * 60));
  });
}
