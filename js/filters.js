let FILTER_STATE = {
  yearMin: CONFIG.YEAR.min,
  yearMax: CONFIG.YEAR.max,
  colorMode: "depth",
  choroplethVariable: "count",
  layers: {
    gempa: true,
    tsunami: true,
    banjirChoropleth: true,
    gempaChoropleth: false,
    heatmap: false,
    anomalyGempa: false,
  },
  animationPlaying: false,
};

// UPDATE SUMMARY CARDS
function updateSummaryCards() {
  const stats = getSummaryStats(FILTERED_DATA.usgs, FILTERED_DATA.bnpb);

  document.getElementById("stat-total-gempa").textContent =
    stats.totalGempa.toLocaleString("id-ID");

  document.getElementById("stat-total-banjir").textContent =
    stats.totalBanjir.toLocaleString("id-ID");

  document.getElementById("stat-total-korban").textContent =
    stats.totalKorban.toLocaleString("id-ID");

  document.getElementById("stat-total-tsunami").textContent =
    stats.totalTsunami.toLocaleString("id-ID");

  document.getElementById("stat-max-mag").textContent =
    `M ${stats.maxMag}`;
}

// REFRESH SEMUA KOMPONEN
function refreshAll() {
  filterByYear(FILTER_STATE.yearMin, FILTER_STATE.yearMax);
  refreshMapLayers(FILTER_STATE.colorMode, FILTER_STATE.choroplethVariable);
  applyLayerVisibility();
  updateSummaryCards();
  renderAllCharts();
}

// APPLY VISIBILITY LAYER
function applyLayerVisibility() {
  Object.entries(FILTER_STATE.layers).forEach(([name, visible]) => {
    toggleLayer(name, visible);
  });
}

// INISIALISASI SEMUA EVENT LISTENER

function initFilters() {
  const sliderMin = document.getElementById("slider-year-min");
  const sliderMax = document.getElementById("slider-year-max");
  const labelMin = document.getElementById("year-min-label");
  const labelMax = document.getElementById("year-max-label");

  function onYearSliderChange() {
    let min = parseInt(sliderMin.value);
    let max = parseInt(sliderMax.value);

    if (min > max) {
      if (this === sliderMin) { min = max; sliderMin.value = min; }
      else { max = min; sliderMax.value = max; }
    }

    labelMin.textContent = min;
    labelMax.textContent = max;

    FILTER_STATE.yearMin = min;
    FILTER_STATE.yearMax = max;

    refreshAll();
  }

  sliderMin.addEventListener("input", onYearSliderChange);
  sliderMax.addEventListener("input", onYearSliderChange);

  document.getElementById("btn-reset-year").addEventListener("click", () => {
    sliderMin.value = CONFIG.YEAR.min;
    sliderMax.value = CONFIG.YEAR.max;
    labelMin.textContent = CONFIG.YEAR.min;
    labelMax.textContent = CONFIG.YEAR.max;

    FILTER_STATE.yearMin = CONFIG.YEAR.min;
    FILTER_STATE.yearMax = CONFIG.YEAR.max;

    refreshAll();
  });

  // TOGGLE LAYER PETA
  const toggleMap = {
    "toggle-gempa": "gempa",
    "toggle-tsunami": "tsunami",
    "toggle-banjir-choropleth": "banjirChoropleth",
    "toggle-gempa-choropleth": "gempaChoropleth",
    "toggle-heatmap": "heatmap",
    "toggle-anomaly-gempa": "anomalyGempa",    // baru
  };

  Object.entries(toggleMap).forEach(([elId, layerName]) => {
    const el = document.getElementById(elId);
    if (!el) return;
    el.addEventListener("change", () => {
      FILTER_STATE.layers[layerName] = el.checked;
      toggleLayer(layerName, el.checked);

      if (layerName === "heatmap" && el.checked) {
        renderHeatmap(FILTERED_DATA.usgs);
      }
    });
  });

  // RADIO WARNA MARKER GEMPA
  document.querySelectorAll('input[name="marker-color"]').forEach(radio => {
    radio.addEventListener("change", () => {
      FILTER_STATE.colorMode = radio.value;
      renderGempaLayer(FILTERED_DATA.usgs, FILTER_STATE.colorMode);

      // Update legend
      if (FILTER_STATE.colorMode === "alert") {
        if (LEGENDS.depth) MAP.removeControl(LEGENDS.depth);
        renderAlertLegend();
      } else {
        if (LEGENDS.alert) MAP.removeControl(LEGENDS.alert);
        renderDepthLegend();
      }
    });
  });

  // SELECT VARIABEL CHOROPLETH BANJIR
  document.getElementById("choropleth-variable").addEventListener("change", e => {
    FILTER_STATE.choroplethVariable = e.target.value;
    renderBanjirChoropleth(FILTERED_DATA.bnpb, FILTER_STATE.choroplethVariable);
  });

  // ANIMASI TIME-LAPSE
  document.getElementById("btn-play").addEventListener("click", () => {
    if (animationIndex > 0) {
      // Resume dari jeda
      resumeAnimation();
    } else {
      // Mulai dari awal
      startAnimation();
    }
    FILTER_STATE.animationPlaying = true;
  });

  document.getElementById("btn-pause").addEventListener("click", () => {
    pauseAnimation();
    FILTER_STATE.animationPlaying = false;
  });

  document.getElementById("btn-stop").addEventListener("click", () => {
    stopAnimation();
    FILTER_STATE.animationPlaying = false;
    // Kembalikan ke state filter saat ini
    refreshAll();
  });

  // ----------------------------------------------------------
  // TAB CHART
  // ----------------------------------------------------------
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      // Nonaktifkan semua tab
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

      // Aktifkan tab yang diklik
      btn.classList.add("active");
      const targetId = btn.getAttribute("data-tab");
      document.getElementById(targetId).classList.add("active");

      // Re-render chart di tab yang baru dibuka
      const tabChartMap = {
        "tab-tren": () => { renderChartTrenTahunan(); renderChartTrenBulanan(); },
        "tab-dampak": () => { renderChartDampakMeninggal(); renderChartDampakPengungsi(); renderChartDampakRumah(); },
        "tab-distribusi": () => { renderChartMagDistribusi(); },
        "tab-top10": () => { renderChartTop10Banjir(); renderChartTop10Korban(); },
      };

      if (tabChartMap[targetId]) tabChartMap[targetId]();
    });
  });

}