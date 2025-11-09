import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://urwbdfnzygigtifnuuwq.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Ambil user dari localStorage
const currentUser = JSON.parse(localStorage.getItem("loggedUser"));

// Pastikan tbody di HTML punya id ini
const tableBody = document.getElementById("makalahTableBody");
const makalahForm = document.getElementById("makalahForm");
const searchInput = document.getElementById("searchInput");

// ==============================
// LOAD TABEL MAKALAH
// ==============================
export async function loadMakalahTable() {
  if (!tableBody) return;
  tableBody.innerHTML = "<tr><td colspan='6'>⏳ Memuat data...</td></tr>";

  try {
    const { data, error } = await supabase
      .from("MAKALAH_DAN_PPT")
      .select("*")
      .order("id", { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) {
      tableBody.innerHTML = "<tr><td colspan='6'>Belum ada makalah.</td></tr>";
      return;
    }

    tableBody.innerHTML = "";
    data.forEach((item) => {
      const fileUrl = item.file_url || "#";
      let actions = `
        <button onclick="window.open('${fileUrl}', '_blank')">Lihat</button>
        <a href="${fileUrl}" download>Download</a>
      `;
      if (currentUser?.role === "admin") {
        actions += `
          <button onclick="editMakalah(${item.id})">Edit</button>
          <button onclick="hapusMakalah(${item.id}, '${item.file_name}')">Hapus</button>
        `;
      }

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${item.judul || "-"}</td>
        <td>${item.kelompok || "-"}</td>
        <td>${item.tanggal || "-"}</td>
        <td>${item.pertemuan || "-"}</td>
        <td>${item.file_name || "-"}</td>
        <td>${actions}</td>
      `;
      tableBody.appendChild(row);
    });
  } catch (err) {
    console.error("Gagal load:", err);
    tableBody.innerHTML = `<tr><td colspan='6'>❌ Gagal memuat data: ${err.message}</td></tr>`;
  }
}

// ==============================
// HAPUS MAKALAH
// ==============================
window.hapusMakalah = async (id, fileName) => {
  if (currentUser?.role !== "admin") return alert("❌ Hanya admin bisa hapus.");
  if (!confirm(`Yakin hapus "${fileName}"?`)) return;

  try {
    await supabase.storage.from("MAKALAH_DAN_PPT").remove([fileName]);
    await supabase.from("MAKALAH_DAN_PPT").delete().eq("id", id);
    alert("✅ File berhasil dihapus!");
    loadMakalahTable();
  } catch (err) {
    alert("❌ Gagal hapus: " + err.message);
  }
};

// ==============================
// EDIT JUDUL (ADMIN)
// ==============================
window.editMakalah = async (id) => {
  if (currentUser?.role !== "admin") return alert("❌ Hanya admin bisa edit!");
  const newJudul = prompt("Masukkan judul baru:");
  if (!newJudul) return;
  try {
    await supabase.from("MAKALAH_DAN_PPT").update({ judul: newJudul }).eq("id", id);
    alert("✅ Judul berhasil diubah!");
    loadMakalahTable();
  } catch (err) {
    alert("❌ Gagal update: " + err.message);
  }
};

// ==============================
// SEARCH
// ==============================
if (searchInput) {
  searchInput.addEventListener("input", async (e) => {
    const keyword = e.target.value.toLowerCase();
    try {
      const { data, error } = await supabase.from("MAKALAH_DAN_PPT")
        .select("*")
        .or(`judul.ilike.%${keyword}%,kelompok.ilike.%${keyword}%,pertemuan::text.ilike.%${keyword}%`)
        .order("id", { ascending: false });
      if (error) throw error;

      tableBody.innerHTML = "";
      if (!data || data.length === 0) {
        tableBody.innerHTML = "<tr><td colspan='6'>Tidak ditemukan.</td></tr>";
        return;
      }

      data.forEach((item) => {
        const fileUrl = item.file_url || "#";
        let actions = `
          <button onclick="window.open('${fileUrl}', '_blank')">Lihat</button>
          <a href="${fileUrl}" download>Download</a>
        `;
        if (currentUser?.role === "admin") {
          actions += `
            <button onclick="editMakalah(${item.id})">Edit</button>
            <button onclick="hapusMakalah(${item.id}, '${item.file_name}')">Hapus</button>
          `;
        }
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${item.judul || "-"}</td>
          <td>${item.kelompok || "-"}</td>
          <td>${item.tanggal || "-"}</td>
          <td>${item.pertemuan || "-"}</td>
          <td>${item.file_name || "-"}</td>
          <td>${actions}</td>
        `;
        tableBody.appendChild(row);
      });
    } catch (err) {
      tableBody.innerHTML = `<tr><td colspan='6'>❌ Gagal cari: ${err.message}</td></tr>`;
    }
  });
}

// ==============================
// LOAD AWAL
// ==============================
document.addEventListener("DOMContentLoaded", loadMakalahTable);
