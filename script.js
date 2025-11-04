// ==============================
// KONFIGURASI USER LOGIN
// ==============================
const users = {
  "mpiadmin@gmail.com": { password: "AdminMPIB2025", role: "admin" },
  "mpiuser@gmail.com": { password: "UserMPIB2025", role: "user" },
};

// ==============================
// SUPABASE CONFIG
// ==============================
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://urwbdfnzygigtifnuuwq.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyd2JkZm56eWdpZ3RpZm51dXdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MTM1NzYsImV4cCI6MjA3NzQ4OTU3Nn0.AVvB1OPHCuKR_DkkgUpl2VXcjM7Khtv-_TKxzjkyxrU";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==============================
// CEK LOGIN SAAT HALAMAN DIBUKA
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  const page = window.location.pathname.split("/").pop();
  const loginForm = document.getElementById("loginForm");
  const currentUser = JSON.parse(localStorage.getItem("loggedUser"));

  if (!currentUser && page !== "login.html") {
    window.location.href = "login.html";
    return;
  }

  if (currentUser && page === "login.html") {
    window.location.href = "index.html";
    return;
  }

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
        alert("✅ Login berhasil!");
        window.location.href = "index.html";
      } else {
        alert("❌ Email atau password salah!");
      }
    });
  }

  updateNavbarStatus();
  tampilkanUserDiNavbar();
});

// ==============================
// UPDATE STATUS NAVBAR LOGIN/LOGOUT
// ==============================
function updateNavbarStatus() {
  const currentUser = JSON.parse(localStorage.getItem("loggedUser"));
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

// ==============================
// LOGOUT FUNGSI
// ==============================
function logout() {
  localStorage.removeItem("loggedUser");
  alert("Anda telah logout.");
  window.location.href = "login.html";
}

// ==============================
// GET INFO USER
// ==============================
function getUser() {
  return JSON.parse(localStorage.getItem("loggedUser"));
}
function getUserRole() {
  const user = getUser();
  return user ? user.role : null;
}
function isLoggedIn() {
  return !!localStorage.getItem("loggedUser");
}

// ==============================
// TAMPILKAN EMAIL + ROLE DI NAVBAR KIRI
// ==============================
function tampilkanUserDiNavbar() {
  const userInfoContainer = document.createElement("div");
  userInfoContainer.classList.add("user-info");

  const navbar = document.querySelector(".nav-container");
  const currentUser = getUser();

  if (currentUser && navbar) {
    userInfoContainer.innerHTML = `
      <span><i class="fa fa-user"></i> ${currentUser.email} (${currentUser.role})</span>
    `;
    navbar.prepend(userInfoContainer);
  }
}

// ==============================
// LOAD DATA MAKALAH DARI SUPABASE
// ==============================
async function loadMakalahTable() {
  const tableBody = document.getElementById("makalahTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = "<tr><td colspan='4'>Memuat data...</td></tr>";

  const { data: files, error } = await supabase.storage
    .from("MAKALAH_DAN_PPT")
    .list();

  if (error) {
    console.error("Gagal load makalah:", error);
    tableBody.innerHTML = "<tr><td colspan='4'>❌ Gagal memuat data makalah!</td></tr>";
    return;
  }

  if (!files || files.length === 0) {
    tableBody.innerHTML = "<tr><td colspan='4'>Belum ada makalah diunggah.</td></tr>";
    return;
  }

  const role = getUserRole();
  tableBody.innerHTML = "";

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
// HAPUS MAKALAH (ADMIN SAJA)
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
// AUTO LOGOUT (20 MENIT)
// ==============================
let waktuKunjungan = 20 * 60;
function mulaiTimerKunjungan() {
  const hitungMundur = setInterval(() => {
    waktuKunjungan--;
    if (waktuKunjungan <= 0) {
      clearInterval(hitungMundur);
      alert("⏰ Waktu 20 menit habis, Anda akan logout otomatis.");
      logout();
    }
  }, 1000);
}
document.addEventListener("DOMContentLoaded", () => {
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
document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.getElementById("menuToggle");
  const mobileNav = document.getElementById("mobileNav");

  if (menuToggle && mobileNav) {
    menuToggle.addEventListener("click", () => {
      mobileNav.classList.toggle("active");
    });

    // Tutup menu mobile jika user klik di luar menu
    document.addEventListener("click", (e) => {
      if (!mobileNav.contains(e.target) && !menuToggle.contains(e.target)) {
        mobileNav.classList.remove("active");
      }
    });
  }
});



