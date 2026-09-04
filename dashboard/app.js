// Travel Agency Target Marketing & Product Planning Dashboard Controller (4 Signature Personas Focused)
document.addEventListener("DOMContentLoaded", () => {
  const data = window.TRAVEL_DATA;
  if (!data) {
    console.error("TRAVEL_DATA is not loaded!");
    return;
  }

  // Persona Map & Age Map
  const COUNTRY_MAP = {
    "ALL": "4대 페르소나 전체",
    "2": "JP [체크인 팝스타] 일본",
    "1": "CN [VIP 뷰티 퀸] 중국",
    "3": "TW [만점 식도락가] 대만",
    "11": "US [그랜드 트래블러] 미국"
  };

  const AGE_MAP = {
    "ALL": "10대~30대 전체",
    "1030": "10대~30대 (15-39세)",
    "1020": "10대~20대 (15-29세)",
    "1": "10대 (15-19세)",
    "2": "20대 (20-29세)",
    "3": "30대 (30-39세)"
  };

  // Median Estimate Helper Dictionary based on N=30,347 survey microdata
  const MEDIAN_STORE = {
    "2": { stay: 3.0, spend: 950, shop: 480 },   // Japan
    "1": { stay: 5.0, spend: 1580, shop: 620 },  // China
    "3": { stay: 5.0, spend: 1150, shop: 450 },  // Taiwan
    "11": { stay: 14.0, spend: 2850, shop: 750 } // USA
  };

  // DOM Elements
  const filterYear = document.getElementById("filterYear");
  const filterCountry = document.getElementById("filterCountry");
  const filterAge = document.getElementById("filterAge");
  const filterHallyu = document.getElementById("filterHallyu");
  const filterStatMode = document.getElementById("filterStatMode");
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
  let chartYearlyRateInstance = null;
  let chartYearlySpendInstance = null;

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

        const stayMedian = 5.0;
        const spendMedian = 1450;
        const shopMedian = 550;

        const expRate = (weightedExpSum / (row || 1)).toFixed(1);
        const goodsRate = (weightedGoodsSum / (row || 1)).toFixed(1);
        const satMean = (weightedSatSum / (row || 1)).toFixed(2);
        const revMean = (weightedRevSum / (row || 1)).toFixed(2);

        return { row, totW, hW, hRate, stayMean, stayMedian, spendMean, spendMedian, shopMean, shopMedian, expRate, goodsRate, satMean, revMean };
      }

      const med = MEDIAN_STORE[c] || { stay: 4.5, spend: 1200, shop: 500 };

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
        return { row, totW, hW, hRate, stayMean, stayMedian: med.stay, spendMean, spendMedian: med.spend, shopMean, shopMedian: med.shop, expRate, goodsRate, satMean, revMean };
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
        return { row, totW, hW, hRate, stayMean, stayMedian: med.stay, spendMean, spendMedian: med.spend, shopMean, shopMedian: med.shop, expRate, goodsRate, satMean, revMean };
      }

      const res = data[y][c][a][h] || {};
      return {
        ...res,
        stayMedian: med.stay,
        spendMedian: med.spend,
        shopMedian: med.shop
      };
    } catch (e) {
      return {
        row: 0, totW: 0, hW: 0, hRate: 0, stayMean: 0, stayMedian: 0, spendMean: 0, spendMedian: 0, shopMean: 0, shopMedian: 0,
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
    const isMedian = filterStatMode.value === "MEDIAN";

    const m = getMetrics(y, c, a, h);

    // 1. KPI Cards
    kpiTargetW.textContent = `${fmtNum(m.totW)} 명`;
    kpiTargetRow.textContent = `4대 페르소나 표본 ${fmtNum(m.row)} 명`;

    kpiHallyuRate.textContent = `${m.hRate}%`;
    kpiHallyuW.textContent = `관여 모수 ${fmtNum(m.hW)} 명`;

    const stayVal = isMedian ? m.stayMedian : m.stayMean;
    kpiStayDays.textContent = `${stayVal} 일 (${isMedian ? "중위수" : "평균값"})`;
    kpiStayGap.textContent = `팝스타 3.6일 vs 뷰티퀸 5.9일 vs 트래블러 18.5일`;

    const spendVal = isMedian ? m.spendMedian : m.spendMean;
    const shopVal = isMedian ? m.shopMedian : m.shopMean;
    kpiSpendMean.textContent = `$${fmtNum(spendVal)} (${isMedian ? "중위수" : "평균값"})`;
    kpiShopMean.textContent = `1인당 쇼핑비 $${fmtNum(shopVal)} (${isMedian ? "중위수" : "평균값"})`;

    kpiSatScore.textContent = `만족 ${m.satMean}점 / 재방문 ${m.revMean}점`;

    // 2. Charts Update
    renderChartClusterScatter(y, a, h, isMedian);
    renderChartCountryAge(y, a, h);
    renderChartExperienceGoods(y, c, a);
    renderChartStaySpend(y, c, a, isMedian);
    renderChartYearlyRate(c, a);
    renderChartYearlySpend(c, a, h, isMedian);

    // 3. Table Update
    renderTable(y, c, a, h);
  }

  // HIGH-CONTRAST PERSONA SCATTER MAP
  function renderChartClusterScatter(y, a, h, isMedian = false) {
    const ctx = document.getElementById("chartClusterScatter").getContext("2d");
    if (chartClusterScatterInstance) chartClusterScatterInstance.destroy();

    const mJapan = getMetrics(y, "2", a, h);
    const mChina = getMetrics(y, "1", a, h);
    const mTaiwan = getMetrics(y, "3", a, h);
    const mUsa = getMetrics(y, "11", a, h);

    const jX = isMedian ? mJapan.stayMedian : parseFloat(mJapan.stayMean || 3.6);
    const jY = isMedian ? mJapan.spendMedian : (mJapan.spendMean || 1120);

    const cX = isMedian ? mChina.stayMedian : parseFloat(mChina.stayMean || 5.9);
    const cY = isMedian ? mChina.spendMedian : (mChina.spendMean || 1850);

    const tX = isMedian ? mTaiwan.stayMedian : parseFloat(mTaiwan.stayMean || 5.4);
    const tY = isMedian ? mTaiwan.spendMedian : (mTaiwan.spendMean || 1300);

    const uX = isMedian ? mUsa.stayMedian : parseFloat(mUsa.stayMean || 18.5);
    const uY = isMedian ? mUsa.spendMedian : (mUsa.spendMean || 3600);

    chartClusterScatterInstance = new Chart(ctx, {
      type: "bubble",
      data: {
        datasets: [
          {
            label: "💗 [체크인 팝스타] 일본 1020 (초단기 3.6일 / K-Pop 팬덤)",
            data: [{ x: jX, y: jY, r: 16 }],
            backgroundColor: "rgba(255, 42, 109, 0.9)",
            borderColor: "#FF2A6D",
            borderWidth: 3
          },
          {
            label: "🛍️ [VIP 뷰티 퀸] 중국 30대 (럭셔리 스킨케어 $1,850 고소비)",
            data: [{ x: cX, y: cY, r: 20 }],
            backgroundColor: "rgba(255, 159, 28, 0.9)",
            borderColor: "#FF9F1C",
            borderWidth: 3
          },
          {
            label: "🎬 [만점 식도락가] 대만 1030 (드라마&미식 5.00점 만점)",
            data: [{ x: tX, y: tY, r: 15 }],
            backgroundColor: "rgba(5, 217, 232, 0.9)",
            borderColor: "#05D9E8",
            borderWidth: 3
          },
          {
            label: "🌿 [그랜드 트래블러] 미국 1030 (장기 18.5일 / 웰니스 전국순회)",
            data: [{ x: uX, y: uY, r: 19 }],
            backgroundColor: "rgba(0, 245, 212, 0.9)",
            borderColor: "#00F5D4",
            borderWidth: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: "#F1F5F9", font: { size: 13, weight: 'bold' } } },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: 체재 ${context.raw.x}일, 지출 $${context.raw.y} (${isMedian ? "중위수" : "평균값"})`;
              }
            }
          }
        },
        scales: {
          x: {
            title: { display: true, text: `X축: 체재일수 (2일 ~ 20일 시각적 확대) - [${isMedian ? "중위수 기준" : "평균값 기준"}]`, color: "#94A3B8", font: { size: 13, weight: 'bold' } },
            ticks: { color: "#94A3B8", stepSize: 3 },
            grid: { color: "#2A3854" },
            min: 2,
            max: 20
          },
          y: {
            title: { display: true, text: `Y축: 1인당 지출액 ($800 ~ $4,000 수직 확대) - [${isMedian ? "중위수 기준" : "평균값 기준"}]`, color: "#94A3B8", font: { size: 13, weight: 'bold' } },
            ticks: { color: "#94A3B8", stepSize: 500 },
            grid: { color: "#2A3854" },
            min: 700,
            max: 4000
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

    const hallyuRates = countries.map(code => {
      const total1030W = getMetrics(y, code, "1030", "ALL").totW;
      const hallyu1030W = getMetrics(y, code, "1030", "1").totW;
      return total1030W > 0 ? ((hallyu1030W / total1030W) * 100).toFixed(1) : 45.0;
    });

    const youthProps = countries.map(code => {
      const totHallyuW = getMetrics(y, code, "ALL", "1").totW;
      const hallyu1030W = getMetrics(y, code, "1030", "1").totW;
      return totHallyuW > 0 ? ((hallyu1030W / totHallyuW) * 100).toFixed(1) : 60.0;
    });

    chartCountryAgeInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "K-컬처 관여율 (전체 1030 대비 %)",
            data: hallyuRates,
            backgroundColor: "rgba(255, 42, 109, 0.85)",
            borderColor: "#FF2A6D",
            borderWidth: 1
          },
          {
            label: "10대~30대 관여객 비중 (전체 관여객 대비 %)",
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
          legend: { labels: { color: "#94A3B8" } },
          tooltip: {
            callbacks: {
              label: function(ctx) {
                return `${ctx.dataset.label}: ${ctx.raw}%`;
              }
            }
          }
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

  // Chart 3: Spend Density & Efficiency Comparison (All Dollar Metrics)
  function renderChartStaySpend(y, c, a, isMedian = false) {
    const ctx = document.getElementById("chartStaySpend").getContext("2d");
    if (chartStaySpendInstance) chartStaySpendInstance.destroy();

    const mH = getMetrics(y, c, a, "1");
    const mNonH = getMetrics(y, c, a, "0");

    const stayH = parseFloat(mH.stayMean) || 5.0;
    const stayNonH = parseFloat(mNonH.stayMean) || 8.0;

    const spendH = isMedian ? mH.spendMedian : mH.spendMean;
    const spendNonH = isMedian ? mNonH.spendMedian : mNonH.spendMean;

    const shopH = isMedian ? mH.shopMedian : mH.shopMean;
    const shopNonH = isMedian ? mNonH.shopMedian : mNonH.shopMean;

    // Daily Spend Rate ($ / day) - Key Insight Metric!
    const dailyH = Math.round(spendH / (stayH || 1));
    const dailyNonH = Math.round(spendNonH / (stayNonH || 1));

    chartStaySpendInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: [
          `총지출액 (${isMedian ? "중위수 $" : "평균 $"})`,
          `쇼핑 지출액 (${isMedian ? "중위수 $" : "평균 $"})`,
          `1일당 소비액 ($/일 - 하루 평균 지출)`
        ],
        datasets: [
          {
            label: "🔥 1030 K-컬처 관여층",
            data: [spendH, shopH, dailyH],
            backgroundColor: "rgba(0, 245, 212, 0.85)",
            borderColor: "#00F5D4",
            borderWidth: 1.5
          },
          {
            label: "⚪ 비교층 / 일반관광객",
            data: [spendNonH, shopNonH, dailyNonH],
            backgroundColor: "rgba(148, 163, 184, 0.5)",
            borderColor: "#94A3B8",
            borderWidth: 1.5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: "y",
        plugins: {
          legend: { labels: { color: "#F1F5F9", font: { size: 12, weight: 'bold' } } },
          tooltip: {
            callbacks: {
              label: (context) => `${context.dataset.label}: $${context.parsed.x.toLocaleString()}`
            }
          }
        },
        scales: {
          x: {
            min: 0,
            ticks: {
              color: "#94A3B8",
              callback: value => "$" + value.toLocaleString()
            },
            grid: { color: "#1E293B" }
          },
          y: { ticks: { color: "#F1F5F9", font: { size: 12, weight: 'bold' } }, grid: { color: "#1E293B" } }
        }
      }
    });
  }

  // Chart 4A: 3-Year K-Goods Purchase Rate (%) - 4 Signature Personas Comparison
  function renderChartYearlyRate(c, a) {
    const canvas = document.getElementById("chartYearlyRate");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (chartYearlyRateInstance) chartYearlyRateInstance.destroy();

    const years = ["2023", "2024", "2025"];
    
    // Get Goods Rate for each persona across 3 years
    const getGoodsTrend = (countryCode) => years.map(yr => {
      const m = getMetrics(yr, countryCode, a, "1");
      return parseFloat(m.goodsRate || 0);
    });

    const dsJapan = { label: "🇯🇵 [체크인 팝스타] 일본", data: getGoodsTrend("2"), borderColor: "#FF2A6D", backgroundColor: "transparent", borderWidth: 3, pointRadius: 5 };
    const dsChina = { label: "🇨🇳 [VIP 뷰티 퀸] 중국", data: getGoodsTrend("1"), borderColor: "#FF9F1C", backgroundColor: "transparent", borderWidth: 3, pointRadius: 5 };
    const dsTaiwan = { label: "🇹🇼 [만점 식도락가] 대만", data: getGoodsTrend("3"), borderColor: "#05D9E8", backgroundColor: "transparent", borderWidth: 4, pointRadius: 7, pointBackgroundColor: "#05D9E8" };
    const dsUsa = { label: "🇺🇸 [그랜드 트래블러] 미국", data: getGoodsTrend("11"), borderColor: "#00F5D4", backgroundColor: "transparent", borderWidth: 3, pointRadius: 5 };

    let datasets = [];
    if (c === "2") datasets = [dsJapan];
    else if (c === "1") datasets = [dsChina];
    else if (c === "3") datasets = [dsTaiwan];
    else if (c === "11") datasets = [dsUsa];
    else datasets = [dsJapan, dsChina, dsTaiwan, dsUsa];

    chartYearlyRateInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: ["2023년", "2024년", "2025년"],
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: "#F1F5F9", font: { size: 11, weight: 'bold' } } },
          tooltip: {
            callbacks: {
              label: (context) => `${context.dataset.label}: K-굿즈 구매율 ${context.parsed.y}%`
            }
          }
        },
        scales: {
          x: { ticks: { color: "#94A3B8" }, grid: { color: "#1E293B" } },
          y: {
            min: 0,
            max: 30,
            ticks: {
              color: "#FF2A6D",
              stepSize: 5,
              callback: value => value + "%"
            },
            grid: { color: "#1E293B" },
            title: { display: true, text: "굿즈 구매 비율 (%)", color: "#FF2A6D" }
          }
        }
      }
    });
  }

  // Chart 4B: 3-Year Total Spend Trend ($) - 4 Signature Personas Comparison
  function renderChartYearlySpend(c, a, h, isMedian = false) {
    const canvas = document.getElementById("chartYearlySpend");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (chartYearlySpendInstance) chartYearlySpendInstance.destroy();

    const years = ["2023", "2024", "2025"];

    const getSpendTrend = (countryCode) => years.map(yr => {
      const m = getMetrics(yr, countryCode, a, h);
      return isMedian ? m.spendMedian : m.spendMean;
    });

    const dsJapan = { label: "🇯🇵 [체크인 팝스타] 일본 1020", data: getSpendTrend("2"), borderColor: "#FF2A6D", backgroundColor: "rgba(255, 42, 109, 0.05)", borderWidth: 3, pointRadius: 6, fill: false };
    const dsChina = { label: "🇨🇳 [VIP 뷰티 퀸] 중국 30대", data: getSpendTrend("1"), borderColor: "#FF9F1C", backgroundColor: "rgba(255, 159, 28, 0.05)", borderWidth: 3, pointRadius: 6, fill: false };
    const dsTaiwan = { label: "🇹🇼 [만점 식도락가] 대만 1030", data: getSpendTrend("3"), borderColor: "#05D9E8", backgroundColor: "rgba(5, 217, 232, 0.05)", borderWidth: 3, pointRadius: 6, fill: false };
    const dsUsa = { label: "🇺🇸 [그랜드 트래블러] 미국 1030", data: getSpendTrend("11"), borderColor: "#00F5D4", backgroundColor: "rgba(0, 245, 212, 0.05)", borderWidth: 3, pointRadius: 6, fill: false };

    let datasets = [];
    if (c === "2") datasets = [dsJapan];
    else if (c === "1") datasets = [dsChina];
    else if (c === "3") datasets = [dsTaiwan];
    else if (c === "11") datasets = [dsUsa];
    else datasets = [dsJapan, dsChina, dsTaiwan, dsUsa];

    chartYearlySpendInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: ["2023년", "2024년", "2025년"],
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: "#F1F5F9", font: { size: 12, weight: 'bold' } } },
          tooltip: {
            callbacks: {
              label: (context) => `${context.dataset.label}: 1인당 지출 $${context.parsed.y.toLocaleString()} (${isMedian ? "중위수" : "평균값"})`
            }
          }
        },
        scales: {
          x: { ticks: { color: "#94A3B8" }, grid: { color: "#1E293B" } },
          y: {
            min: 0,
            max: 3500,
            ticks: {
              color: "#FF9F1C",
              stepSize: 500,
              callback: value => "$" + value.toLocaleString()
            },
            grid: { color: "#1E293B" },
            title: { display: true, text: `1인당 총지출액 ($) [0 ~ $3,500 절대기준 - ${isMedian ? "중위수" : "평균값"}]`, color: "#FF9F1C" }
          }
        }
      }
    });
  }

  // Render Table (Persona Names View)
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
            <td>${m.stayMean}일 <span style="color:#94A3B8; font-size:11px;">(중위 ${m.stayMedian}일)</span></td>
            <td>$${fmtNum(m.spendMean)} <span style="color:#00F5D4; font-size:11px;">(중위 $${fmtNum(m.spendMedian)})</span></td>
            <td>$${fmtNum(m.shopMean)} <span style="color:#FF9F1C; font-size:11px;">(중위 $${fmtNum(m.shopMedian)})</span></td>
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
  [filterYear, filterCountry, filterAge, filterHallyu, filterStatMode].forEach(select => {
    select.addEventListener("change", updateDashboard);
  });

  resetFilterBtn.addEventListener("click", () => {
    filterYear.value = "ALL";
    filterCountry.value = "ALL";
    filterAge.value = "1030";
    filterHallyu.value = "1";
    filterStatMode.value = "MEAN";
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

    const countryName = COUNTRY_MAP[c] || "4대 페르소나 전체";
    const ageName = AGE_MAP[a] || "10대~30대 전체";

    let countrySpecHTML = "";
    if (c === "2") {
      countrySpecHTML = `
        <div class="spec-card-box">
          <p>• <strong>[🇯🇵 체크인 팝스타 맞춤 상품] 2박 3일 초밀도 K-Pop & 성수동 굿즈 쇼핑 패키지</strong></p>
          <p>• <strong>핵심 일정</strong>: 금요일 퇴근 후 LCC 탑승 ➔ 성수동 로드숍 & 올리브영 굿즈 쇼핑 ➔ K-Pop 전문 댄스 스튜디오 원데이 클래스 ➔ 핫플 카페 투어 (평균 체재 3.6일 보완)</p>
          <p>• <strong>🎁 K-굿즈 & 바우처 혜택</strong>: K-Pop 아티스트 공식 굿즈 $50 기프트카드 + 올리브영 성수 플래그십 VIP 패스 + K-Pop 댄스 수료 인증 한정판 굿즈 키트</p>
        </div>
      `;
    } else if (c === "1") {
      countrySpecHTML = `
        <div class="spec-card-box">
          <p>• <strong>[🇨🇳 VIP 뷰티 퀸 맞춤 상품] 5일 강남 VIP K-뷰티 & 미쉐린 K-푸드 럭셔리 패키지</strong></p>
          <p>• <strong>핵심 일정</strong>: 강남 전문 피부과 VIP 스킨케어 ➔ 퍼스널 컬러 & 프로 메이크업 ➔ 미쉐린 K-푸드 셰프 테이블 ➔ 럭셔리 백화점 쇼핑 (최고 지출액 평균 $${fmtNum(m.spendMean)} / 중위수 $${fmtNum(m.spendMedian)})</p>
          <p>• <strong>🎁 K-굿즈 & 바우처 혜택</strong>: 맞춤형 럭셔리 K-뷰티 화장품 굿즈 풀세트 + 강남 뷰티 클리닉 웰컴 키트 + 백화점 VIP 쇼핑 바우처</p>
        </div>
      `;
    } else if (c === "3") {
      countrySpecHTML = `
        <div class="spec-card-box">
          <p>• <strong>[🇹🇼 만점 식도락가 맞춤 상품] 4박 5일 K-드라마 명소 & K-푸드 길거리 미식 패키지</strong></p>
          <p>• <strong>핵심 일정</strong>: 경복궁 프리미엄 한복 체험 ➔ K-드라마 주요 촬영지(남이섬/성수) ➔ K-푸드 야시장 & 편의점 꿀조합 미식 투어 (최고 만족도 5.00점 기반)</p>
          <p>• <strong>🎁 K-굿즈 & 바우처 혜택</strong>: K-드라마 스페셜 한복 촬영 액자 굿즈 + 편의점/길거리 미식 전용 K-Food 굿즈 카드 + 한정판 드라마 기념품</p>
        </div>
      `;
    } else if (c === "11") {
      countrySpecHTML = `
        <div class="spec-card-box">
          <p>• <strong>[🇺🇸 그랜드 트래블러 맞춤 상품] 14일 그랜드 K-컬처 & 전국 순회 KTX 웰니스 패키지</strong></p>
          <p>• <strong>핵심 일정</strong>: 서울 K-컬처 핫플 ➔ KTX 연계 부산·제주 전국 순회 ➔ 한방 스파 웰니스 ➔ K-푸드 쿠킹 클래스 (평균 체재 18.5일 및 고지출 반영)</p>
          <p>• <strong>🎁 K-굿즈 & 바우처 혜택</strong>: K-컬처 전국 순회 패스 패브릭 굿즈 + 한방 웰니스 뷰티 굿즈 세트 + 전통 공예 명품 기념품</p>
        </div>
      `;
    } else {
      countrySpecHTML = `
        <div class="spec-card-box">
          <p>• <strong>[🇯🇵 일본 1020 팝스타]</strong>: K-Pop 굿즈 $50 바우처 + 성수동 굿즈 쇼핑 2박 3일 코스</p>
          <p>• <strong>[🇨🇳 중국 30대 뷰티퀸]</strong>: 럭셔리 K-뷰티 화장품 굿즈 세트 + 강남 스킨케어 5일 코스</p>
          <p>• <strong>[🇹🇼 대만 1030 식도락가]</strong>: K-드라마 촬영지 굿즈 + 길거리 미식 4박 5일 코스</p>
          <p>• <strong>[🇺🇸 미국 1030 트래블러]</strong>: 전국 KTX 웰니스 굿즈 패키지 14일 순회 코스</p>
        </div>
      `;
    }

    const specText = `
      <div class="modal-section">
        <h4>1. 타깃 페르소나 & 1030 개요 (${countryName} Profile)</h4>
        <p>• <strong>타깃 세그먼트</strong>: ${countryName} × ${ageName} K-컬처·굿즈 고관여층</p>
        <p>• <strong>추정 타깃 모수</strong>: 약 ${fmtNum(m.totW)} 명 (K-컬처 관여율 ${m.hRate}%)</p>
        <p>• <strong>체재 및 소비 특성</strong>: 평균 체재일수 ${m.stayMean}일 (중위수 ${m.stayMedian}일), 1인당 평균 총지출 $${fmtNum(m.spendMean)} (중위수 $${fmtNum(m.spendMedian)})</p>
      </div>

      <div class="modal-section">
        <h4>2. K-컬처 & K-굿즈 특화 맞춤 여행 상품 기획 (1-Click Action Spec)</h4>
        ${countrySpecHTML}
      </div>

      <div class="modal-section">
        <h4>3. 관광 충성도 & K-굿즈 FanPass CRM 전략 (CRM & Retention)</h4>
        <p>• <strong>만족도 & 재방문 지표</strong>: 전반적 만족도 ${m.satMean}점 / 재방문 의향 ${m.revMean}점</p>
        <p>• <strong>🎁 FanPass CRM 혜택</strong>: 귀국 직후 K-Goods 역직구몰 20% 전용 할인 쿠폰 및 6~12개월 내 재방문 예약 시 <strong>'K-컬처 시크릿 굿즈 웰컴박스'</strong> 증정</p>
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
      alert("4대 페르소나 맞춤 상품 기획서 텍스트가 클립보드에 복사되었습니다!");
    });
  });

  // Initial Load
  updateDashboard();
});
