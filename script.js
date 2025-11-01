// ==============================
// KONFIGURASI USER LOGIN (OFFLINE / LOCAL)
// ==============================
const users = {
  "mpiadmin@gmail.com": { password: "AdminMPIB2025", role: "admin" },
  "mpiuser@gmail.com": { password: "UserMPIB2025", role: "user" },
};

// ==============================
// KONFIGURASI SUPABASE
// ==============================
const SUPABASE_URL = "https://urwbdfnzygigtifnuuwq.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyd2JkZm56eWdpZ3RpZm51dXdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MTM1NzYsImV4cCI6MjA3NzQ4OTU3Nn0.AVvB1OPHCuKR_DkkgUpl2VXcjM7Khtv-_TKxzjkyxrU";

let supabase;
(async () => {
  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
})();

// ==============================
// UTILITAS LOGIN
// ==============================
function isLoggedIn() {
  return !!localStorage.getItem("loggedUser");
}
function getUser() {
  return JSON.parse(localStorage.getItem("loggedUser"));
}
function getUserRole() {
  const user = getUser();
  return user ? user.role : null;
}
function getUserEmail() {
  const user = getUser();
  return user ? user.email : null;
}
function logout() {
  localStorage.removeItem("loggedUser");
  alert("Anda telah logout.");
  window.location.href = "login.html";
}

// ==============================
// SAAT HALAMAN DIBUKA
// ==============================
document.addEventListener("DOMContentLoaded", async () => {
  const page = window.location.pathname.split("/").pop();
  const loginForm = document.getElementById("login-form");
  const userInfo = document.getElementById("user-info");
  const userInfoMobile = document.getElementById("user-info-mobile");
  const logoutBtn = document.getElementById("logout-btn");
  const uploadSection = document.querySelector(".upload-section");

  const currentUser = getUser();

  // === 1. CEK LOGIN ===
  if (!currentUser && page !== "login.html") {
    window.location.href = "login.html";
    return;
  }

  // === 2. LOGIN PAGE ===
  if (page === "login.html" && currentUser) {
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

  // === 3. INDEX / MAHALAH PAGE ===
  if (currentUser) {
    if (userInfo)
      userInfo.innerHTML = `👤 ${currentUser.email} (${currentUser.role})`;
    if (userInfoMobile)
      showLogoutButton(currentUser, userInfoMobile);

    if (logoutBtn) {
      logoutBtn.style.display = "inline-block";
      logoutBtn.addEventListener("click", logout);
    }

    if (uploadSection && currentUser.role !== "admin") {
      uploadSection.style.display = "none";
    }

    if (page === "makalah.html") {
      await loadMakalahTable();
    }
  }
});

// ==============================
// TAMPILKAN USER INFO (MOBILE)
// ==============================
function showLogoutButton(user, container) {
  container.innerHTML = `
    <div class="user-info-box">
      <span class="user-email">${user.email}</span>
      <button id="logout-btn-mobile" class="cta-button">Logout</button>
    </div>
  `;
  document
    .getElementById("logout-btn-mobile")
    .addEventListener("click", logout);
}

// ==============================
// LOAD DATA MAKALAH DARI SUPABASE
// ==============================
async function loadMakalahTable() {
  const tableBody = document.getElementById("makalahTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = "<tr><td colspan='4'>⏳ Memuat data...</td></tr>";

  const { data: files, error } = await supabase.storage
    .from("MAKALAH_DAN_PPT")
    .list();

  if (error) {
    console.error("Gagal load makalah:", error);
    tableBody.innerHTML =
      "<tr><td colspan='4'>❌ Gagal memuat data makalah!</td></tr>";
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
      <button class="cta-button" onclick="window.open('${fileUrl}', '_blank')">Lihat</button>
      <a href="${fileUrl}" download class="cta-button">Download</a>
    `;

    if (role === "admin") {
      actionButtons += `
        <button class="cta-button" style="background:#ff4444" onclick="hapusMakalah('${file.name}')">Hapus</button>
      `;
    }

    row.innerHTML = `
      <td>${file.name}</td>
      <td>${new Date().toLocaleDateString()}</td>
      <td>${file.metadata?.size ? (file.metadata.size / 1024 / 1024).toFixed(2) + " MB" : "-"}</td>
      <td>${actionButtons}</td>
    `;
    tableBody.appendChild(row);
  });
}

// ==============================
// HAPUS FILE MAKALAH
// ==============================
async function hapusMakalah(fileName) {
  const role = getUserRole();
  if (role !== "admin") {
    alert("❌ Anda tidak memiliki izin untuk menghapus file!");
    return;
  }

  if (confirm(`Yakin ingin menghapus "${fileName}" ?`)) {
    const { error } = await supabase.storage
      .from("MAKALAH_DAN_PPT")
      .remove([fileName]);
    if (error) {
      alert("❌ Gagal menghapus file!");
      console.error(error);
    } else {
      alert("✅ File berhasil dihapus!");
      loadMakalahTable();
    }
  }
}

// ==============================
// AUTO LOGOUT SETELAH 20 MENIT
// ==============================
let waktuKunjungan = 20 * 60;
function mulaiTimerKunjungan() {
  const timer = setInterval(() => {
    waktuKunjungan--;
    if (waktuKunjungan <= 0) {
      clearInterval(timer);
      alert("⏰ Waktu 20 menit habis, Anda logout otomatis.");
      logout();
    }
  }, 1000);

  ["mousemove", "keydown", "click", "scroll"].forEach((evt) =>
    document.addEventListener(evt, () => (waktuKunjungan = 20 * 60))
  );
}

document.addEventListener("DOMContentLoaded", () => {
  if (isLoggedIn()) mulaiTimerKunjungan();
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
  }
});
