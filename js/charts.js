let CHARTS = {
  trenTahunan: null,
  trenBulanan: null,
  dampakMeninggal: null,
  dampakPengungsi: null,
  dampakRumah: null,
  magDistribusi: null,
  top10Banjir: null,
  top10Korban: null,
};

// HELPER
const YEAR_LABELS = Array.from(
  { length: CONFIG.YEAR.max - CONFIG.YEAR.min + 1 },
  (_, i) => String(CONFIG.YEAR.min + i)
);

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
];

const BASE_CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: true,
  animation: { duration: 400 },
  plugins: {
    legend: {
      labels: {
        font: { family: "Inter", size: 10 },
        boxWidth: 10,
        padding: 8,
      }
    },
    tooltip: {
      titleFont: { family: "Inter", size: 11 },
      bodyFont: { family: "Inter", size: 11 },
      padding: 8,
      callbacks: {
        label: ctx => ` ${ctx.dataset.label}: ${ctx.raw?.toLocaleString("id-ID") ?? ctx.raw}`
      }
    }
  },
  scales: {
    x: {
      ticks: { font: { family: "Inter", size: 9 }, maxRotation: 45 },
      grid: { color: "#f0f2f5" }
    },
    y: {
      ticks: {
        font: { family: "Inter", size: 9 },
        callback: val => val.toLocaleString("id-ID")
      },
      grid: { color: "#f0f2f5" },
      beginAtZero: true,
    }
  }
};

function destroyChart(key) {
  if (CHARTS[key]) {
    CHARTS[key].destroy();
    CHARTS[key] = null;
  }
}

function getYearRange() {
  const usgs = FILTERED_DATA.usgs;
  const bnpb = FILTERED_DATA.bnpb;
  if (!usgs.length && !bnpb.length) return YEAR_LABELS;
  const allYears = [...new Set([
    ...usgs.map(r => String(r.year)),
    ...bnpb.map(r => String(r.year))
  ])].sort();
  return allYears;
}

// 1. BAR CHART - TREN KEJADIAN PER TAHUN

function renderChartTrenTahunan() {
  destroyChart("trenTahunan");

  const labels = getYearRange();
  const gempaData = countPerYear(FILTERED_DATA.usgs);
  const banjirData = countPerYear(
    FILTERED_DATA.bnpb.filter(r => r.jenis_bencana === "Banjir")
  );

  CHARTS.trenTahunan = new Chart(
    document.getElementById("chart-tren-tahunan"),
    {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Gempa (USGS)",
            data: labels.map(y => gempaData[y] || 0),
            backgroundColor: CONFIG.CHART_COLORS.gempa,
            borderColor: CONFIG.CHART_COLORS.gempaBorder,
            borderWidth: 1,
            borderRadius: 3,
            yAxisID: "y",
          },
          {
            label: "Banjir (BNPB)",
            data: labels.map(y => banjirData[y] || 0),
            backgroundColor: CONFIG.CHART_COLORS.banjir,
            borderColor: CONFIG.CHART_COLORS.banjirBorder,
            borderWidth: 1,
            borderRadius: 3,
            yAxisID: "y1",
          },
        ]
      },
      options: {
        ...BASE_CHART_OPTIONS,
        plugins: {
          ...BASE_CHART_OPTIONS.plugins,
          legend: { ...BASE_CHART_OPTIONS.plugins.legend, position: "top" },
        },
        scales: {
          x: { ...BASE_CHART_OPTIONS.scales.x },
          y: {
            ...BASE_CHART_OPTIONS.scales.y,
            position: "left",
            title: {
              display: true,
              text: "Gempa",
              font: { family: "Inter", size: 9 },
              color: CONFIG.CHART_COLORS.gempaBorder,
            }
          },
          y1: {
            ...BASE_CHART_OPTIONS.scales.y,
            position: "right",
            grid: { drawOnChartArea: false },
            title: {
              display: true,
              text: "Banjir",
              font: { family: "Inter", size: 9 },
              color: CONFIG.CHART_COLORS.banjirBorder,
            }
          },
        }
      }
    }
  );
}

// 2. LINE CHART - POLA MUSIMAN PER BULAN

function renderChartTrenBulanan() {
  destroyChart("trenBulanan");

  const gempaPerBulan = countPerMonth(FILTERED_DATA.usgs);
  const banjirPerBulan = countPerMonth(
    FILTERED_DATA.bnpb.filter(r => r.jenis_bencana === "Banjir")
  );

  CHARTS.trenBulanan = new Chart(
    document.getElementById("chart-tren-bulanan"),
    {
      type: "line",
      data: {
        labels: MONTH_LABELS,
        datasets: [
          {
            label: "Gempa",
            data: gempaPerBulan,
            borderColor: CONFIG.CHART_COLORS.gempaBorder,
            backgroundColor: CONFIG.CHART_COLORS.gempa,
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            yAxisID: "y",
          },
          {
            label: "Banjir",
            data: banjirPerBulan,
            borderColor: CONFIG.CHART_COLORS.banjirBorder,
            backgroundColor: CONFIG.CHART_COLORS.banjir,
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            yAxisID: "y1",
          },
        ]
      },
      options: {
        ...BASE_CHART_OPTIONS,
        plugins: {
          ...BASE_CHART_OPTIONS.plugins,
          legend: { ...BASE_CHART_OPTIONS.plugins.legend, position: "top" },
        },
        scales: {
          x: { ...BASE_CHART_OPTIONS.scales.x },
          y: {
            ...BASE_CHART_OPTIONS.scales.y,
            position: "left",
            title: {
              display: true,
              text: "Gempa",
              font: { family: "Inter", size: 9 },
              color: CONFIG.CHART_COLORS.gempaBorder,
            }
          },
          y1: {
            ...BASE_CHART_OPTIONS.scales.y,
            position: "right",
            grid: { drawOnChartArea: false },
            title: {
              display: true,
              text: "Banjir",
              font: { family: "Inter", size: 9 },
              color: CONFIG.CHART_COLORS.banjirBorder,
            }
          },
        }
      }
    }
  );
}

// 3. LINE CHART - DAMPAK BANJIR KORBAN MENINGGAL

function renderChartDampakMeninggal() {
  destroyChart("dampakMeninggal");

  const labels = getYearRange();
  const dampak = banjirDampakPerYear(FILTERED_DATA.bnpb);

  CHARTS.dampakMeninggal = new Chart(
    document.getElementById("chart-dampak-meninggal"),
    {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Meninggal",
          data: labels.map(y => dampak[y]?.meninggal || 0),
          backgroundColor: CONFIG.CHART_COLORS.korban,
          borderColor: CONFIG.CHART_COLORS.korban,
          borderWidth: 1,
          borderRadius: 3,
        }]
      },
      options: {
        ...BASE_CHART_OPTIONS,
        plugins: {
          ...BASE_CHART_OPTIONS.plugins,
          legend: { display: false },
        },
      }
    }
  );
}

// 4. BAR CHART - DAMPAK BANJIR: PENGUNGSI

function renderChartDampakPengungsi() {
  destroyChart("dampakPengungsi");

  const labels = getYearRange();
  const dampak = banjirDampakPerYear(FILTERED_DATA.bnpb);

  CHARTS.dampakPengungsi = new Chart(
    document.getElementById("chart-dampak-pengungsi"),
    {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Pengungsi",
          data: labels.map(y => dampak[y]?.mengungsi || 0),
          backgroundColor: CONFIG.CHART_COLORS.pengungsi,
          borderColor: CONFIG.CHART_COLORS.pengungsi,
          borderWidth: 1,
          borderRadius: 3,
        }]
      },
      options: {
        ...BASE_CHART_OPTIONS,
        plugins: {
          ...BASE_CHART_OPTIONS.plugins,
          legend: { display: false },
        },
      }
    }
  );
}

// 5. BAR CHART - DAMPAK BANJIR: RUMAH RUSAK

function renderChartDampakRumah() {
  destroyChart("dampakRumah");

  const labels = getYearRange();
  const dampak = banjirDampakPerYear(FILTERED_DATA.bnpb);

  CHARTS.dampakRumah = new Chart(
    document.getElementById("chart-dampak-rumah"),
    {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Rumah Rusak",
          data: labels.map(y => dampak[y]?.rumah_rusak || 0),
          backgroundColor: CONFIG.CHART_COLORS.rumahRusak,
          borderColor: CONFIG.CHART_COLORS.rumahRusak,
          borderWidth: 1,
          borderRadius: 3,
        }]
      },
      options: {
        ...BASE_CHART_OPTIONS,
        plugins: {
          ...BASE_CHART_OPTIONS.plugins,
          legend: { display: false },
        },
      }
    }
  );
}

// 6. BAR CHART - DISTRIBUSI MAGNITUDO

function renderChartMagDistribusi() {
  destroyChart("magDistribusi");

  const dist = magDistribution(FILTERED_DATA.usgs);
  const labels = Object.keys(dist);
  const values = Object.values(dist);

  CHARTS.magDistribusi = new Chart(
    document.getElementById("chart-mag-distribusi"),
    {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Jumlah Gempa",
          data: values,
          backgroundColor: [
            CONFIG.CHART_COLORS.mag_small,
            CONFIG.CHART_COLORS.mag_medium,
            CONFIG.CHART_COLORS.mag_large,
            CONFIG.CHART_COLORS.mag_xlarge,
          ],
          borderWidth: 1,
          borderRadius: 3,
        }]
      },
      options: {
        ...BASE_CHART_OPTIONS,
        plugins: {
          ...BASE_CHART_OPTIONS.plugins,
          legend: { display: false },
          tooltip: {
            ...BASE_CHART_OPTIONS.plugins.tooltip,
            callbacks: {
              label: ctx => ` ${ctx.parsed.y.toLocaleString("id-ID")} gempa`
            }
          }
        },
      }
    }
  );
}

// 7. HORIZONTAL BAR - TOP 10 PROVINSI KEJADIAN BANJIR

function renderChartTop10Banjir() {
  destroyChart("top10Banjir");

  const aggr = aggregateByProvinsi(
    FILTERED_DATA.bnpb.filter(r => r.jenis_bencana === "Banjir"),
    "count"
  );

  const sorted = Object.entries(aggr)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const labels = sorted.map(([prov]) => prov);
  const values = sorted.map(([, val]) => val);

  CHARTS.top10Banjir = new Chart(
    document.getElementById("chart-top10-banjir"),
    {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Kejadian Banjir",
          data: values,
          backgroundColor: CONFIG.CHART_COLORS.banjir,
          borderColor: CONFIG.CHART_COLORS.banjirBorder,
          borderWidth: 1,
          borderRadius: 3,
        }]
      },
      options: {
        ...BASE_CHART_OPTIONS,
        indexAxis: "y",
        plugins: {
          ...BASE_CHART_OPTIONS.plugins,
          legend: { display: false },
        },
        scales: {
          x: { ...BASE_CHART_OPTIONS.scales.x },
          y: {
            ticks: {
              font: { family: "Inter", size: 9 },
              autoSkip: false
            },
            grid: { color: "#f0f2f5" }
          }
        }
      }
    }
  );
}

// 8. HORIZONTAL BAR - TOP 10 PROVINSI KORBAN TERBANYAK

function renderChartTop10Korban() {
  destroyChart("top10Korban");

  const aggr = {};
  FILTERED_DATA.bnpb.forEach(r => {
    const prov = r.provinsi;
    if (!prov) return;
    aggr[prov] = (aggr[prov] || 0) + r.meninggal + r.hilang;
  });

  const sorted = Object.entries(aggr)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const labels = sorted.map(([prov]) => prov);
  const values = sorted.map(([, val]) => val);

  CHARTS.top10Korban = new Chart(
    document.getElementById("chart-top10-korban"),
    {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Total Korban",
          data: values,
          backgroundColor: CONFIG.CHART_COLORS.korban,
          borderColor: CONFIG.CHART_COLORS.korban,
          borderWidth: 1,
          borderRadius: 3,
        }]
      },
      options: {
        ...BASE_CHART_OPTIONS,
        indexAxis: "y",
        plugins: {
          ...BASE_CHART_OPTIONS.plugins,
          legend: { display: false },
        },
        scales: {
          x: { ...BASE_CHART_OPTIONS.scales.x },
          y: {
            ticks: {
              font: { family: "Inter", size: 9 },
              autoSkip: false
            },
            grid: { color: "#f0f2f5" }
          }
        }
      }
    }
  );
}

// RENDER

function renderAllCharts() {
  renderChartTrenTahunan();
  renderChartTrenBulanan();
  renderChartDampakMeninggal();
  renderChartDampakPengungsi();
  renderChartDampakRumah();
  renderChartMagDistribusi();
  renderChartTop10Banjir();
  renderChartTop10Korban();
}