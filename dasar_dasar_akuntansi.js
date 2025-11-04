// ==============================
// KONEKSI SUPABASE
// ==============================
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://urwbdfnzygigtifnuuwq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyd2JkZm56eWdpZ3RpZm51dXdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MTM1NzYsImV4cCI6MjA3NzQ4OTU3Nn0.AVvB1OPHCuKR_DkkgUpl2VXcjM7Khtv-_TKxzjkyxrU";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==============================
// LOAD DATA MAKALAH
// ==============================
document.addEventListener("DOMContentLoaded", async () => {
  const tableBody = document.getElementById("makalahTableBody");
  const searchInput = document.getElementById("searchInput");
  const filterPertemuan = document.getElementById("filterPertemuan");

  // Tampilkan data awal
  await loadMakalah();

  // ============================
  // MUAT DATA DARI SUPABASE
  // ============================
  async function loadMakalah(keyword = "", pertemuan = "all") {
    tableBody.innerHTML = "<tr><td colspan='5'>⏳ Memuat data...</td></tr>";

    let query = supabase.from("MAKALAH_DAN_PPT").select("*").order("id", { ascending: false });

    if (keyword) {
      query = query.or(
        `judul.ilike.%${keyword}%,kelompok.ilike.%${keyword}%,file_name.ilike.%${keyword}%`
      );
    }
    if (pertemuan !== "all") {
      query = query.eq("pertemuan", parseInt(pertemuan));
    }

    const { data, error } = await query;

    if (error) {
      console.error("Load error:", error.message);
      tableBody.innerHTML = "<tr><td colspan='5'>❌ Gagal memuat data!</td></tr>";
      return;
    }

    if (!data || data.length === 0) {
      tableBody.innerHTML = "<tr><td colspan='5'>Belum ada makalah diunggah.</td></tr>";
      return;
    }

    renderTable(data);
  }

  // ============================
  // RENDER DATA KE TABEL
  // ============================
  function renderTable(rows) {
    tableBody.innerHTML = "";
    rows.forEach((item) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${item.judul}</td>
        <td>${item.kelompok}</td>
        <td>${item.tanggal}</td>
        <td>
          <button class="lihat-btn" onclick="window.open('${item.file_url}', '_blank')">Lihat</button>
          <a href="${item.file_url}" download class="download-btn">Download</a>
          <button class="edit-btn" data-id="${item.id}">Edit</button>
          <button class="hapus-btn" data-id="${item.id}">Hapus</button>
        </td>
      `;
      tableBody.appendChild(tr);
    });

    // ============ Hapus ============
    document.querySelectorAll(".hapus-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        if (confirm("Yakin ingin menghapus makalah ini?")) {
          const { error } = await supabase.from("MAKALAH_DAN_PPT").delete().eq("id", id);
          if (error) {
            alert("❌ Gagal menghapus: " + error.message);
          } else {
            alert("✅ Berhasil dihapus!");
            await loadMakalah();
          }
        }
      });
    });

    // ============ Edit ============
    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const { data, error } = await supabase.from("MAKALAH_DAN_PPT").select("*").eq("id", id).single();
        if (error || !data) {
          alert("Data tidak ditemukan!");
          return;
        }

        const newJudul = prompt("Judul baru:", data.judul);
        const newKelompok = prompt("Kelompok baru:", data.kelompok);
        const newTanggal = prompt("Tanggal baru (YYYY-MM-DD):", data.tanggal);

        if (!newJudul || !newKelompok || !newTanggal) {
          alert("Semua kolom wajib diisi!");
          return;
        }

        const { error: updateError } = await supabase
          .from("MAKALAH_DAN_PPT")
          .update({
            judul: newJudul,
            kelompok: newKelompok,
            tanggal: newTanggal,
          })
          .eq("id", id);

        if (updateError) {
          alert("❌ Gagal memperbarui data: " + updateError.message);
        } else {
          alert("✅ Data berhasil diperbarui!");
          await loadMakalah();
        }
      });
    });
  }

  // ============================
  // FITUR CARI & FILTER
  // ============================
  searchInput.addEventListener("input", async (e) => {
    const keyword = e.target.value.trim().toLowerCase();
    await loadMakalah(keyword, filterPertemuan.value);
  });

  filterPertemuan.addEventListener("change", async (e) => {
    await loadMakalah(searchInput.value.trim(), e.target.value);
  });
});
