// Travel Agency Target Marketing & Product Planning Dashboard Controller
document.addEventListener("DOMContentLoaded", () => {
  const data = window.TRAVEL_DATA;
  if (!data) {
    console.error("TRAVEL_DATA is not loaded!");
    return;
  }

  // Country Map & Age Map
  const COUNTRY_MAP = {
    "ALL": "전체 국가",
    "2": "🇯🇵 일본",
    "1": "🇨🇳 중국",
    "3": "🇹🇼 대만",
    "4": "🇭🇰 홍콩",
    "5": "🇹🇭 태국",
    "7": "🇸🇬 싱가포르",
    "11": "🇺🇸 미국"
  };

  const AGE_MAP = {
    "ALL": "전 연령대",
    "1": "10대 (15-19세)",
    "2": "20대",
    "3": "30대",
    "4": "40대",
    "5": "50대",
    "6": "60세 이상"
  };

  // DOM Elements
  const filterYear = document.getElementById("filterYear");
  const filterMarket = document.getElementById("filterMarket");
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

  // Dual Market Buttons
  const btnSelectMarketAsia = document.getElementById("btnSelectMarketAsia");
  const btnSelectMarketUsa = document.getElementById("btnSelectMarketUsa");

  // Action Cards DOMs
  const generateSpecBtn = document.getElementById("generateSpecBtn");
  const specModal = document.getElementById("specModal");
  const specModalBody = document.getElementById("specModalBody");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const closeModalBtn2 = document.getElementById("closeModalBtn2");
  const copySpecBtn = document.getElementById("copySpecBtn");
  const exportCsvBtn = document.getElementById("exportCsvBtn");
  const tableBody = document.getElementById("tableBody");

  // Action Cards
  const action1Card = document.getElementById("action1Card");
  const action2Card = document.getElementById("action2Card");
  const action3Card = document.getElementById("action3Card");
  const action4Card = document.getElementById("action4Card");

  // Chart Instances
  let chartCountryAgeInstance = null;
  let chartExperienceGoodsInstance = null;
  let chartStaySpendInstance = null;
  let chartYearlyTrendInstance = null;

  // Format Helper
  const fmtNum = (n) => Math.round(n).toLocaleString("ko-KR");

  // Get current metrics helper
  function getMetrics(y = filterYear.value, c = filterCountry.value, a = filterAge.value, h = filterHallyu.value) {
    try {
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
    const mkt = filterMarket.value;
    let c = filterCountry.value;
    const a = filterAge.value;
    const h = filterHallyu.value;

    if (mkt === "ASIA" && c === "ALL") c = "2"; // Default Japan for Asia market
    if (mkt === "USA" && c === "ALL") c = "11"; // Default USA for USA market

    const m = getMetrics(y, c, a, h);
    const mHallyu = getMetrics(y, c, a, "1");
    const mNonHallyu = getMetrics(y, c, a, "0");

    // 1. KPI Cards
    kpiTargetW.textContent = `${fmtNum(m.totW)} 명`;
    kpiTargetRow.textContent = `표본 ${fmtNum(m.row)} 명`;

    kpiHallyuRate.textContent = `${m.hRate}%`;
    kpiHallyuW.textContent = `관여 모수 ${fmtNum(m.hW)} 명`;

    kpiStayDays.textContent = `${m.stayMean} 일`;
    if (c === "11") {
      kpiStayGap.textContent = `미국 장기 방한 (평균 ${m.stayMean}일 체재)`;
    } else {
      const stayDiff = (mHallyu.stayMean - mNonHallyu.stayMean).toFixed(1);
      kpiStayGap.textContent = `관여군 ${mHallyu.stayMean}일 vs 일반 ${mNonHallyu.stayMean}일 (${stayDiff}일 갭)`;
    }

    kpiSpendMean.textContent = `$${fmtNum(m.spendMean)}`;
    kpiShopMean.textContent = `1인당 쇼핑비 $${fmtNum(m.shopMean)}`;
    kpiSatScore.textContent = `만족 ${m.satMean}점 / 재방문 ${m.revMean}점`;

    // 2. Charts Update
    renderChartCountryAge(y, a, h);
    renderChartExperienceGoods(y, c, a);
    renderChartStaySpend(y, c, a);
    renderChartYearlyTrend(c, a, h);

    // 3. Table Update
    renderTable(y, c, a, h);
  }

  // Chart 1: Country x Age Segment
  function renderChartCountryAge(y, a, h) {
    const ctx = document.getElementById("chartCountryAge").getContext("2d");
    if (chartCountryAgeInstance) chartCountryAgeInstance.destroy();

    const countries = ["2", "1", "3", "4", "5", "7", "11"];
    const labels = countries.map(code => COUNTRY_MAP[code]);
    const hallyuRates = countries.map(code => getMetrics(y, code, a, h).hRate);
    const youthProps = countries.map(code => {
      const tot = getMetrics(y, code, "ALL", h).totW;
      const youth = (getMetrics(y, code, "1", h).totW || 0) + (getMetrics(y, code, "2", h).totW || 0);
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
            label: "1020 청년층 비중 (%)",
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
            label: "🔥 K-컬처 관여층 (영향군)",
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
            label: "🔥 K-컬처 관여층",
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
            label: "K-컬처 관여율 (%)",
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

  // Render Table
  function renderTable(y, c, a, h) {
    tableBody.innerHTML = "";
    const countries = c === "ALL" ? ["2", "1", "3", "4", "5", "7", "11"] : [c];
    const ages = a === "ALL" ? ["1", "2", "3", "4", "5", "6"] : [a];
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
  [filterYear, filterMarket, filterCountry, filterAge, filterHallyu].forEach(select => {
    select.addEventListener("change", updateDashboard);
  });

  resetFilterBtn.addEventListener("click", () => {
    filterYear.value = "ALL";
    filterMarket.value = "ALL";
    filterCountry.value = "ALL";
    filterAge.value = "ALL";
    filterHallyu.value = "ALL";
    updateDashboard();
  });

  // Dual Market Buttons
  btnSelectMarketAsia.addEventListener("click", () => {
    filterMarket.value = "ASIA";
    filterCountry.value = "2"; // 日本
    filterAge.value = "2"; // 20대
    filterHallyu.value = "1";
    updateDashboard();
  });

  btnSelectMarketUsa.addEventListener("click", () => {
    filterMarket.value = "USA";
    filterCountry.value = "11"; // 미국
    filterAge.value = "ALL";
    filterHallyu.value = "1";
    updateDashboard();
  });

  // Action Cards Click Actions
  action1Card.addEventListener("click", () => {
    filterCountry.value = "2"; // 일본
    filterAge.value = "2"; // 20대
    filterHallyu.value = "1";
    updateDashboard();
  });

  action2Card.addEventListener("click", () => {
    filterCountry.value = "1"; // 중국
    filterAge.value = "3"; // 30대
    filterHallyu.value = "1";
    updateDashboard();
  });

  action3Card.addEventListener("click", () => {
    filterHallyu.value = "1";
    updateDashboard();
  });

  action4Card.addEventListener("click", () => {
    filterHallyu.value = "1";
    updateDashboard();
  });

  // Generate Product Spec Modal
  generateSpecBtn.addEventListener("click", () => {
    const y = filterYear.value;
    const c = filterCountry.value;
    const a = filterAge.value;
    const m = getMetrics(y, c, a, "1");

    const countryName = COUNTRY_MAP[c] || "전체 타깃 국가";
    const ageName = AGE_MAP[a] || "전 연령대";

    let marketSpecStrategy = "";
    if (c === "11") {
      marketSpecStrategy = `
        <p>• <strong>[Market B: 미주 장거리 특화 전략] 14일 그랜드 K-컬처 & 웰니스 투어</strong>: 평균 체재일수 ${m.stayMean}일 및 높은 총지출($${fmtNum(m.spendMean)})을 고려하여 서울-부산-제주 KTX 연계 교통권 + 한방 스파 + K-푸드 쿠킹클래스 융합 상품</p>
      `;
    } else {
      marketSpecStrategy = `
        <p>• <strong>[Market A: 아시아 근거리 특화 전략] 2박 3일 초밀도 K-체험 코스</strong>: ${countryName} 세대의 짧은 체재일수(${m.stayMean}일)를 감안한 성수동 로드숍 쇼핑 + K-Pop 안무 클래스 + 올리브영 쇼핑 바우처 결합 코스</p>
        <p>• <strong>[Market A 프리미엄] K-뷰티 + 미식 융합 상품</strong>: 높은 쇼핑 지출액($${fmtNum(m.shopMean)})을 겨냥한 강남 피부과/메이크업 체험 + 미쉐린 K-푸드 패키지</p>
      `;
    }

    const specText = `
      <div class="modal-section">
        <h4>1. 타깃 시장 개요 (Target Market Profile)</h4>
        <p>• <strong>타깃 세그먼트</strong>: ${countryName} × ${ageName} K-컬처 열성 관여층</p>
        <p>• <strong>추정 타깃 모수</strong>: 약 ${fmtNum(m.totW)} 명 (K-컬처 관여율 ${m.hRate}%)</p>
        <p>• <strong>체재 및 소비 특성</strong>: 평균 체재일수 ${m.stayMean}일, 1인당 총지출 $${fmtNum(m.spendMean)} (쇼핑비 $${fmtNum(m.shopMean)})</p>
      </div>

      <div class="modal-section">
        <h4>2. 맞춤형 여행 패키지 상품 기획 (Market Strategy)</h4>
        ${marketSpecStrategy}
        <p>• <strong>LCC & 항공 결합 바우처</strong>: K-굿즈 구매율(${m.goodsRate}%) 및 현장경험률(${m.expRate}%)을 반영한 공연 티켓 + 시내면세점 VIP 쇼핑 바우처 결합</p>
      </div>

      <div class="modal-section">
        <h4>3. 관광 충성도 & 후속 CRM 제안 (CRM & Retention)</h4>
        <p>• <strong>만족도 & 재방문 지표</strong>: 전반적 만족도 ${m.satMean}점 / 재방문 의향 ${m.revMean}점 / 타인 추천 ${m.recMean}점</p>
        <p>• <strong>후속 CRM 액션</strong>: 높은 추천 및 재방문 의향을 바탕으로 귀국 후 K-굿즈 신상 쿠폰 및 2차 방한 전용 시크릿 할인 코드 제공</p>
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
      alert("여행 상품 기획서 텍스트가 클립보드에 복사되었습니다!");
    });
  });

  // Initial Load
  updateDashboard();
});
