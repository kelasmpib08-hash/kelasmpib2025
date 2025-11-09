import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://urwbdfnzygigtifnuuwq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyd2JkZm56eWdpZ3RpZm51dXdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MTM1NzYsImV4cCI6MjA3NzQ4OTU3Nn0.AVvB1OPHCuKR_DkkgUpl2VXcjM7Khtv-_TKxzjkyxrU";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const currentUser = JSON.parse(localStorage.getItem("loggedUser"));

const makalahForm = document.getElementById("makalahForm");
const tableBody = document.getElementById("makalahTableBody");
const searchInput = document.getElementById("searchInput");

// ==============================
// FUNGSI UTAMA LOAD TABEL
// ==============================
export async function loadMakalahTable() {
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
      const fileUrl = item.file_url;
      let actions = `<button onclick="window.open('${fileUrl}', '_blank')">Lihat</button>
                     <a href="${fileUrl}" download>Download</a>`;

      if (currentUser.role === "admin") {
        actions += `<button onclick="editMakalah(${item.id})">Edit</button>
                    <button onclick="hapusMakalah(${item.id}, '${item.file_name}')">Hapus</button>`;
      }

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${item.judul}</td>
        <td>${item.kelompok}</td>
        <td>${item.tanggal}</td>
        <td>${item.pertemuan}</td>
        <td>${item.file_name}</td>
        <td>${actions}</td>
      `;
      tableBody.appendChild(row);
    });
  } catch (err) {
    tableBody.innerHTML = `<tr><td colspan='6'>❌ Gagal memuat data: ${err.message}</td></tr>`;
  }
}

// ==============================
// UPLOAD MAKALAH (ADMIN)
// ==============================
if (makalahForm) {
  makalahForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentUser || currentUser.role !== "admin") return alert("❌ Hanya admin yang bisa upload.");

    const judul = document.getElementById("judul").value.trim();
    const kelompok = document.getElementById("kelompok").value.trim();
    const tanggal = document.getElementById("tanggal").value;
    const pertemuan = parseInt(document.getElementById("pertemuan").value);
    const fileInput = document.getElementById("file");

    if (!fileInput.files.length) return alert("Pilih file!");
    const file = fileInput.files[0];

    // Validasi tipe & size file
    const allowedTypes = ["application/pdf", "application/msword", 
                          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                          "application/vnd.ms-powerpoint",
                          "application/vnd.openxmlformats-officedocument.presentationml.presentation"];
    const maxSizeMB = 10;
    if (!allowedTypes.includes(file.type)) return alert("Tipe file tidak diperbolehkan!");
    if (file.size / 1024 / 1024 > maxSizeMB) return alert("Ukuran file maksimal 10 MB!");

    const fileName = `${Date.now()}_${file.name}`;

    try {
      // Upload ke bucket Supabase
      const { error: uploadError } = await supabase.storage.from("MAKALAH_DAN_PPT").upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from("MAKALAH_DAN_PPT").getPublicUrl(fileName);
      const fileUrl = publicUrlData.publicUrl;

      // Insert metadata ke tabel
      const { error: insertError } = await supabase.from("MAKALAH_DAN_PPT").insert([{
        judul, kelompok, tanggal, pertemuan,
        file_name: fileName,
        file_url: fileUrl,
        uploaded_by: currentUser.email,
        created_at: new Date().toISOString()
      }]);
      if (insertError) throw insertError;

      alert("✅ Makalah berhasil diunggah!");
      makalahForm.reset();
      loadMakalahTable();
    } catch (err) {
      alert("❌ Gagal upload: " + err.message);
    }
  });
}

// ==============================
// HAPUS MAKALAH (ADMIN)
// ==============================
window.hapusMakalah = async (id, fileName) => {
  if (!currentUser || currentUser.role !== "admin") return alert("❌ Hanya admin bisa hapus!");
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
// EDIT JUDUL MAKALAH (ADMIN)
// ==============================
window.editMakalah = async (id) => {
  if (!currentUser || currentUser.role !== "admin") return alert("❌ Hanya admin bisa edit!");
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
// SEARCH MAKALAH
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
      data.forEach((item) => {
        const fileUrl = item.file_url;
        let actions = `<button onclick="window.open('${fileUrl}', '_blank')">Lihat</button>
                       <a href="${fileUrl}" download>Download</a>`;
        if (currentUser.role === "admin") {
          actions += `<button onclick="editMakalah(${item.id})">Edit</button>
                      <button onclick="hapusMakalah(${item.id}, '${item.file_name}')">Hapus</button>`;
        }
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${item.judul}</td>
          <td>${item.kelompok}</td>
          <td>${item.tanggal}</td>
          <td>${item.pertemuan}</td>
          <td>${item.file_name}</td>
          <td>${actions}</td>`;
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
loadMakalahTable();
