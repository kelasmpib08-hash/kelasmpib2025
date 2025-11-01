// ==============================
// KONFIGURASI USER LOGIN
// ==============================
const users = {
  "mpiadmin@gmail.com": { password: "AdminMPIB2025", role: "admin" },
  "mpiuser@gmail.com": { password: "UserMPIB2025", role: "user" },
};

// ==============================
// CEK LOGIN SAAT HALAMAN DIBUKA
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const userInfoMobile = document.getElementById("user-info-mobile");
  const page = window.location.pathname.split("/").pop();

  const currentUser = JSON.parse(localStorage.getItem("loggedUser"));

  // Kalau bukan di halaman login, tapi user belum login → paksa login
  if (!currentUser && page !== "login.html") {
    window.location.href = "login.html";
    return;
  }

  // Kalau user sudah login & bukan di login.html → tampilkan user info
  if (currentUser && userInfoMobile) {
    showLogoutButton(currentUser, userInfoMobile);
  }

  // Kalau di halaman login, dan user sudah login → arahkan ke beranda
  if (page === "login.html" && currentUser) {
    window.location.href = "index.html";
  }

  // Kalau ada form login
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();

      if (users[email] && users[email].password === password) {
        localStorage.setItem(
          "loggedUser",
          JSON.stringify({ email, role: users[email].role })
        );
        alert("Login berhasil!");
        window.location.href = "index.html";
      } else {
        alert("Email atau password salah!");
      }
    });
  }
});

// ==============================
// TAMPILKAN USER & LOGOUT BUTTON
// ==============================
function showLogoutButton(user, container) {
  container.innerHTML = `
    <div class="user-info-box">
      <span class="user-email">${user.email}</span>
      <button id="logout-btn" class="cta-button">Logout</button>
    </div>
  `;

  document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.removeItem("loggedUser");
    window.location.href = "login.html";
  });
}


// ==============================
// KONFIGURASI SUPABASE
// ==============================
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://urwbdfnzygigtifnuuwq.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyd2JkZm56eWdpZ3RpZm51dXdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MTM1NzYsImV4cCI6MjA3NzQ4OTU3Nn0.AVvB1OPHCuKR_DkkgUpl2VXcjM7Khtv-_TKxzjkyxrU";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==============================
// LOAD DATA MAKALAH
// ==============================
async function loadMakalahTable() {
  const tableBody = document.getElementById("makalahTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = "<tr><td colspan='4'>Memuat data...</td></tr>";

  const { data: files, error } = await supabase.storage
    .from("MAKALAH_DAN_PPT")
    .list();

  if (error) {
    tableBody.innerHTML =
      "<tr><td colspan='4'>❌ Gagal memuat data makalah!</td></tr>";
    console.error("Gagal load makalah:", error);
    return;
  }

  tableBody.innerHTML = "";
  const role = getUserRole();

  if (!files || files.length === 0) {
    tableBody.innerHTML =
      "<tr><td colspan='4'>Belum ada makalah diunggah.</td></tr>";
    return;
  }

  files.forEach((file) => {
    const fileUrl = `${SUPABASE_URL}/storage/v1/object/public/MAKALAH_DAN_PPT/${file.name}`;
    const row = document.createElement("tr");

    let actionButtons = `
      <button class="lihat-btn" onclick="window.open('${fileUrl}', '_blank')">Lihat</button>
      <a href="${fileUrl}" download class="download-btn">Download</a>
    `;

    if (role === "admin") {
      actionButtons += `
        <button class="hapus-btn" onclick="hapusMakalah('${file.name}')">Hapus</button>
      `;
    }

    row.innerHTML = `
      <td>${file.name}</td>
      <td>${new Date(file.created_at || Date.now()).toLocaleDateString()}</td>
      <td>${file.metadata?.size ? (file.metadata.size / 1024 / 1024).toFixed(2) + " MB" : "-"}</td>
      <td>${actionButtons}</td>
    `;
    tableBody.appendChild(row);
  });
}

// ==============================
// HAPUS MAKALAH (ADMIN ONLY)
// ==============================
window.hapusMakalah = async function (fileName) {
  const role = getUserRole();
  if (role !== "admin") {
    alert("❌ Anda tidak memiliki izin untuk menghapus!");
    return;
  }

  if (confirm(`Yakin ingin menghapus file "${fileName}" ?`)) {
    const { error } = await supabase.storage
      .from("MAKALAH_DAN_PPT")
      .remove([fileName]);
    if (error) {
      alert("❌ Gagal menghapus file!");
      console.error("Error hapus:", error);
      return;
    }
    alert("✅ File berhasil dihapus!");
    loadMakalahTable();
  }
};

// ==============================
// STATUS LOGIN + NAVBAR
// ==============================
document.addEventListener("DOMContentLoaded", function () {
  const userInfo = document.getElementById("user-info");
  const userInfoMobile = document.getElementById("user-info-mobile");
  const loginDesktop = document.getElementById("login-btn-desktop");
  const logoutDesktop = document.getElementById("logout-btn-desktop");
  const loginMobile = document.getElementById("login-btn-mobile");
  const logoutMobile = document.getElementById("logout-btn-mobile");
  const uploadSection = document.querySelector(".upload-section");

  const page = window.location.pathname.split("/").pop();

  if (isLoggedIn()) {
    const email = getUserEmail();
    const role = getUserRole();

    if (userInfo)
      userInfo.innerHTML = `<i class="fa fa-user"></i> ${email} (${role})`;
    if (userInfoMobile)
      userInfoMobile.innerHTML = `<i class="fa fa-user"></i> ${email} (${role})`;

    if (loginDesktop) loginDesktop.style.display = "none";
    if (logoutDesktop) logoutDesktop.style.display = "inline-block";
    if (loginMobile) loginMobile.style.display = "none";
    if (logoutMobile) logoutMobile.style.display = "inline-block";

    if (page === "makalah.html") loadMakalahTable();

    if (uploadSection && role !== "admin") uploadSection.style.display = "none";
  } else {
    if (page !== "login.html") window.location.href = "login.html";

    if (userInfo) userInfo.textContent = "";
    if (userInfoMobile) userInfoMobile.textContent = "";
    if (loginDesktop) loginDesktop.style.display = "inline-block";
    if (logoutDesktop) logoutDesktop.style.display = "none";
    if (loginMobile) loginMobile.style.display = "inline-block";
    if (logoutMobile) logoutMobile.style.display = "none";
  }

  if (logoutDesktop) logoutDesktop.addEventListener("click", logout);
  if (logoutMobile) logoutMobile.addEventListener("click", logout);
});

// ==============================
// AUTO LOGOUT 20 MENIT
// ==============================
let waktuKunjungan = 20 * 60;
function mulaiTimerKunjungan() {
  const hitungMundur = setInterval(() => {
    waktuKunjungan--;
    if (waktuKunjungan <= 0) {
      clearInterval(hitungMundur);
      alert("Waktu 20 menit habis, Anda akan logout otomatis.");
      logout();
    }
  }, 1000);
}
document.addEventListener("DOMContentLoaded", function () {
  if (isLoggedIn()) {
    mulaiTimerKunjungan();
    ["mousemove", "keydown", "click", "scroll"].forEach((evt) =>
      document.addEventListener(evt, () => (waktuKunjungan = 20 * 60))
    );
  }
});

// ==============================
// MOBILE NAV TOGGLE
// ==============================
document.addEventListener("DOMContentLoaded", function () {
  const menuToggle = document.getElementById("menuToggle");
  const mobileNav = document.getElementById("mobileNav");
  if (menuToggle && mobileNav) {
    menuToggle.addEventListener("click", () =>
      mobileNav.classList.toggle("active")
    );
  }
});

