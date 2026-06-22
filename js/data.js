let RAW_DATA = {
  usgs: [],
  bnpb: [],
  kabupaten: null,
  provinsi: null,
};

// Data terfilter
let FILTERED_DATA = {
  usgs: [],
  bnpb: [],
};


function parseCSV(csvString) {
  const result = Papa.parse(csvString.trim(), {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });
  return result.data;
}


function parseUSGSRow(row) {
  return {
    id: row.id || "",
    date: row.date || "",
    year: parseInt(row.year) || 0,
    month: parseInt(row.month) || 0,
    latitude: parseFloat(row.latitude) || 0,
    longitude: parseFloat(row.longitude) || 0,
    depth: parseFloat(row.depth) || 0,
    mag: parseFloat(row.mag) || 0,
    place: row.place || "",
    tsunami: parseInt(row.tsunami) || 0,
    alert: row.alert || "none",
    is_anomaly: String(row.is_anomaly).toLowerCase() === "true",
    anomaly_score: parseFloat(row.anomaly_score) || 0,
  };
}

function parseBNPBRow(row) {
  return {
    id: row.id || "",
    date: row.date || "",
    year: parseInt(row.year) || 0,
    month: parseInt(row.month) || 0,
    provinsi: row.provinsi || "",
    kabupaten: row.kabupaten || "",
    kode_kabupaten: row.kode_kabupaten || "",
    kode_provinsi: row.kode_provinsi || "",
    jenis_bencana: row.jenis_bencana || "",
    meninggal: parseInt(row.meninggal) || 0,
    hilang: parseInt(row.hilang) || 0,
    luka_sakit: parseInt(row.luka_sakit) || 0,
    mengungsi: parseInt(row.mengungsi) || 0,
    rumah_rusak_berat: parseInt(row.rumah_rusak_berat) || 0,
    rumah_rusak_sedang: parseInt(row.rumah_rusak_sedang) || 0,
    rumah_rusak_ringan: parseInt(row.rumah_rusak_ringan) || 0,
    rumah_terendam: parseInt(row.rumah_terendam) || 0,
  };
}

async function fetchCSV(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Gagal fetch CSV: ${url}`);
  return await response.text();
}

async function fetchGeoJSON(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Gagal fetch GeoJSON: ${url}`);
  return await response.json();
}

// LOAD SEMUA DATA

async function loadAllData() {
  try {
    showLoadingIndicator(true);

    const [usgsCSV, bnpbCSV, kabupatenGeoJSON, provinsiGeoJSON] = await Promise.all([
      fetchCSV(CONFIG.DATA_URLS.usgs),
      fetchCSV(CONFIG.DATA_URLS.bnpb),
      fetchGeoJSON(CONFIG.DATA_URLS.kabupaten),
      fetchGeoJSON(CONFIG.DATA_URLS.provinsi),
    ]);

    RAW_DATA.usgs = parseCSV(usgsCSV).map(parseUSGSRow).filter(r => r.latitude !== 0 && r.longitude !== 0);
    RAW_DATA.bnpb = parseCSV(bnpbCSV).map(parseBNPBRow).filter(r => r.year > 0);
    RAW_DATA.kabupaten = kabupatenGeoJSON;
    RAW_DATA.provinsi = provinsiGeoJSON;

    console.log(`Data dimuat:`);
    console.log(`  USGS         : ${RAW_DATA.usgs.length.toLocaleString()} rows (${RAW_DATA.usgs.filter(r => r.is_anomaly).length} anomali)`);
    console.log(`  BNPB         : ${RAW_DATA.bnpb.length.toLocaleString()} rows`);
    console.log(`  Kabupaten    : ${RAW_DATA.kabupaten.features.length} features`);
    console.log(`  Provinsi     : ${RAW_DATA.provinsi.features.length} features`);

    FILTERED_DATA.usgs = [...RAW_DATA.usgs];
    FILTERED_DATA.bnpb = [...RAW_DATA.bnpb];

    showLoadingIndicator(false);
    return true;

  } catch (error) {
    console.error("Error loading data:", error);
    showLoadingIndicator(false);
    showErrorMessage(error.message);
    return false;
  }
}

// FILTER DATA
function filterByYear(yearMin, yearMax) {
  FILTERED_DATA.usgs = RAW_DATA.usgs.filter(r => r.year >= yearMin && r.year <= yearMax);
  FILTERED_DATA.bnpb = RAW_DATA.bnpb.filter(r => r.year >= yearMin && r.year <= yearMax);
}

function countPerYear(data) {
  const counts = {};
  for (let y = CONFIG.YEAR.min; y <= CONFIG.YEAR.max; y++) counts[y] = 0;
  data.forEach(r => { if (counts[r.year] !== undefined) counts[r.year]++; });
  return counts;
}

function countPerMonth(data) {
  const counts = Array(13).fill(0); // index 1–12
  data.forEach(r => { if (r.month >= 1 && r.month <= 12) counts[r.month]++; });
  return counts.slice(1); // return index 1–12
}

function aggregateByKabupaten(data, valueField) {
  const result = {};
  data.forEach(r => {
    const kode = r.kode_kabupaten;
    if (!kode) return;
    if (!result[kode]) result[kode] = 0;
    result[kode] += (valueField === "count") ? 1 : (r[valueField] || 0);
  });
  return result;
}

function aggregateByProvinsi(data, valueField) {
  const result = {};
  data.forEach(r => {
    const prov = r.provinsi;
    if (!prov) return;
    if (!result[prov]) result[prov] = 0;
    result[prov] += (valueField === "count") ? 1 : (r[valueField] || 0);
  });
  return result;
}

// Total dampak banjir per tahun
function banjirDampakPerYear(data) {
  const result = {};
  for (let y = CONFIG.YEAR.min; y <= CONFIG.YEAR.max; y++) {
    result[y] = { meninggal: 0, mengungsi: 0, rumah_rusak: 0 };
  }
  data
    .filter(r => r.jenis_bencana === "Banjir")
    .forEach(r => {
      if (!result[r.year]) return;
      result[r.year].meninggal += r.meninggal;
      result[r.year].mengungsi += r.mengungsi;
      result[r.year].rumah_rusak += (r.rumah_rusak_berat + r.rumah_rusak_sedang + r.rumah_rusak_ringan);
    });
  return result;
}

// Distribusi magnitudo
function magDistribution(data) {
  const groups = { "M4.5–5.0": 0, "M5.0–6.0": 0, "M6.0–7.0": 0, "M7.0+": 0 };
  data.forEach(r => {
    if (r.mag < 5.0) groups["M4.5–5.0"]++;
    else if (r.mag < 6.0) groups["M5.0–6.0"]++;
    else if (r.mag < 7.0) groups["M6.0–7.0"]++;
    else groups["M7.0+"]++;
  });
  return groups;
}

// Summary cards
function getSummaryStats(usgsData, bnpbData) {
  const banjir = bnpbData.filter(r => r.jenis_bencana === "Banjir");
  const tsunami = usgsData.filter(r => r.tsunami === 1);
  const maxMag = usgsData.reduce((max, r) => r.mag > max.mag ? r : max, { mag: 0 });

  return {
    totalGempa: usgsData.length,
    totalBanjir: banjir.length,
    totalKorban: banjir.reduce((sum, r) => sum + r.meninggal + r.hilang, 0),
    totalTsunami: tsunami.length,
    maxMag: maxMag.mag.toFixed(1),
    maxMagPlace: maxMag.place || "-",
    maxMagDate: maxMag.date || "-",
  };
}

function showLoadingIndicator(show) {
  const el = document.getElementById("loading-indicator");
  if (el) el.style.display = show ? "flex" : "none";
}

function showErrorMessage(msg) {
  const el = document.getElementById("error-message");
  if (el) {
    el.textContent = `Error: ${msg}`;
    el.style.display = "block";
  }
}