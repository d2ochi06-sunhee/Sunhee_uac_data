// Travel Agency Target Marketing & Product Planning Dashboard Controller (Big 4 Countries & 10s-30s Focused)
document.addEventListener("DOMContentLoaded", () => {
  const data = window.TRAVEL_DATA;
  if (!data) {
    console.error("TRAVEL_DATA is not loaded!");
    return;
  }

  // Country Map & Age Map
  const COUNTRY_MAP = {
    "ALL": "4개국 전체 (일본/중국/대만/미국)",
    "2": "🇯🇵 일본",
    "1": "🇨🇳 중국",
    "3": "🇹🇼 대만",
    "11": "🇺🇸 미국 등 서구권"
  };

  const AGE_MAP = {
    "ALL": "10대~30대 전체",
    "1030": "10대~30대 (15-39세)",
    "1020": "10대~20대 (15-29세)",
    "1": "10대 (15-19세)",
    "2": "20대 (20-29세)",
    "3": "30대 (30-39세)"
  };

  // DOM Elements
  const filterYear = document.getElementById("filterYear");
  const filterCountry = document.getElementById("filterCountry");
  const filterAge = document.getElementById("filterAge");
  const filterHallyu = document.getElementById("filterHallyu");
  const resetFilterBtn = document.getElementById("resetFilterBtn");

  // KPI DOMs
  const kpiTargetW = document.getElementById("kpiTargetW");
  const kpiTargetRow = document.getElementById("kpiTargetRow");
  const kpiHallyuRate = document.getElementById("kpiHallyuRate");
  const kpiHallyuW = document.getElementById("kpiHallyuW");
  const kpiStayDays = document.getElementById("kpiStayDays");
  const kpiStayGap = document.getElementById("kpiStayGap");
  const kpiSpendMean = document.getElementById("kpiSpendMean");
  const kpiShopMean = document.getElementById("kpiShopMean");
  const kpiSatScore = document.getElementById("kpiSatScore");

  // Country Cards DOMs
  const btnSelectJapan = document.getElementById("btnSelectJapan");
  const btnSelectChina = document.getElementById("btnSelectChina");
  const btnSelectTaiwan = document.getElementById("btnSelectTaiwan");
  const btnSelectUsa = document.getElementById("btnSelectUsa");

  // Action Cards DOMs
  const generateSpecBtn = document.getElementById("generateSpecBtn");
  const specModal = document.getElementById("specModal");
  const specModalBody = document.getElementById("specModalBody");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const closeModalBtn2 = document.getElementById("closeModalBtn2");
  const copySpecBtn = document.getElementById("copySpecBtn");
  const exportCsvBtn = document.getElementById("exportCsvBtn");
  const tableBody = document.getElementById("tableBody");

  // Chart Instances
  let chartClusterScatterInstance = null;
  let chartCountryAgeInstance = null;
  let chartExperienceGoodsInstance = null;
  let chartStaySpendInstance = null;
  let chartYearlyTrendInstance = null;

  // Format Helper
  const fmtNum = (n) => Math.round(n).toLocaleString("ko-KR");

  // Get current metrics helper
  function getMetrics(y = filterYear.value, c = filterCountry.value, a = filterAge.value, h = filterHallyu.value) {
    try {
      if (c === "ALL") {
        const targetCountries = ["2", "1", "3", "11"];
        let row = 0, totW = 0, hW = 0;
        let weightedStaySum = 0, weightedSpendSum = 0, weightedShopSum = 0;
        let weightedExpSum = 0, weightedGoodsSum = 0, weightedSatSum = 0, weightedRevSum = 0;

        targetCountries.forEach(code => {
          const sub = getMetrics(y, code, a, h);
          row += sub.row || 0;
          totW += sub.totW || 0;
          hW += sub.hW || 0;
          weightedStaySum += (sub.stayMean || 0) * (sub.row || 0);
          weightedSpendSum += (sub.spendMean || 0) * (sub.row || 0);
          weightedShopSum += (sub.shopMean || 0) * (sub.row || 0);
          weightedExpSum += (sub.expRate || 0) * (sub.row || 0);
          weightedGoodsSum += (sub.goodsRate || 0) * (sub.row || 0);
          weightedSatSum += (sub.satMean || 0) * (sub.row || 0);
          weightedRevSum += (sub.revMean || 0) * (sub.row || 0);
        });

        const hRate = totW > 0 ? ((hW / totW) * 100).toFixed(1) : 0;
        const stayMean = (weightedStaySum / (row || 1)).toFixed(1);
        const spendMean = Math.round(weightedSpendSum / (row || 1));
        const shopMean = Math.round(weightedShopSum / (row || 1));
        const expRate = (weightedExpSum / (row || 1)).toFixed(1);
        const goodsRate = (weightedGoodsSum / (row || 1)).toFixed(1);
        const satMean = (weightedSatSum / (row || 1)).toFixed(2);
        const revMean = (weightedRevSum / (row || 1)).toFixed(2);

        return { row, totW, hW, hRate, stayMean, spendMean, shopMean, expRate, goodsRate, satMean, revMean };
      }

      if (a === "1030") {
        const m1 = data[y][c]["1"][h] || {};
        const m2 = data[y][c]["2"][h] || {};
        const m3 = data[y][c]["3"][h] || {};
        const row = (m1.row || 0) + (m2.row || 0) + (m3.row || 0);
        const totW = (m1.totW || 0) + (m2.totW || 0) + (m3.totW || 0);
        const hW = (m1.hW || 0) + (m2.hW || 0) + (m3.hW || 0);
        const hRate = totW > 0 ? ((hW / totW) * 100).toFixed(1) : 0;
        const stayMean = (((m1.stayMean || 0) * (m1.row || 0) + (m2.stayMean || 0) * (m2.row || 0) + (m3.stayMean || 0) * (m3.row || 0)) / (row || 1)).toFixed(1);
        const spendMean = Math.round(((m1.spendMean || 0) * (m1.row || 0) + (m2.spendMean || 0) * (m2.row || 0) + (m3.spendMean || 0) * (m3.row || 0)) / (row || 1));
        const shopMean = Math.round(((m1.shopMean || 0) * (m1.row || 0) + (m2.shopMean || 0) * (m2.row || 0) + (m3.shopMean || 0) * (m3.row || 0)) / (row || 1));
        const expRate = (((m1.expRate || 0) * (m1.row || 0) + (m2.expRate || 0) * (m2.row || 0) + (m3.expRate || 0) * (m3.row || 0)) / (row || 1)).toFixed(1);
        const goodsRate = (((m1.goodsRate || 0) * (m1.row || 0) + (m2.goodsRate || 0) * (m2.row || 0) + (m3.goodsRate || 0) * (m3.row || 0)) / (row || 1)).toFixed(1);
        const satMean = (((m1.satMean || 0) * (m1.row || 0) + (m2.satMean || 0) * (m2.row || 0) + (m3.satMean || 0) * (m3.row || 0)) / (row || 1)).toFixed(2);
        const revMean = (((m1.revMean || 0) * (m1.row || 0) + (m2.revMean || 0) * (m2.row || 0) + (m3.revMean || 0) * (m3.row || 0)) / (row || 1)).toFixed(2);
        return { row, totW, hW, hRate, stayMean, spendMean, shopMean, expRate, goodsRate, satMean, revMean };
      } else if (a === "1020") {
        const m1 = data[y][c]["1"][h] || {};
        const m2 = data[y][c]["2"][h] || {};
        const row = (m1.row || 0) + (m2.row || 0);
        const totW = (m1.totW || 0) + (m2.totW || 0);
        const hW = (m1.hW || 0) + (m2.hW || 0);
        const hRate = totW > 0 ? ((hW / totW) * 100).toFixed(1) : 0;
        const stayMean = (((m1.stayMean || 0) * (m1.row || 0) + (m2.stayMean || 0) * (m2.row || 0)) / (row || 1)).toFixed(1);
        const spendMean = Math.round(((m1.spendMean || 0) * (m1.row || 0) + (m2.spendMean || 0) * (m2.row || 0)) / (row || 1));
        const shopMean = Math.round(((m1.shopMean || 0) * (m1.row || 0) + (m2.shopMean || 0) * (m2.row || 0)) / (row || 1));
        const expRate = (((m1.expRate || 0) * (m1.row || 0) + (m2.expRate || 0) * (m2.row || 0)) / (row || 1)).toFixed(1);
        const goodsRate = (((m1.goodsRate || 0) * (m1.row || 0) + (m2.goodsRate || 0) * (m2.row || 0)) / (row || 1)).toFixed(1);
        const satMean = (((m1.satMean || 0) * (m1.row || 0) + (m2.satMean || 0) * (m2.row || 0)) / (row || 1)).toFixed(2);
        const revMean = (((m1.revMean || 0) * (m1.row || 0) + (m2.revMean || 0) * (m2.row || 0)) / (row || 1)).toFixed(2);
        return { row, totW, hW, hRate, stayMean, spendMean, shopMean, expRate, goodsRate, satMean, revMean };
      }
      return data[y][c][a][h] || {
        row: 0, totW: 0, hW: 0, hRate: 0, stayMean: 0, spendMean: 0, shopMean: 0,
        expRate: 0, goodsRate: 0, satMean: 0, revMean: 0, recMean: 0
      };
    } catch (e) {
      return {
        row: 0, totW: 0, hW: 0, hRate: 0, stayMean: 0, spendMean: 0, shopMean: 0,
        expRate: 0, goodsRate: 0, satMean: 0, revMean: 0, recMean: 0
      };
    }
  }

  // Update Dashboard View
  function updateDashboard() {
    const y = filterYear.value;
    const c = filterCountry.value;
    const a = filterAge.value;
    const h = filterHallyu.value;

    const m = getMetrics(y, c, a, h);

    // 1. KPI Cards
    kpiTargetW.textContent = `${fmtNum(m.totW)} 명`;
    kpiTargetRow.textContent = `4개국 1030 표본 ${fmtNum(m.row)} 명`;

    kpiHallyuRate.textContent = `${m.hRate}%`;
    kpiHallyuW.textContent = `관여 모수 ${fmtNum(m.hW)} 명`;

    kpiStayDays.textContent = `${m.stayMean} 일`;
    kpiStayGap.textContent = `일본 3.6일 vs 중국 5.9일 vs 미국 12.4일`;

    kpiSpendMean.textContent = `$${fmtNum(m.spendMean)}`;
    kpiShopMean.textContent = `1인당 쇼핑비 $${fmtNum(m.shopMean)}`;
    kpiSatScore.textContent = `만족 ${m.satMean}점 / 재방문 ${m.revMean}점`;

    // 2. Charts Update
    renderChartClusterScatter(y, a, h);
    renderChartCountryAge(y, a, h);
    renderChartExperienceGoods(y, c, a);
    renderChartStaySpend(y, c, a);
    renderChartYearlyTrend(c, a, h);

    // 3. Table Update
    renderTable(y, c, a, h);
  }

  // NEW: Cluster Scatter Plot Chart (X: Stay Days, Y: Spend $)
  function renderChartClusterScatter(y, a, h) {
    const ctx = document.getElementById("chartClusterScatter").getContext("2d");
    if (chartClusterScatterInstance) chartClusterScatterInstance.destroy();

    const mJapan = getMetrics(y, "2", a, h);
    const mChina = getMetrics(y, "1", a, h);
    const mTaiwan = getMetrics(y, "3", a, h);
    const mUsa = getMetrics(y, "11", a, h);

    chartClusterScatterInstance = new Chart(ctx, {
      type: "bubble",
      data: {
        datasets: [
          {
            label: "🇯🇵 [군집 1] 일본 1020 (초단기 3.6일 / K-Pop 팬덤)",
            data: [{ x: parseFloat(mJapan.stayMean || 3.6), y: mJapan.spendMean || 1120, r: 14 }],
            backgroundColor: "rgba(255, 42, 109, 0.85)",
            borderColor: "#FF2A6D",
            borderWidth: 2
          },
          {
            label: "🇨🇳 [군집 2] 중국 30대 (뷰티&미식 $1,850 고소비)",
            data: [{ x: parseFloat(mChina.stayMean || 5.9), y: mChina.spendMean || 1850, r: 18 }],
            backgroundColor: "rgba(255, 159, 28, 0.85)",
            borderColor: "#FF9F1C",
            borderWidth: 2
          },
          {
            label: "🇹🇼 [군집 3] 대만 1030 (드라마&미식 5.00점 만점)",
            data: [{ x: parseFloat(mTaiwan.stayMean || 5.4), y: mTaiwan.spendMean || 1300, r: 13 }],
            backgroundColor: "rgba(5, 217, 232, 0.85)",
            borderColor: "#05D9E8",
            borderWidth: 2
          },
          {
            label: "🇺🇸 [군집 4] 미국 1030 (장기 12~30일 / 웰니스 탐방)",
            data: [{ x: parseFloat(mUsa.stayMean || 18.5), y: mUsa.spendMean || 3600, r: 17 }],
            backgroundColor: "rgba(0, 245, 212, 0.85)",
            borderColor: "#00F5D4",
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: "#F1F5F9", font: { size: 12, weight: 'bold' } } },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: 체재 ${context.raw.x}일, 지출 $${context.raw.y}`;
              }
            }
          }
        },
        scales: {
          x: {
            title: { display: true, text: "X축: 평균 체재일수 (일)", color: "#94A3B8", font: { size: 13, weight: 'bold' } },
            ticks: { color: "#94A3B8" },
            grid: { color: "#1E293B" },
            min: 0,
            max: 25
          },
          y: {
            title: { display: true, text: "Y축: 1인당 평균 총지출액 ($)", color: "#94A3B8", font: { size: 13, weight: 'bold' } },
            ticks: { color: "#94A3B8" },
            grid: { color: "#1E293B" },
            min: 500,
            max: 4500
          }
        }
      }
    });
  }

  // Chart 1: Country x Age Segment
  function renderChartCountryAge(y, a, h) {
    const ctx = document.getElementById("chartCountryAge").getContext("2d");
    if (chartCountryAgeInstance) chartCountryAgeInstance.destroy();

    const countries = ["2", "1", "3", "11"];
    const labels = countries.map(code => COUNTRY_MAP[code]);
    const hallyuRates = countries.map(code => getMetrics(y, code, a, h).hRate);
    const youthProps = countries.map(code => {
      const tot = getMetrics(y, code, "ALL", h).totW;
      const youth = (getMetrics(y, code, "1", h).totW || 0) + (getMetrics(y, code, "2", h).totW || 0) + (getMetrics(y, code, "3", h).totW || 0);
      return tot > 0 ? ((youth / tot) * 100).toFixed(1) : 0;
    });

    chartCountryAgeInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "K-컬처 관여율 (%)",
            data: hallyuRates,
            backgroundColor: "rgba(255, 42, 109, 0.85)",
            borderColor: "#FF2A6D",
            borderWidth: 1
          },
          {
            label: "10대~30대 관여객 비중 (%)",
            data: youthProps,
            backgroundColor: "rgba(5, 217, 232, 0.85)",
            borderColor: "#05D9E8",
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: "#94A3B8" } }
        },
        scales: {
          x: { ticks: { color: "#94A3B8" }, grid: { color: "#1E293B" } },
          y: { ticks: { color: "#94A3B8" }, grid: { color: "#1E293B" }, max: 100 }
        }
      }
    });
  }

  // Chart 2: Experience & Goods Conversion
  function renderChartExperienceGoods(y, c, a) {
    const ctx = document.getElementById("chartExperienceGoods").getContext("2d");
    if (chartExperienceGoodsInstance) chartExperienceGoodsInstance.destroy();

    const mH = getMetrics(y, c, a, "1");
    const mNonH = getMetrics(y, c, a, "0");

    chartExperienceGoodsInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["K-POP/촬영지 현장 경험 활동률 (%)", "K-굿즈/한류상품 구매율 (%)"],
        datasets: [
          {
            label: "🔥 1030 K-컬처 관여층 (영향군)",
            data: [mH.expRate, mH.goodsRate],
            backgroundColor: "rgba(255, 42, 109, 0.85)",
            borderColor: "#FF2A6D",
            borderWidth: 1
          },
          {
            label: "⚪ 비교층 (일반관광객)",
            data: [mNonH.expRate, mNonH.goodsRate],
            backgroundColor: "rgba(148, 163, 184, 0.5)",
            borderColor: "#94A3B8",
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: "#94A3B8" } }
        },
        scales: {
          x: { ticks: { color: "#94A3B8" }, grid: { color: "#1E293B" } },
          y: { ticks: { color: "#94A3B8" }, grid: { color: "#1E293B" }, max: 100 }
        }
      }
    });
  }

  // Chart 3: Stay & Spend Efficiency
  function renderChartStaySpend(y, c, a) {
    const ctx = document.getElementById("chartStaySpend").getContext("2d");
    if (chartStaySpendInstance) chartStaySpendInstance.destroy();

    const mH = getMetrics(y, c, a, "1");
    const mNonH = getMetrics(y, c, a, "0");

    chartStaySpendInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["평균 체재일수 (일)", "1인당 총지출액 ($)", "1인당 쇼핑비 ($)"],
        datasets: [
          {
            label: "🔥 1030 K-컬처 관여층",
            data: [mH.stayMean, mH.spendMean, mH.shopMean],
            backgroundColor: "rgba(0, 245, 212, 0.85)",
            borderColor: "#00F5D4",
            borderWidth: 1
          },
          {
            label: "⚪ 비교층 / 일반관광객",
            data: [mNonH.stayMean, mNonH.spendMean, mNonH.shopMean],
            backgroundColor: "rgba(148, 163, 184, 0.5)",
            borderColor: "#94A3B8",
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: "y",
        plugins: {
          legend: { labels: { color: "#94A3B8" } }
        },
        scales: {
          x: { ticks: { color: "#94A3B8" }, grid: { color: "#1E293B" } },
          y: { ticks: { color: "#94A3B8" }, grid: { color: "#1E293B" } }
        }
      }
    });
  }

  // Chart 4: Yearly Trend (2023 ~ 2025)
  function renderChartYearlyTrend(c, a, h) {
    const ctx = document.getElementById("chartYearlyTrend").getContext("2d");
    if (chartYearlyTrendInstance) chartYearlyTrendInstance.destroy();

    const years = ["2023", "2024", "2025"];
    const hallyuRates = years.map(yr => getMetrics(yr, c, a, h).hRate);
    const spendMeans = years.map(yr => getMetrics(yr, c, a, h).spendMean);

    chartYearlyTrendInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: ["2023년", "2024년", "2025년"],
        datasets: [
          {
            label: "1030 K-컬처 관여율 (%)",
            data: hallyuRates,
            borderColor: "#FF2A6D",
            backgroundColor: "rgba(255, 42, 109, 0.1)",
            tension: 0.3,
            fill: true,
            yAxisID: "y"
          },
          {
            label: "1인당 평균 총지출 ($)",
            data: spendMeans,
            borderColor: "#FF9F1C",
            backgroundColor: "transparent",
            borderDash: [5, 5],
            tension: 0.3,
            yAxisID: "y1"
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: "#94A3B8" } }
        },
        scales: {
          x: { ticks: { color: "#94A3B8" }, grid: { color: "#1E293B" } },
          y: {
            type: "linear", display: true, position: "left",
            ticks: { color: "#FF2A6D" }, grid: { color: "#1E293B" }
          },
          y1: {
            type: "linear", display: true, position: "right",
            ticks: { color: "#FF9F1C" }, grid: { drawOnChartArea: false }
          }
        }
      }
    });
  }

  // Render Table (Big 4 Countries Focus)
  function renderTable(y, c, a, h) {
    tableBody.innerHTML = "";
    const countries = c === "ALL" ? ["2", "1", "3", "11"] : [c];
    const ages = a === "1030" ? ["1", "2", "3"] : (a === "1020" ? ["1", "2"] : (a === "ALL" ? ["1", "2", "3"] : [a]));
    const hallyus = h === "ALL" ? ["1", "0"] : [h];

    countries.forEach(codeC => {
      ages.forEach(codeA => {
        hallyus.forEach(codeH => {
          const m = getMetrics(y, codeC, codeA, codeH);
          if (m.row === 0) return;
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${COUNTRY_MAP[codeC] || codeC}</td>
            <td>${AGE_MAP[codeA] || codeA}</td>
            <td><span class="tag ${codeH === "1" ? "pink" : ""}">${codeH === "1" ? "🔥 관여층" : "⚪ 비교층"}</span></td>
            <td>${fmtNum(m.row)}</td>
            <td><strong>${fmtNum(m.totW)}</strong> 명</td>
            <td>${m.stayMean} 일</td>
            <td>$${fmtNum(m.spendMean)}</td>
            <td>$${fmtNum(m.shopMean)}</td>
            <td>${m.expRate}%</td>
            <td>${m.goodsRate}%</td>
            <td>⭐ ${m.satMean} 점</td>
          `;
          tableBody.appendChild(tr);
        });
      });
    });
  }

  // Filter Event Listeners
  [filterYear, filterCountry, filterAge, filterHallyu].forEach(select => {
    select.addEventListener("change", updateDashboard);
  });

  resetFilterBtn.addEventListener("click", () => {
    filterYear.value = "ALL";
    filterCountry.value = "ALL";
    filterAge.value = "1030";
    filterHallyu.value = "1";
    updateDashboard();
  });

  // Country Cards Click Listeners
  if (btnSelectJapan) {
    btnSelectJapan.addEventListener("click", () => {
      filterCountry.value = "2";
      filterAge.value = "1030";
      filterHallyu.value = "1";
      updateDashboard();
    });
  }

  if (btnSelectChina) {
    btnSelectChina.addEventListener("click", () => {
      filterCountry.value = "1";
      filterAge.value = "1030";
      filterHallyu.value = "1";
      updateDashboard();
    });
  }

  if (btnSelectTaiwan) {
    btnSelectTaiwan.addEventListener("click", () => {
      filterCountry.value = "3";
      filterAge.value = "1030";
      filterHallyu.value = "1";
      updateDashboard();
    });
  }

  if (btnSelectUsa) {
    btnSelectUsa.addEventListener("click", () => {
      filterCountry.value = "11";
      filterAge.value = "1030";
      filterHallyu.value = "1";
      updateDashboard();
    });
  }

  // Generate Product Spec Modal
  generateSpecBtn.addEventListener("click", () => {
    const y = filterYear.value;
    const c = filterCountry.value;
    const a = filterAge.value;
    const m = getMetrics(y, c, a, "1");

    const countryName = COUNTRY_MAP[c] || "4개국 전체";
    const ageName = AGE_MAP[a] || "10대~30대 전체";

    let countrySpecHTML = "";
    if (c === "2") {
      countrySpecHTML = `<p>• <strong>[🇯🇵 일본 맞춤 전략] 2박 3일 초밀도 K-Pop & 성수동 쇼핑 코스</strong>: 평균 체재일수 3.6일 짧은 일정 보완을 위해 LCC 항공권 + 성수동/홍대 로드숍 + K-Pop 안무 원데이 클래스 + 올리브영 쇼핑 바우처 결합 코스</p>`;
    } else if (c === "1") {
      countrySpecHTML = `<p>• <strong>[🇨🇳 중국 맞춤 전략] 5일 강남 K-뷰티 & 미쉐린 K-푸드 럭셔리 코스</strong>: 최고 지출액($${fmtNum(m.spendMean)}) 및 높은 쇼핑비($${fmtNum(m.shopMean)})를 고려한 강남 피부과 VIP 스킨케어 + 퍼스널 컬러 + 미쉐린 셰프 테이블 결합 코스</p>`;
    } else if (c === "3") {
      countrySpecHTML = `<p>• <strong>[🇹🇼 대만 맞춤 전략] 4박 5일 K-드라마 명소 & K-푸드 알뜰 코스</strong>: 최고 만족도(5.00점)를 바탕으로 한 경복궁 한복 체험 + 드라마 촬영지(남이섬) + 한국 길거리 미식 투어 코스</p>`;
    } else if (c === "11") {
      countrySpecHTML = `<p>• <strong>[🇺🇸 미국/서구권 맞춤 전략] 14일 그랜드 K-컬처 & 전국 순회 웰니스 코스</strong>: 평균 체재일수 12.4일~30일 및 높은 지출액($${fmtNum(m.spendMean)})을 고려한 서울-부산-제주 KTX 패스 + 한방 스파 + K-푸드 쿠킹 클래스 코스</p>`;
    } else {
      countrySpecHTML = `
        <p>• <strong>[아시아 근거리 (일본/중국/대만)]</strong>: 2박 3일~5일 초밀도 K-Pop 안무, 성수동 로드숍, 강남 K-뷰티 융합 패키지</p>
        <p>• <strong>[미주 장거리 (미국 등)]</strong>: 14일 서울-부산-제주 KTX 연계 한방 웰니스 패키지</p>
      `;
    }

    const specText = `
      <div class="modal-section">
        <h4>1. 타깃 국가 & 1030 개요 (${countryName} Profile)</h4>
        <p>• <strong>타깃 세그먼트</strong>: ${countryName} × ${ageName} K-컬처 관여층</p>
        <p>• <strong>추정 타깃 모수</strong>: 약 ${fmtNum(m.totW)} 명 (K-컬처 관여율 ${m.hRate}%)</p>
        <p>• <strong>체재 및 소비 특성</strong>: 평균 체재일수 ${m.stayMean}일, 1인당 총지출 $${fmtNum(m.spendMean)} (쇼핑비 $${fmtNum(m.shopMean)})</p>
      </div>

      <div class="modal-section">
        <h4>2. 국가별 맞춤형 여행 상품 기획 (Actionable Strategy)</h4>
        ${countrySpecHTML}
      </div>

      <div class="modal-section">
        <h4>3. 관광 충성도 & 후속 CRM 제안 (CRM & Retention)</h4>
        <p>• <strong>만족도 & 재방문 지표</strong>: 전반적 만족도 ${m.satMean}점 / 재방문 의향 ${m.revMean}점</p>
        <p>• <strong>후속 CRM 액션</strong>: 높은 추천 의향(4.67점)을 활용하여 귀국 후 K-굿즈 신상 쿠폰 및 2차 방한 전용 시크릿 할인 코드 제공</p>
      </div>
    `;

    specModalBody.innerHTML = specText;
    specModal.classList.add("active");
  });

  // Modal Close Actions
  [closeModalBtn, closeModalBtn2].forEach(btn => {
    btn.addEventListener("click", () => specModal.classList.remove("active"));
  });

  copySpecBtn.addEventListener("click", () => {
    const text = specModalBody.innerText;
    navigator.clipboard.writeText(text).then(() => {
      alert("4대 국가 맞춤 상품 기획서 텍스트가 클립보드에 복사되었습니다!");
    });
  });

  // Initial Load
  updateDashboard();
});
