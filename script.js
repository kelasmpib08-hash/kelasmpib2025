// script.js (perbaikan logout/navbar + supabase + load makalah)

// ==============================
// KONFIGURASI USER LOGIN (dummy)
// ==============================
const users = {
  "mpiadmin@gmail.com": { password: "AdminMPIB2025", role: "admin" },
  "mpiuser@gmail.com": { password: "UserMPIB2025", role: "user" },
};

// ==============================
// HELPERS LOGIN / LOGOUT
// ==============================
function isLoggedIn() {
  return localStorage.getItem("loggedIn") === "true";
}
function getUserEmail() {
  return localStorage.getItem("userEmail");
}
// FIXED: baca key yang konsisten (userRole)
function getUserRole() {
  return localStorage.getItem("userRole") || "user";
}
function logout() {
  localStorage.removeItem("loggedIn");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userRole");
  // redirect ke halaman login
  window.location.href = "login.html";
}

// ==============================
// VALIDASI LOGIN (contoh dipanggil dari login.html)
// ==============================
function validateLogin(event) {
  if (event && event.preventDefault) event.preventDefault();

  const email = document.getElementById("email")?.value?.trim() || "";
  const password = document.getElementById("password")?.value?.trim() || "";

  if (users[email] && users[email].password === password) {
    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("userEmail", email);
    localStorage.setItem("userRole", users[email].role); // simpan dengan key userRole

    alert("✅ Login berhasil!");
    window.location.href = "index.html";
    return true;
  } else {
    alert("❌ Email atau password salah!");
    return false;
  }
}

// ==============================
// INIT: set visibility navbar / hook logout
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  // Navbar elements (desktop & mobile)
  const userInfoDesktop = document.getElementById("user-info");
  const userInfoMobile = document.getElementById("user-info-mobile");

  const loginBtnDesktop = document.getElementById("login-btn-desktop");
  const logoutBtnDesktop = document.getElementById("logout-btn-desktop");
  const loginBtnMobile = document.getElementById("login-btn-mobile");
  const logoutBtnMobile = document.getElementById("logout-btn-mobile");

  const page = window.location.pathname.split("/").pop(); // nama file

  // Safety: jika elemen tidak ada, jangan error
  function hide(el) { if (el) el.style.display = "none"; }
  function showInline(el) { if (el) el.style.display = "inline-block"; }

  if (isLoggedIn()) {
    const email = getUserEmail();
    const role = getUserRole();

    if (userInfoDesktop) userInfoDesktop.textContent = `👤 ${email} (${role})`;
    if (userInfoMobile) userInfoMobile.textContent = `👤 ${email} (${role})`;

    hide(loginBtnDesktop);
    showInline(logoutBtnDesktop);
    hide(loginBtnMobile);
    showInline(logoutBtnMobile);

    // proteksi halaman makalah (hanya user terdaftar)
    if (page === "makalah.html") {
      if (email === "mpiuser@gmail.com" || email === "mpiadmin@gmail.com") {
        // loadMakalahTable akan dipanggil di bawah (setiap halaman memanggilnya aman)
      } else {
        alert("Anda tidak memiliki akses ke halaman ini!");
        window.location.href = "login.html";
      }
    }

    // jika ada section upload, sembunyikan untuk non-admin
    const uploadSection = document.querySelector(".upload-section");
    if (uploadSection && role !== "admin") uploadSection.style.display = "none";

  } else {
    // belum login
    if (page !== "login.html") {
      // biarkan halaman login.html terbuka, tapi jika user mengakses halaman lain, arahkan ke login
      window.location.href = "login.html";
      return; // hentikan init lainnya karena akan redirect
    }

    // tampilkan/hilangkan tombol sesuai
    if (userInfoDesktop) userInfoDesktop.textContent = "";
    if (userInfoMobile) userInfoMobile.textContent = "";

    showInline(loginBtnDesktop);
    hide(logoutBtnDesktop);
    showInline(loginBtnMobile);
    hide(logoutBtnMobile);
  }

  // Pasang event listener logout (jangan gunakan href untuk redirect langsung)
  if (logoutBtnDesktop) logoutBtnDesktop.addEventListener("click", (e) => { e.preventDefault(); if(confirm("Yakin ingin logout?")) logout(); });
  if (logoutBtnMobile) logoutBtnMobile.addEventListener("click", (e) => { e.preventDefault(); if(confirm("Yakin ingin logout?")) logout(); });
});

// ==============================
// KONFIGURASI SUPABASE
// ==============================
// NOTE: Jika kamu tidak memakai import/module, hapus bagian import dan gunakan versi CDN biasa.
// Jika menggunakan import, pastikan <script type="module" src="script.js"></script> di HTML.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = "https://urwbdfnzygigtifnuuwq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyd2JkZm56eWdpZ3RpZm51dXdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MTM1NzYsImV4cCI6MjA3NzQ4OTU3Nn0.AVvB1OPHCuKR_DkkgUpl2VXcjM7Khtv-_TKxzjkyxrU";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==============================
// LOAD DATA MAKALAH (dipanggil bila ada tabel di halaman)
// ==============================
async function loadMakalahTable() {
  const tableBody = document.getElementById("makalahTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = "<tr><td colspan='4'>Memuat data...</td></tr>";

  const { data: files, error } = await supabase.storage.from("MAKALAH_DAN_PPT").list();

  if (error) {
    tableBody.innerHTML = `<tr><td colspan='4'>❌ Gagal memuat data makalah!</td></tr>`;
    console.error("Gagal load makalah:", error);
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
// HAPUS MAKALAH (ADMIN ONLY)
// ==============================
async function hapusMakalah(fileName) {
  const role = getUserRole();
  if (role !== "admin") {
    alert("❌ Anda tidak memiliki izin untuk menghapus!");
    return;
  }

  if (!confirm(`Yakin ingin menghapus file "${fileName}" ?`)) return;

  const { error } = await supabase.storage.from("MAKALAH_DAN_PPT").remove([fileName]);
  if (error) {
    alert("❌ Gagal menghapus file!");
    console.error("Error hapus:", error);
    return;
  }
  alert("✅ File berhasil dihapus!");
  loadMakalahTable();
}

// Jika halaman memiliki tabel makalah, panggil loadMakalahTable saat DOM siap (tetap aman karena loadMakalahTable memeriksa elemen)
document.addEventListener("DOMContentLoaded", () => {
  loadMakalahTable();
});

// ==============================
// AUTO LOGOUT 20 MENIT (optional)
// ==============================
let waktuKunjungan = 20 * 60;
function mulaiTimerKunjungan() {
  const hitungMundur = setInterval(() => {
    waktuKunjungan--;
    if (waktuKunjungan <= 0) {
      clearInterval(hitungMundur);
      alert("⏰ Waktu kunjungan Anda (20 menit) telah berakhir. Logout otomatis.");
      logout();
    }
  }, 1000);
}

document.addEventListener("DOMContentLoaded", () => {
  if (isLoggedIn()) {
    mulaiTimerKunjungan();
    ["mousemove","keydown","click","scroll"].forEach(evt => {
      document.addEventListener(evt, () => waktuKunjungan = 20 * 60);
    });
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
