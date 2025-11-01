// ==============================
// KONFIGURASI USER LOGIN
// ==============================
const users = {
  "mpiadmin@gmail.com": { password: "AdminMPIB2025", role: "admin" },
  "mpiuser@gmail.com": { password: "UserMPIB2025", role: "user" },
};

// ==============================
// FUNGSI LOGIN & LOGOUT
// ==============================
function isLoggedIn() {
  return localStorage.getItem("loggedIn") === "true";
}

function getUserEmail() {
  return localStorage.getItem("userEmail");
}

function getUserRole() {
  return localStorage.getItem("userRole");
}

function logout() {
  localStorage.removeItem("loggedIn");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userRole");
  window.location.href = "login.html";
}

// ==============================
// VALIDASI LOGIN
// ==============================
function validateLogin(event) {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (users[email] && users[email].password === password) {
    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("userEmail", email);
    localStorage.setItem("userRole", users[email].role);

    alert("✅ Login berhasil!");
    window.location.href = "index.html";
  } else {
    alert("❌ Email atau password salah!");
  }
}

// ==============================
// STATUS LOGIN + NAVBAR
// ==============================
document.addEventListener("DOMContentLoaded", function () {
  const loginLink = document.querySelector('a[href="login.html"]');
  const navbar = document.querySelector("nav ul");

  // buat tombol logout dinamis
  let logoutItem = document.getElementById("logout-btn");
  if (!logoutItem) {
    logoutItem = document.createElement("li");
    logoutItem.id = "logout-btn";
    logoutItem.innerHTML = `<a href="#" onclick="logout()">Logout</a>`;
    logoutItem.style.display = "none";
    if (navbar) navbar.appendChild(logoutItem);
  }

  // tampilkan / sembunyikan tombol login & logout
  if (isLoggedIn()) {
    if (loginLink) loginLink.style.display = "none";
    logoutItem.style.display = "inline-block";
  } else {
    if (loginLink) loginLink.style.display = "inline-block";
    logoutItem.style.display = "none";
  }
});

// ==============================
// KONFIGURASI SUPABASE
// ==============================
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = "https://urwbdfnzygigtifnuuwq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyd2JkZm56eWdpZ3RpZm51dXdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MTM1NzYsImV4cCI6MjA3NzQ4OTU3Nn0.AVvB1OPHCuKR_DkkgUpl2VXcjM7Khtv-_TKxzjkyxrU";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==============================
// LOAD DATA MAKALAH
// ==============================
async function loadMakalahTable() {
  const tableBody = document.getElementById("makalahTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = "<tr><td colspan='4'>Memuat data...</td></tr>";

  const { data: files, error } = await supabase.storage.from("MAKALAH_DAN_PPT").list();

  if (error) {
    console.error("Gagal load makalah:", error);
    tableBody.innerHTML = `<tr><td colspan='4'>❌ Gagal memuat data makalah!</td></tr>`;
    return;
  }

  tableBody.innerHTML = "";
  const role = getUserRole();

  if (!files || files.length === 0) {
    tableBody.innerHTML = "<tr><td colspan='4'>Belum ada makalah diunggah.</td></tr>";
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
// HAPUS MAKALAH (ADMIN)
// ==============================
async function hapusMakalah(fileName) {
  const role = getUserRole();
  if (role !== "admin") {
    alert("❌ Anda tidak memiliki izin untuk menghapus!");
    return;
  }

  if (confirm(`Yakin ingin menghapus file "${fileName}" ?`)) {
    const { error } = await supabase.storage.from("MAKALAH_DAN_PPT").remove([fileName]);
    if (error) {
      alert("❌ Gagal menghapus file!");
      console.error("Error hapus:", error);
      return;
    }
    alert("✅ File berhasil dihapus!");
    loadMakalahTable();
  }
}

// ==============================
// AUTO LOGOUT 20 MENIT
// ==============================
let waktuKunjungan = 20 * 60;

function mulaiTimerKunjungan() {
  const hitungMundur = setInterval(() => {
    waktuKunjungan--;
    if (waktuKunjungan <= 0) {
      clearInterval(hitungMundur);
      alert("Waktu kunjungan Anda (20 menit) telah berakhir. Anda akan logout otomatis.");
      logout();
    }
  }, 1000);
}

document.addEventListener("DOMContentLoaded", function () {
  if (isLoggedIn()) {
    mulaiTimerKunjungan();
    ["mousemove", "keydown", "click", "scroll"].forEach(evt =>
      document.addEventListener(evt, () => waktuKunjungan = 20 * 60)
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
    menuToggle.addEventListener("click", function () {
      mobileNav.classList.toggle("active");
    });
  }
});
