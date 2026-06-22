const CONFIG = {

  DATA_URLS: {
    usgs: "https://raw.githubusercontent.com/SitiFadhilahRahmi/TB_VisdatSpasioTemporal_2311532003/main/cleandata/clean_usgs_anomaly.csv",
    bnpb: "https://raw.githubusercontent.com/SitiFadhilahRahmi/TB_VisdatSpasioTemporal_2311532003/main/cleandata/clean_bnpb.csv",
    kabupaten: "https://raw.githubusercontent.com/SitiFadhilahRahmi/TB_VisdatSpasioTemporal_2311532003/main/cleandata/clean_kabupaten.geojson",
    provinsi: "https://raw.githubusercontent.com/SitiFadhilahRahmi/TB_VisdatSpasioTemporal_2311532003/main/cleandata/clean_provinsi.geojson",
  },

  // KONFIGURASI MP
  MAP: {
    center: [-2.5, 118.0],
    zoom: 5,
    minZoom: 4,
    maxZoom: 12,
    bounds: [
      [-15.0, 90.0],
      [10.0, 145.0]
    ],
  },

  YEAR: {
    min: 2010,
    max: 2026,
  },

  // Kedalaman gempa
  DEPTH: {
    shallow: { max: 70, label: "Dangkal (< 70 km)", color: "#e74c3c" }, // merah
    medium: { max: 300, label: "Menengah (70–300 km)", color: "#f39c12" }, // oranye
    deep: { max: 999, label: "Dalam (> 300 km)", color: "#2980b9" }, // biru
  },

  // WARNA ALERT LEVEL GEMPA (USGS PAGER)
  ALERT: {
    red: { color: "#e74c3c", label: "Merah — Bencana Besar" },
    orange: { color: "#e67e22", label: "Oranye — Bencana Sedang" },
    yellow: { color: "#f1c40f", label: "Kuning — Kerugian Terbatas" },
    green: { color: "#2ecc71", label: "Hijau — Kerugian Minimal" },
    none: { color: "#95a5a6", label: "Tidak Ada Data" },
  },


  // WARNA CHOROPLETH BANJIR
  CHOROPLETH_BANJIR: {
    colors: ["#fee5d9", "#fcae91", "#fb6a4a", "#de2d26", "#a50f15", "#67000d"],
    thresholds: [1, 5, 15, 30, 60],
    noData: "#e0e0e0",
  },


  // WARNA CHOROPLETH DAMPAK GEMPA
  CHOROPLETH_GEMPA: {
    colors: ["#f2f0f7", "#cbc9e2", "#9e9ac8", "#756bb1", "#54278f", "#3f007d"],
    thresholds: [1, 5, 20, 50, 100],
    noData: "#e0e0e0",
  },

  // UKURAN MARKER GEMPA
  MARKER_RADIUS: {
    small: 5,
    medium: 8,
    large: 12,
    xlarge: 18,
  },

  // STYLE MARKER TSUNAMI
  TSUNAMI_MARKER: {
    color: "#8e44ad",
    fillColor: "#9b59b6",
    fillOpacity: 0.8,
    weight: 2,
    radius: 10,
    // Ring luar penanda tsunami
    ringColor: "#ffffff",
    ringWeight: 3,
  },

  // KONFIGURASI HEATMAP
  HEATMAP: {
    radius: 25,
    blur: 15,
    maxZoom: 10,
    max: 1.0,
    gradient: {
      0.2: "#313695",
      0.4: "#74add1",
      0.6: "#fee090",
      0.8: "#f46d43",
      1.0: "#a50026"
    },
  },

  // KONFIGURASI ANIMASI TIME-LAPSE
  ANIMATION: {
    intervalMs: 500,   // jeda antar frame (ms)
    trailDays: 30,    // berapa hari gempa tetap terlihat sebelum fade
    stepDays: 7,     // maju berapa hari per frame
  },

  // WARNA CHART.JS
  CHART_COLORS: {
    gempa: "rgba(231, 76, 60, 0.8)",
    gempaBorder: "rgba(231, 76, 60, 1)",
    banjir: "rgba(52, 152, 219, 0.8)",
    banjirBorder: "rgba(52, 152, 219, 1)",
    tsunami: "rgba(155, 89, 182, 0.8)",
    korban: "rgba(230, 126, 34, 0.8)",
    pengungsi: "rgba(26, 188, 156, 0.8)",
    rumahRusak: "rgba(149, 165, 166, 0.8)",
    mag_small: "rgba(241, 196, 15, 0.8)",
    mag_medium: "rgba(230, 126, 34, 0.8)",
    mag_large: "rgba(231, 76, 60, 0.8)",
    mag_xlarge: "rgba(142, 68, 173, 0.8)",
  },

  // LABEL & TEKS UI
  LABELS: {
    depthLegend: "Kedalaman Gempa",
    alertLegend: "Alert Level",
    banjirLegend: "Kejadian Banjir",
    gempaLegend: "Dampak Gempa",
    magGroups: {
      "M4.5–5.0": [4.5, 5.0],
      "M5.0–6.0": [5.0, 6.0],
      "M6.0–7.0": [6.0, 7.0],
      "M7.0+": [7.0, 99],
    },
  },

  // MARKER ANOMALI
  ANOMALY_MARKER: {
    gempa: {
      color: "#e74c3c",   // merah terang (warning)
      size: 20,          // ukuran warning (px)
      strokeColor: "#c0392b",   // merah tua
    },
  },

};

Object.freeze(CONFIG);