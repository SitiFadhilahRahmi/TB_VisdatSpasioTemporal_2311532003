let MAP;
let LAYERS = {
  gempa: null,
  tsunami: null,
  banjirChoropleth: null,
  gempaChoropleth: null,
  heatmap: null,
  anomalyGempa: null,
  baseLayer: null,
};
let LEGENDS = {};

// INISIALISASI PETA
function initMap() {
  MAP = L.map("map", {
    center: CONFIG.MAP.center,
    zoom: CONFIG.MAP.zoom,
    minZoom: CONFIG.MAP.minZoom,
    maxZoom: CONFIG.MAP.maxZoom,
    maxBounds: CONFIG.MAP.bounds,
    maxBoundsViscosity: 0.8,
    zoomControl: true,
  });

  LAYERS.baseLayer = L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> | ' +
        'Data: <a href="https://earthquake.usgs.gov">USGS</a> & ' +
        '<a href="https://bnpb.go.id">BNPB</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }
  ).addTo(MAP);

  // Inisialisasi semua layer group kosong
  LAYERS.gempa = L.layerGroup().addTo(MAP);
  LAYERS.tsunami = L.layerGroup().addTo(MAP);
  LAYERS.banjirChoropleth = L.layerGroup().addTo(MAP);
  LAYERS.gempaChoropleth = L.layerGroup();
  LAYERS.heatmap = L.layerGroup();
  LAYERS.anomalyGempa = L.layerGroup();

  console.log("Peta berhasil diinisialisasi.");
}

// HELPER: WARNA & UKURAN MARKER
function getMarkerColor(row, mode) {
  if (mode === "alert") {
    const alert = (row.alert || "none").toLowerCase();
    return (CONFIG.ALERT[alert] || CONFIG.ALERT.none).color;
  }
  // mode === "depth"
  const d = row.depth;
  if (d <= CONFIG.DEPTH.shallow.max) return CONFIG.DEPTH.shallow.color;
  if (d <= CONFIG.DEPTH.medium.max) return CONFIG.DEPTH.medium.color;
  return CONFIG.DEPTH.deep.color;
}

function getMarkerRadius(mag) {
  if (mag >= 7.0) return CONFIG.MARKER_RADIUS.xlarge;
  if (mag >= 6.0) return CONFIG.MARKER_RADIUS.large;
  if (mag >= 5.0) return CONFIG.MARKER_RADIUS.medium;
  return CONFIG.MARKER_RADIUS.small;
}

function getChoroplethColor(value, thresholds, colors) {
  if (!value || value === 0) return CONFIG.CHOROPLETH_BANJIR.noData;
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (value > thresholds[i]) return colors[i + 1];
  }
  return colors[0];
}

// HELPER: POPUP CONTENT
function buildGempaPopup(row) {
  const tsunamiBadge = row.tsunami === 1
    ? `<span class="popup-badge badge-tsunami">⚠ Tsunami Terkonfirmasi</span>`
    : "";

  const alertKey = (row.alert || "none").toLowerCase();
  const alertInfo = CONFIG.ALERT[alertKey] || CONFIG.ALERT.none;
  const alertBadge = `<span class="popup-badge badge-${alertKey}">${alertInfo.label}</span>`;

  const depthLabel = row.depth <= 70
    ? "Dangkal" : row.depth <= 300
      ? "Menengah" : "Dalam";

  return `
    <div class="popup-title">
      <i class="fas fa-mountain" style="color:${CONFIG.DEPTH.shallow.color}"></i>
      Gempa Bumi
    </div>
    ${tsunamiBadge}
    <div class="popup-row">
      <span class="popup-key">Tanggal</span>
      <span class="popup-val">${row.date}</span>
    </div>
    <div class="popup-row">
      <span class="popup-key">Lokasi</span>
      <span class="popup-val">${row.place}</span>
    </div>
    <div class="popup-row">
      <span class="popup-key">Magnitudo</span>
      <span class="popup-val">M ${row.mag.toFixed(1)}</span>
    </div>
    <div class="popup-row">
      <span class="popup-key">Kedalaman</span>
      <span class="popup-val">${row.depth.toFixed(1)} km (${depthLabel})</span>
    </div>
    <div class="popup-row">
      <span class="popup-key">Koordinat</span>
      <span class="popup-val">${row.latitude.toFixed(3)}, ${row.longitude.toFixed(3)}</span>
    </div>
    <div class="popup-row">
      <span class="popup-key">Alert</span>
      <span class="popup-val">${alertBadge}</span>
    </div>
  `;
}

function buildTsunamiPopup(row) {
  return `
    <div class="popup-title">
      <i class="fas fa-water" style="color:${CONFIG.TSUNAMI_MARKER.fillColor}"></i>
      Tsunami Terkonfirmasi
    </div>
    <div class="popup-row">
      <span class="popup-key">Tanggal</span>
      <span class="popup-val">${row.date}</span>
    </div>
    <div class="popup-row">
      <span class="popup-key">Lokasi</span>
      <span class="popup-val">${row.place}</span>
    </div>
    <div class="popup-row">
      <span class="popup-key">Magnitudo</span>
      <span class="popup-val">M ${row.mag.toFixed(1)}</span>
    </div>
    <div class="popup-row">
      <span class="popup-key">Kedalaman</span>
      <span class="popup-val">${row.depth.toFixed(1)} km</span>
    </div>
    <div class="popup-row">
      <span class="popup-key">Koordinat</span>
      <span class="popup-val">${row.latitude.toFixed(3)}, ${row.longitude.toFixed(3)}</span>
    </div>
  `;
}

function buildBanjirPopup(props, value, variable) {
  const varLabels = {
    count: "Jumlah Kejadian",
    meninggal: "Korban Meninggal",
    mengungsi: "Pengungsi",
    rumah_rusak_berat: "Rumah Rusak Berat",
    rumah_terendam: "Rumah Terendam",
  };
  return `
    <div class="popup-title">
      <i class="fas fa-water" style="color:${CONFIG.CHART_COLORS.banjir}"></i>
      Data Banjir — ${props.kabupaten}
    </div>
    <div class="popup-row">
      <span class="popup-key">Provinsi</span>
      <span class="popup-val">${props.provinsi}</span>
    </div>
    <div class="popup-row">
      <span class="popup-key">${varLabels[variable] || variable}</span>
      <span class="popup-val">${value ? value.toLocaleString("id-ID") : "Tidak ada data"}</span>
    </div>
    <div class="popup-row">
      <span class="popup-key">Kode</span>
      <span class="popup-val">${props.kode_kabupaten}</span>
    </div>
  `;
}

function buildGempaDampakPopup(props, korban) {
  return `
    <div class="popup-title">
      <i class="fas fa-mountain" style="color:${CONFIG.CHART_COLORS.gempa}"></i>
      Dampak Gempa — ${props.kabupaten}
    </div>
    <div class="popup-row">
      <span class="popup-key">Provinsi</span>
      <span class="popup-val">${props.provinsi}</span>
    </div>
    <div class="popup-row">
      <span class="popup-key">Total Korban</span>
      <span class="popup-val">${korban ? korban.toLocaleString("id-ID") : "Tidak ada data"}</span>
    </div>
  `;
}

function buildAnomalyGempaPopup(row) {
  return `
    <div class="popup-title">
      <i class="fas fa-exclamation-triangle" style="color:${CONFIG.ANOMALY_MARKER.gempa.color}"></i>
      Anomali Gempa Terdeteksi
    </div>
    <div class="popup-row">
      <span class="popup-key">Tanggal</span>
      <span class="popup-val">${row.date}</span>
    </div>
    <div class="popup-row">
      <span class="popup-key">Lokasi</span>
      <span class="popup-val">${row.place}</span>
    </div>
    <div class="popup-row">
      <span class="popup-key">Magnitudo</span>
      <span class="popup-val">M ${row.mag.toFixed(1)}</span>
    </div>
    <div class="popup-row">
      <span class="popup-key">Kedalaman</span>
      <span class="popup-val">${row.depth.toFixed(1)} km</span>
    </div>
    <div class="popup-row">
      <span class="popup-key">Anomaly Score</span>
      <span class="popup-val">${row.anomaly_score.toFixed(3)}</span>
    </div>
    <p style="font-size:10px;color:#7f8c8d;margin-top:6px;">
      Terdeteksi via Isolation Forest sebagai kombinasi magnitudo-kedalaman tidak biasa.
    </p>
  `;
}

// RENDER LAYER GEMPA (MARKER)
function renderGempaLayer(data, colorMode) {
  LAYERS.gempa.clearLayers();

  data.forEach(row => {
    if (!row.latitude || !row.longitude) return;

    const color = getMarkerColor(row, colorMode);
    const radius = getMarkerRadius(row.mag);

    const circle = L.circleMarker([row.latitude, row.longitude], {
      radius: radius,
      fillColor: color,
      color: "#ffffff",
      weight: row.mag >= 6.5 ? 2 : 1,
      opacity: 1,
      fillOpacity: 0.8,
    });

    circle.bindPopup(buildGempaPopup(row), { maxWidth: 260 });
    circle.bindTooltip(
      `M${row.mag.toFixed(1)} — ${row.date}`,
      { sticky: true, className: "leaflet-tooltip-custom" }
    );

    LAYERS.gempa.addLayer(circle);
  });
}

// RENDER LAYER TSUNAMI
function renderTsunamiLayer(data) {
  LAYERS.tsunami.clearLayers();

  const tsunamiData = data.filter(r => r.tsunami === 1);

  tsunamiData.forEach(row => {
    if (!row.latitude || !row.longitude) return;

    // Ring luar (efek highlight)
    const ring = L.circleMarker([row.latitude, row.longitude], {
      radius: CONFIG.TSUNAMI_MARKER.radius + 5,
      fillColor: "transparent",
      color: CONFIG.TSUNAMI_MARKER.fillColor,
      weight: CONFIG.TSUNAMI_MARKER.ringWeight,
      opacity: 0.6,
      fillOpacity: 0,
    });

    // Marker inti
    const marker = L.circleMarker([row.latitude, row.longitude], {
      radius: CONFIG.TSUNAMI_MARKER.radius,
      fillColor: CONFIG.TSUNAMI_MARKER.fillColor,
      color: CONFIG.TSUNAMI_MARKER.ringColor,
      weight: CONFIG.TSUNAMI_MARKER.weight,
      opacity: 1,
      fillOpacity: CONFIG.TSUNAMI_MARKER.fillOpacity,
    });

    marker.bindPopup(buildTsunamiPopup(row), { maxWidth: 260 });
    marker.bindTooltip(
      `⚠ TSUNAMI — M${row.mag.toFixed(1)} — ${row.date}`,
      { sticky: true }
    );

    LAYERS.tsunami.addLayer(ring);
    LAYERS.tsunami.addLayer(marker);
  });
}

// RENDER CHOROPLETH BANJIR
function renderBanjirChoropleth(bnpbData, variable) {
  LAYERS.banjirChoropleth.clearLayers();

  // Hitung agregasi per kabupaten
  const aggr = aggregateByKabupaten(
    bnpbData.filter(r => r.jenis_bencana === "Banjir"),
    variable
  );

  const { colors, thresholds } = CONFIG.CHOROPLETH_BANJIR;

  const geojsonLayer = L.geoJSON(RAW_DATA.kabupaten, {
    style: feature => {
      const kode = feature.properties.kode_kabupaten;
      const value = aggr[kode] || 0;
      const color = getChoroplethColor(value, thresholds, colors);
      return {
        fillColor: color,
        color: "#ffffff",
        weight: 0.5,
        fillOpacity: value > 0 ? 0.75 : 0.15,
      };
    },
    onEachFeature: (feature, layer) => {
      const kode = feature.properties.kode_kabupaten;
      const value = aggr[kode] || 0;
      layer.bindPopup(
        buildBanjirPopup(feature.properties, value, variable),
        { maxWidth: 260 }
      );
      layer.bindTooltip(
        `${feature.properties.kabupaten}: ${value.toLocaleString("id-ID")}`,
        { sticky: true }
      );
      layer.on("mouseover", function () {
        this.setStyle({ weight: 2, color: "#2c3e50", fillOpacity: 0.9 });
      });
      layer.on("mouseout", function () {
        geojsonLayer.resetStyle(this);
      });
    }
  });

  LAYERS.banjirChoropleth.addLayer(geojsonLayer);
  renderChoroplethLegend("banjir", thresholds, colors);
}

// RENDER CHOROPLETH DAMPAK GEMPA
function renderGempaChoropleth(bnpbData) {
  LAYERS.gempaChoropleth.clearLayers();

  // Total korban
  const aggr = {};
  bnpbData
    .filter(r => r.jenis_bencana === "Gempabumi")
    .forEach(r => {
      const kode = r.kode_kabupaten;
      if (!kode) return;
      aggr[kode] = (aggr[kode] || 0) + r.meninggal + r.hilang;
    });

  const { colors, thresholds } = CONFIG.CHOROPLETH_GEMPA;

  const geojsonLayer = L.geoJSON(RAW_DATA.kabupaten, {
    style: feature => {
      const kode = feature.properties.kode_kabupaten;
      const value = aggr[kode] || 0;
      const color = getChoroplethColor(value, thresholds, colors);
      return {
        fillColor: color,
        color: "#ffffff",
        weight: 0.5,
        fillOpacity: value > 0 ? 0.75 : 0.15,
      };
    },
    onEachFeature: (feature, layer) => {
      const kode = feature.properties.kode_kabupaten;
      const value = aggr[kode] || 0;
      layer.bindPopup(
        buildGempaDampakPopup(feature.properties, value),
        { maxWidth: 260 }
      );
      layer.bindTooltip(
        `${feature.properties.kabupaten}: ${value.toLocaleString("id-ID")} korban`,
        { sticky: true }
      );
      layer.on("mouseover", function () {
        this.setStyle({ weight: 2, color: "#2c3e50", fillOpacity: 0.9 });
      });
      layer.on("mouseout", function () {
        geojsonLayer.resetStyle(this);
      });
    }
  });

  LAYERS.gempaChoropleth.addLayer(geojsonLayer);
  renderChoroplethLegend("gempa", thresholds, colors);
}

// RENDER HEATMAP
function renderHeatmap(data) {
  LAYERS.heatmap.clearLayers();

  const points = data.map(r => [
    r.latitude,
    r.longitude,
    Math.min((r.mag - 4.5) / 4, 1.0)
  ]);

  const heat = L.heatLayer(points, {
    radius: CONFIG.HEATMAP.radius,
    blur: CONFIG.HEATMAP.blur,
    maxZoom: CONFIG.HEATMAP.maxZoom,
    max: CONFIG.HEATMAP.max,
    gradient: CONFIG.HEATMAP.gradient,
  });

  LAYERS.heatmap.addLayer(heat);
}

function createWarningIcon() {
  const cfg = CONFIG.ANOMALY_MARKER.gempa;
  return L.divIcon({
    className: "anomaly-warning-icon",
    html: `<svg width="${cfg.size}" height="${cfg.size}" viewBox="0 0 24 24" fill="none">
             <!-- Segitiga Merah -->
             <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                   fill="${cfg.color}" stroke="${cfg.strokeColor}" stroke-width="1.2" stroke-linejoin="round"/>
             <!-- Tanda Seru Putih -->
             <line x1="12" y1="9" x2="12" y2="13" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"/>
             <line x1="12" y1="17" x2="12.01" y2="17" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"/>
           </svg>`,
    iconSize: [cfg.size, cfg.size],
    iconAnchor: [cfg.size / 2, cfg.size / 2],
  });
}

function renderAnomalyGempaLayer(data) {
  LAYERS.anomalyGempa.clearLayers();

  const anomalies = data.filter(r => r.is_anomaly);
  const warningIcon = createWarningIcon();

  anomalies.forEach(row => {
    if (!row.latitude || !row.longitude) return;

    const marker = L.marker([row.latitude, row.longitude], { icon: warningIcon });
    marker.bindPopup(buildAnomalyGempaPopup(row), { maxWidth: 260 });
    marker.bindTooltip(`⚠ Anomali — M${row.mag.toFixed(1)}`, { sticky: true });

    LAYERS.anomalyGempa.addLayer(marker);
  });
}

// LEGEND CHOROPLETH
function renderChoroplethLegend(type, thresholds, colors) {
  // Hapus legend lama jika ada
  if (LEGENDS[type]) {
    MAP.removeControl(LEGENDS[type]);
  }

  const legend = L.control({ position: "bottomleft" });

  legend.onAdd = function () {
    const div = L.DomUtil.create("div", "leaflet-legend");
    const title = type === "banjir"
      ? CONFIG.LABELS.banjirLegend
      : CONFIG.LABELS.gempaLegend;

    let html = `<h4>${title}</h4>`;
    html += `<div class="legend-item">
               <div class="legend-swatch-rect" style="background:${CONFIG.CHOROPLETH_BANJIR.noData}"></div>
               <span>Tidak ada data</span>
             </div>`;

    const allThresholds = [0, ...thresholds];
    allThresholds.forEach((t, i) => {
      const label = i < thresholds.length
        ? `${t + 1} – ${thresholds[i]}`
        : `> ${t}`;
      html += `<div class="legend-item">
                 <div class="legend-swatch-rect" style="background:${colors[i]}"></div>
                 <span>${label}</span>
               </div>`;
    });

    div.innerHTML = html;
    return div;
  };

  legend.addTo(MAP);
  LEGENDS[type] = legend;
}

function renderDepthLegend() {
  if (LEGENDS.depth) MAP.removeControl(LEGENDS.depth);

  const legend = L.control({ position: "bottomright" });
  legend.onAdd = function () {
    const div = L.DomUtil.create("div", "leaflet-legend");
    let html = `<h4>${CONFIG.LABELS.depthLegend}</h4>`;
    Object.values(CONFIG.DEPTH).forEach(d => {
      html += `<div class="legend-item">
                 <div class="legend-swatch" style="background:${d.color}"></div>
                 <span>${d.label}</span>
               </div>`;
    });
    // Tsunami indicator
    html += `<br><h4>Tsunami</h4>
             <div class="legend-item">
               <div class="legend-swatch" style="background:${CONFIG.TSUNAMI_MARKER.fillColor}"></div>
               <span>Terkonfirmasi Tsunami</span>
             </div>`;
    div.innerHTML = html;
    return div;
  };
  legend.addTo(MAP);
  LEGENDS.depth = legend;
}

function renderAlertLegend() {
  if (LEGENDS.alert) MAP.removeControl(LEGENDS.alert);

  const legend = L.control({ position: "bottomright" });
  legend.onAdd = function () {
    const div = L.DomUtil.create("div", "leaflet-legend");
    let html = `<h4>${CONFIG.LABELS.alertLegend}</h4>`;
    Object.entries(CONFIG.ALERT).forEach(([key, val]) => {
      html += `<div class="legend-item">
                 <div class="legend-swatch" style="background:${val.color}"></div>
                 <span>${val.label}</span>
               </div>`;
    });
    div.innerHTML = html;
    return div;
  };
  legend.addTo(MAP);
  LEGENDS.alert = legend;
}

// TOGGLE LAYER VISIBILITY
function toggleLayer(layerName, visible) {
  const layer = LAYERS[layerName];
  if (!layer) return;
  if (visible) {
    if (!MAP.hasLayer(layer)) MAP.addLayer(layer);
  } else {
    if (MAP.hasLayer(layer)) MAP.removeLayer(layer);
  }
}

// REFRESH SEMUA LAYER
function refreshMapLayers(colorMode, choroplethVariable) {
  const usgs = FILTERED_DATA.usgs;
  const bnpb = FILTERED_DATA.bnpb;

  renderGempaLayer(usgs, colorMode || "depth");
  renderTsunamiLayer(usgs);
  renderBanjirChoropleth(bnpb, choroplethVariable || "count");
  renderGempaChoropleth(bnpb);
  renderHeatmap(usgs);
  renderAnomalyGempaLayer(usgs);    // baru

  if (colorMode === "alert") {
    if (LEGENDS.depth) MAP.removeControl(LEGENDS.depth);
    renderAlertLegend();
  } else {
    if (LEGENDS.alert) MAP.removeControl(LEGENDS.alert);
    renderDepthLegend();
  }
}

// ANIMASI TIME-LAPSE
let animationTimer = null;
let animationIndex = 0;
let animationYears = [];

function buildAnimationDates() {
  const usgsYears = RAW_DATA.usgs.map(r => r.year).filter(y => y > 0);
  const bnpbYears = RAW_DATA.bnpb.map(r => r.year).filter(y => y > 0);
  const yearSet = new Set([...usgsYears, ...bnpbYears]);
  animationYears = [...yearSet].sort((a, b) => a - b);
}

function startAnimation() {
  if (animationYears.length === 0) buildAnimationDates();
  animationIndex = 0;

  document.getElementById("btn-play").disabled = true;
  document.getElementById("btn-pause").disabled = false;
  document.getElementById("btn-stop").disabled = false;

  runAnimationFrame();
}

function runAnimationFrame() {
  if (animationIndex >= animationYears.length) {
    stopAnimation();
    return;
  }

  const currentYear = animationYears[animationIndex];
  const prevYear = currentYear - 1;

  document.getElementById("animation-year-label").textContent = currentYear;

  // Cek layer mana yang aktif (sesuai toggle sidebar)
  const showGempa = FILTER_STATE.layers.gempa;
  const showTsunami = FILTER_STATE.layers.tsunami;
  const showBanjir = FILTER_STATE.layers.banjirChoropleth;
  const showGempaDampak = FILTER_STATE.layers.gempaChoropleth;

  // ---- GEMPA (marker) ----
  LAYERS.gempa.clearLayers();
  if (showGempa) {
    const visible = RAW_DATA.usgs.filter(r =>
      r.year === currentYear || r.year === prevYear
    );
    visible.forEach(row => {
      const isCurrent = row.year === currentYear;
      const opacity = isCurrent ? 1.0 : 0.25;
      const color = getMarkerColor(row, FILTER_STATE.colorMode);
      const radius = getMarkerRadius(row.mag);

      const circle = L.circleMarker([row.latitude, row.longitude], {
        radius,
        fillColor: color,
        color: "#ffffff",
        weight: isCurrent ? 1.5 : 0.5,
        opacity,
        fillOpacity: opacity * 0.85,
      });

      if (isCurrent) {
        circle.bindTooltip(`M${row.mag.toFixed(1)} — ${row.date}`, { sticky: true });
      }
      LAYERS.gempa.addLayer(circle);
    });
  }

  // ---- TSUNAMI (marker khusus) ----
  LAYERS.tsunami.clearLayers();
  if (showTsunami) {
    const visibleTsunami = RAW_DATA.usgs.filter(r =>
      r.tsunami === 1 && (r.year === currentYear || r.year === prevYear)
    );
    visibleTsunami.forEach(row => {
      const isCurrent = row.year === currentYear;
      const opacity = isCurrent ? 1.0 : 0.3;

      const marker = L.circleMarker([row.latitude, row.longitude], {
        radius: CONFIG.TSUNAMI_MARKER.radius,
        fillColor: CONFIG.TSUNAMI_MARKER.fillColor,
        color: CONFIG.TSUNAMI_MARKER.ringColor,
        weight: CONFIG.TSUNAMI_MARKER.weight,
        opacity,
        fillOpacity: opacity * CONFIG.TSUNAMI_MARKER.fillOpacity,
      });

      if (isCurrent) {
        marker.bindTooltip(`⚠ TSUNAMI — M${row.mag.toFixed(1)} — ${row.date}`, { sticky: true });
      }
      LAYERS.tsunami.addLayer(marker);
    });
  }

  // ---- BANJIR (choropleth, hanya tahun aktif, tidak ada trail) ----
  LAYERS.banjirChoropleth.clearLayers();
  if (showBanjir) {
    const bnpbCurrentYear = RAW_DATA.bnpb.filter(
      r => r.jenis_bencana === "Banjir" && r.year === currentYear
    );
    const aggr = aggregateByKabupaten(bnpbCurrentYear, FILTER_STATE.choroplethVariable);
    const { colors, thresholds } = CONFIG.CHOROPLETH_BANJIR;

    const geojsonLayer = L.geoJSON(RAW_DATA.kabupaten, {
      style: feature => {
        const value = aggr[feature.properties.kode_kabupaten] || 0;
        return {
          fillColor: getChoroplethColor(value, thresholds, colors),
          color: "#ffffff",
          weight: 0.5,
          fillOpacity: value > 0 ? 0.8 : 0.1,
        };
      },
      onEachFeature: (feature, layer) => {
        const value = aggr[feature.properties.kode_kabupaten] || 0;
        layer.bindTooltip(`${feature.properties.kabupaten}: ${value}`, { sticky: true });
      }
    });
    LAYERS.banjirChoropleth.addLayer(geojsonLayer);
  }

  // ---- DAMPAK GEMPA (choropleth, hanya tahun aktif) ----
  LAYERS.gempaChoropleth.clearLayers();
  if (showGempaDampak) {
    const bnpbGempaTahun = RAW_DATA.bnpb.filter(
      r => r.jenis_bencana === "Gempabumi" && r.year === currentYear
    );
    const aggr = {};
    bnpbGempaTahun.forEach(r => {
      aggr[r.kode_kabupaten] = (aggr[r.kode_kabupaten] || 0) + r.meninggal + r.hilang;
    });
    const { colors, thresholds } = CONFIG.CHOROPLETH_GEMPA;

    const geojsonLayer = L.geoJSON(RAW_DATA.kabupaten, {
      style: feature => {
        const value = aggr[feature.properties.kode_kabupaten] || 0;
        return {
          fillColor: getChoroplethColor(value, thresholds, colors),
          color: "#ffffff",
          weight: 0.5,
          fillOpacity: value > 0 ? 0.8 : 0.1,
        };
      },
      onEachFeature: (feature, layer) => {
        const value = aggr[feature.properties.kode_kabupaten] || 0;
        layer.bindTooltip(`${feature.properties.kabupaten}: ${value} korban`, { sticky: true });
      }
    });
    LAYERS.gempaChoropleth.addLayer(geojsonLayer);
  }

  animationIndex++;
  animationTimer = setTimeout(runAnimationFrame, CONFIG.ANIMATION.intervalMs);
}

function pauseAnimation() {
  clearTimeout(animationTimer);
  document.getElementById("btn-play").disabled = false;
  document.getElementById("btn-pause").disabled = true;
}

function resumeAnimation() {
  document.getElementById("btn-play").disabled = true;
  document.getElementById("btn-pause").disabled = false;
  runAnimationFrame();
}

function stopAnimation() {
  clearTimeout(animationTimer);
  animationTimer = null;
  animationIndex = 0;

  document.getElementById("btn-play").disabled = false;
  document.getElementById("btn-pause").disabled = true;
  document.getElementById("btn-stop").disabled = true;
  document.getElementById("animation-year-label").textContent = "—";

  refreshAll();
}

function getTrailStartDate(currentDate, days) {
  const d = new Date(currentDate);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function getFadeOpacity(date, currentDate, trailDays) {
  const diff = (new Date(currentDate) - new Date(date)) / (1000 * 86400);
  return Math.max(0.1, 1 - (diff / trailDays));
}