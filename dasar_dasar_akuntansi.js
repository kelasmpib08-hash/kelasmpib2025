// ==============================
// KONEKSI SUPABASE
// ==============================
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// Ganti dengan kredensial milikmu
const SUPABASE_URL = "https://urwbdfnzygigtifnuuwq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyd2JkZm56eWdpZ3RpZm51dXdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MTM1NzYsImV4cCI6MjA3NzQ4OTU3Nn0.AVvB1OPHCuKR_DkkgUpl2VXcjM7Khtv-_TKxzjkyxrU";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==============================
// UPLOAD MAKALAH DASAR AKUNTANSI
// ==============================
document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("makalahForm");
  const tableBody = document.querySelector("#makalahTable tbody");
  const searchInput = document.getElementById("searchInput");
  const modal = document.getElementById("editModal");
  const cancelEdit = document.getElementById("cancelEdit");

  // ============================
  // AMBIL USER LOGIN SAAT INI
  // ============================
  let currentUserEmail = "";
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    currentUserEmail = data?.user?.email || "";
  } catch (err) {
    console.warn("Gagal memuat user:", err.message);
  }

  console.log("Email login:", currentUserEmail);

  // Jika user == mpiuser@gmail.com → sembunyikan form upload
  if (currentUserEmail === "mpiuser@gmail.com" && form) {
    form.style.display = "none";
  }

  // Muat data awal
  await loadMakalah();

  // ============================
  // UPLOAD FILE BARU
  // ============================
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const judul = document.getElementById("judul").value.trim();
      const kelompok = document.getElementById("kelompok").value.trim();
      const tanggal = document.getElementById("tanggal").value;
      const pertemuan = parseInt(document.getElementById("pertemuan").value);
      const fileInput = document.getElementById("file");

      if (!fileInput.files.length) {
        alert("Pilih file terlebih dahulu!");
        return;
      }

      const file = fileInput.files[0];
      const fileName = `${Date.now()}_${file.name}`;

      try {
        const { error: uploadError } = await supabase.storage
          .from("MAKALAH_DAN_PPT")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("MAKALAH_DAN_PPT")
          .getPublicUrl(fileName);

        const fileUrl = publicUrlData.publicUrl;

        const { error: insertError } = await supabase
          .from("MAKALAH_DAN_PPT")
          .insert([
            {
              judul,
              kelompok,
              tanggal,
              pertemuan,
              file_name: fileName,
              file_url: fileUrl,
              uploaded_by: currentUserEmail || "user",
              created_at: new Date().toISOString(),
            },
          ]);

        if (insertError) throw insertError;

        alert("✅ Makalah berhasil diunggah!");
        form.reset();
        await loadMakalah();
      } catch (err) {
        console.error("❌ Gagal upload:", err.message);
        alert("❌ Gagal mengunggah makalah: " + err.message);
      }
    });
  }

  // ============================
  // MUAT DATA DARI SUPABASE
  // ============================
  async function loadMakalah() {
    tableBody.innerHTML = "<tr><td colspan='6'>⏳ Memuat data...</td></tr>";

    const { data, error } = await supabase
      .from("MAKALAH_DAN_PPT")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      tableBody.innerHTML = "<tr><td colspan='6'>❌ Gagal memuat data!</td></tr>";
      console.error("Load error:", error.message);
      return;
    }

    if (!data || data.length === 0) {
      tableBody.innerHTML = "<tr><td colspan='6'>Belum ada makalah diunggah.</td></tr>";
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
        <td>${item.pertemuan}</td>
        <td><a href="${item.file_url}" target="_blank">${item.file_name}</a></td>
        <td style="display:flex;gap:6px;flex-wrap:wrap;">
          <button class="view-btn" data-url="${item.file_url}" style="background:#10b981;color:white;border:none;padding:6px 8px;border-radius:5px;cursor:pointer;">Lihat</button>
          <a href="${item.file_url}" download class="download-btn" style="background:#3b82f6;color:white;border:none;padding:6px 8px;border-radius:5px;text-decoration:none;">Download</a>
          ${
            currentUserEmail !== "mpiuser@gmail.com"
              ? `
              <button class="edit-btn" data-id="${item.id}" data-judul="${item.judul}" data-kelompok="${item.kelompok}" data-tanggal="${item.tanggal}" data-pertemuan="${item.pertemuan}" style="background:#f59e0b;color:white;border:none;padding:6px 8px;border-radius:5px;cursor:pointer;">Edit</button>
              <button class="delete-btn" data-id="${item.id}" style="background:#dc2626;color:white;border:none;padding:6px 8px;border-radius:5px;cursor:pointer;">Hapus</button>
              `
              : ""
          }
        </td>
      `;
      tableBody.appendChild(tr);
    });

    // Tombol lihat file
    document.querySelectorAll(".view-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        window.open(btn.dataset.url, "_blank");
      });
    });

    // Tombol edit (admin saja)
    if (currentUserEmail !== "mpiuser@gmail.com") {
      document.querySelectorAll(".edit-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          document.getElementById("editId").value = btn.dataset.id;
          document.getElementById("editJudul").value = btn.dataset.judul;
          document.getElementById("editKelompok").value = btn.dataset.kelompok;
          document.getElementById("editTanggal").value = btn.dataset.tanggal;
          document.getElementById("editPertemuan").value = btn.dataset.pertemuan;

          modal.style.display = "flex";
          setTimeout(() => modal.classList.add("show"), 10);
        });
      });

      // Tombol hapus (admin saja)
      document.querySelectorAll(".delete-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.id;
          if (confirm("Yakin ingin menghapus makalah ini?")) {
            const { error } = await supabase
              .from("MAKALAH_DAN_PPT")
              .delete()
              .eq("id", id);
            if (error) {
              alert("❌ Gagal menghapus data: " + error.message);
            } else {
              alert("✅ Data berhasil dihapus!");
              await loadMakalah();
            }
          }
        });
      });
    }
  }

  // ============================
  // FITUR CARI
  // ============================
  searchInput.addEventListener("input", async (e) => {
    const keyword = e.target.value.toLowerCase();

    const { data, error } = await supabase
      .from("MAKALAH_DAN_PPT")
      .select("*")
      .or(
        `judul.ilike.%${keyword}%,kelompok.ilike.%${keyword}%,pertemuan::text.ilike.%${keyword}%`
      )
      .order("id", { ascending: false });

    if (error) {
      console.error(error.message);
      return;
    }

    renderTable(data);
  });

  // ============================
  // MODAL EDIT MAKALAH
  // ============================
  cancelEdit.addEventListener("click", () => {
    modal.classList.remove("show");
    setTimeout(() => (modal.style.display = "none"), 300);
  });

  document.getElementById("editForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = document.getElementById("editId").value;
    const judul = document.getElementById("editJudul").value;
    const kelompok = document.getElementById("editKelompok").value;
    const tanggal = document.getElementById("editTanggal").value;
    const pertemuan = document.getElementById("editPertemuan").value;

    const { error } = await supabase
      .from("MAKALAH_DAN_PPT")
      .update({ judul, kelompok, tanggal, pertemuan })
      .eq("id", id);

    if (error) {
      alert("❌ Gagal menyimpan perubahan: " + error.message);
      return;
    }

    alert("✅ Data berhasil diperbarui!");
    modal.classList.remove("show");
    setTimeout(() => (modal.style.display = "none"), 300);
    loadMakalah();
  });
});
