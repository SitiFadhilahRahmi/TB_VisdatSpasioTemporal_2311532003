async function main() {
  try {
    const success = await loadAllData();
    if (!success) {
      console.error("Gagal memuat data. Aplikasi dihentikan.");
      return;
    }
    initMap();
    refreshMapLayers(
      FILTER_STATE.colorMode,
      FILTER_STATE.choroplethVariable
    );
    applyLayerVisibility();
    updateSummaryCards();
    renderAllCharts();
    initFilters();
    buildAnimationDates();

    console.log("Dashboard berhasil diinisialisasi.");

  } catch (err) {
    console.error("Error di main():", err);
    showErrorMessage("Terjadi kesalahan saat memuat dashboard: " + err.message);
  }
}

document.addEventListener("DOMContentLoaded", main);