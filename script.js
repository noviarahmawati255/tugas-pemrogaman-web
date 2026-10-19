
let data = JSON.parse(localStorage.getItem("smartMoney")) || {
    cash: 0,
    bank: 0,
    transaksi: []
};

const rupiah = n => "Rp" + n.toLocaleString("id-ID");

const hariIni = () => {
    let d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function simpan() {
    localStorage.setItem("smartMoney", JSON.stringify(data));
}

function saldo(akun) {
    return data[akun] + data.transaksi.reduce((total, t) => {
        if (t.akun !== akun) return total;
        return total + (t.jenis === "masuk" ? t.jumlah : -t.jumlah);
    }, 0);
}

function total(jenis, daftar = data.transaksi) {
    return daftar.reduce((sum, t) =>
        sum + (t.jenis === jenis ? t.jumlah : 0), 0);
}

function pesan(teks, error = false) {
    let p = document.getElementById("pesan");
    p.textContent = teks;
    p.style.color = error ? "#cf667d" : "#478568";
}

function tampilkan() {
    document.getElementById("totalSaldo").textContent = rupiah(saldo("cash") + saldo("bank"));
    document.getElementById("saldoCash").textContent = rupiah(saldo("cash"));
    document.getElementById("saldoBank").textContent = rupiah(saldo("bank"));
    document.getElementById("totalMasuk").textContent = rupiah(total("masuk"));
    document.getElementById("totalKeluar").textContent = rupiah(total("keluar"));

    rekap();
    riwayat();
}

// Menyimpan saldo awal
document.getElementById("formSaldo").onsubmit = function(e) {
    e.preventDefault();

    let cash = Number(document.getElementById("saldoAwalCash").value);
    let bank = Number(document.getElementById("saldoAwalBank").value);

    if (
        document.getElementById("saldoAwalCash").value === "" ||
        document.getElementById("saldoAwalBank").value === "" ||
        !Number.isSafeInteger(cash) || !Number.isSafeInteger(bank) ||
        cash < 0 || bank < 0
    ) {
        return pesan("Masukkan saldo awal yang valid.", true);
    }

    data.cash = cash;
    data.bank = bank;
    simpan();
    tampilkan();
    pesan("Saldo awal berhasil disimpan.");
};

// Mencatat transaksi
document.getElementById("formTransaksi").onsubmit = function(e) {
    e.preventDefault();

    let jenis = document.getElementById("jenis").value;
    let akun = document.getElementById("akun").value;
    let jumlahInput = document.getElementById("jumlah").value;
    let jumlah = Number(jumlahInput);
    let tanggal = document.getElementById("tanggal").value;

    if (!jumlahInput || !Number.isSafeInteger(jumlah) || jumlah <= 0 || !tanggal) {
        return pesan("Periksa jumlah dan tanggal transaksi.", true);
    }

    if (jenis === "keluar" && jumlah > saldo(akun)) {
        return pesan("Saldo akun tidak mencukupi!", true);
    }

    data.transaksi.push({
        id: Date.now().toString() + Math.random().toString(16).slice(2),
        jenis,
        akun,
        jumlah,
        tanggal,
        kategori: document.getElementById("kategori").value,
        keterangan: document.getElementById("keterangan").value.trim()
    });

    simpan();
    this.reset();
    document.getElementById("tanggal").value = hariIni();
    tampilkan();
    pesan("Transaksi berhasil disimpan.");
};

// Mengatur rekap mingguan, bulanan, atau tahunan
function rekap() {
    let periode = document.getElementById("periode").value;
    let tanggal = document.getElementById("tanggalRekap").value;
    if (!tanggal) return;

    let [y, m, d] = tanggal.split("-").map(Number);
    let awal = new Date(y, m - 1, d);
    let akhir = new Date(awal);

    if (periode === "minggu") {
        awal.setDate(awal.getDate() - (awal.getDay() + 6) % 7);
        akhir = new Date(awal);
        akhir.setDate(akhir.getDate() + 6);
    } else if (periode === "bulan") {
        awal.setDate(1);
        akhir = new Date(y, m, 0);
    } else {
        awal = new Date(y, 0, 1);
        akhir = new Date(y, 11, 31);
    }

    const formatTanggal = date =>
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    let daftar = data.transaksi.filter(t =>
        t.tanggal >= formatTanggal(awal) &&
        t.tanggal <= formatTanggal(akhir)
    );

    let masuk = total("masuk", daftar);
    let keluar = total("keluar", daftar);

    document.getElementById("labelPeriode").textContent =
        `${formatTanggal(awal)} sampai ${formatTanggal(akhir)}`;
    document.getElementById("rekapMasuk").textContent = rupiah(masuk);
    document.getElementById("rekapKeluar").textContent = rupiah(keluar);
    document.getElementById("rekapSelisih").textContent = rupiah(masuk - keluar);
}

// Menampilkan riwayat transaksi
function riwayat() {
    let tbody = document.getElementById("daftarTransaksi");
    let jenis = document.getElementById("filterJenis").value;
    let cari = document.getElementById("cari").value.toLowerCase();

    tbody.innerHTML = "";

    let daftar = [...data.transaksi]
        .filter(t => jenis === "semua" || t.jenis === jenis)
        .filter(t => (t.kategori + " " + t.keterangan).toLowerCase().includes(cari))
        .sort((a, b) => b.tanggal.localeCompare(a.tanggal));

    document.getElementById("kosong").hidden = daftar.length > 0;

    daftar.forEach(t => {
        let tr = document.createElement("tr");
        let tanggal = t.tanggal.split("-").reverse().join("/");
        let namaAkun = t.akun === "cash" ? "Cash" : "Rekening";

        [tanggal, t.kategori, namaAkun].forEach(teks => {
            let td = document.createElement("td");
            td.textContent = teks;
            tr.appendChild(td);
        });

        let tdJumlah = document.createElement("td");
        tdJumlah.textContent = (t.jenis === "masuk" ? "+" : "-") + rupiah(t.jumlah);
        tdJumlah.className = t.jenis === "masuk" ? "green" : "red";
        tr.appendChild(tdJumlah);

        let tdAksi = document.createElement("td");
        let tombol = document.createElement("button");
        tombol.textContent = "Hapus";
        tombol.className = "hapus-item";

        tombol.onclick = () => {
            if (!confirm("Hapus transaksi ini?")) return;

            // Jangan menghapus pemasukan jika uangnya sudah terpakai.
            if (t.jenis === "masuk" && t.jumlah > saldo(t.akun) - t.jumlah) {
                return pesan("Uang dari transaksi ini sudah terpakai. Sesuaikan pengeluaran dahulu.", true);
            }

            data.transaksi = data.transaksi.filter(item => item.id !== t.id);
            simpan();
            tampilkan();
            pesan("Transaksi berhasil dihapus.");
        };

        tdAksi.appendChild(tombol);
        tr.appendChild(tdAksi);
        tbody.appendChild(tr);
    });
}

// Menghapus seluruh riwayat
document.getElementById("hapusSemua").onclick = () => {
    if (!confirm("Hapus semua transaksi? Saldo awal tetap tersimpan.")) return;
    data.transaksi = [];
    simpan();
    tampilkan();
    pesan("Riwayat transaksi dihapus.");
};

// Memperbarui rekap dan riwayat saat filter berubah
document.getElementById("periode").onchange = rekap;
document.getElementById("tanggalRekap").onchange = rekap;
document.getElementById("filterJenis").onchange = riwayat;
document.getElementById("cari").oninput = riwayat;

// Menyiapkan halaman
document.getElementById("tanggal").value = hariIni();
document.getElementById("tanggalRekap").value = hariIni();
document.getElementById("saldoAwalCash").value = data.cash;
document.getElementById("saldoAwalBank").value = data.bank;
tampilkan();
