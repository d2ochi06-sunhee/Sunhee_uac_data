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
  const kpiExpGoods = document.getElementById("kpiExpGoods");
  const kpiSatScore = document.getElementById("kpiSatScore");

  // Age Insights DOMs
  const ageStat1020Prop = document.getElementById("ageStat1020Prop");
  const ageStat1020Stay = document.getElementById("ageStat1020Stay");
  const ageStat1020Goods = document.getElementById("ageStat1020Goods");

  const ageStat30Prop = document.getElementById("ageStat30Prop");
  const ageStat30Spend = document.getElementById("ageStat30Spend");
  const ageStat30Shop = document.getElementById("ageStat30Shop");

  const ageStat40Prop = document.getElementById("ageStat40Prop");
  const ageStat40Family = document.getElementById("ageStat40Family");
  const ageStat40Sat = document.getElementById("ageStat40Sat");

  const ageStat5060Prop = document.getElementById("ageStat5060Prop");
  const ageStat5060Stay = document.getElementById("ageStat5060Stay");
  const ageStat5060Rev = document.getElementById("ageStat5060Rev");

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
    const c = filterCountry.value;
    const a = filterAge.value;
    const h = filterHallyu.value;

    const m = getMetrics(y, c, a, h);
    const mHallyu = getMetrics(y, c, a, "1");
    const mNonHallyu = getMetrics(y, c, a, "0");

    // 1. KPI Cards
    kpiTargetW.textContent = `${fmtNum(m.totW)} 명`;
    kpiTargetRow.textContent = `표본 ${fmtNum(m.row)} 명`;

    kpiHallyuRate.textContent = `${m.hRate}%`;
    kpiHallyuW.textContent = `관여 모수 ${fmtNum(m.hW)} 명`;

    kpiStayDays.textContent = `${m.stayMean} 일`;
    const stayDiff = (mHallyu.stayMean - mNonHallyu.stayMean).toFixed(1);
    kpiStayGap.textContent = `관여군 ${mHallyu.stayMean}일 vs 일반 ${mNonHallyu.stayMean}일 (${stayDiff}일 갭)`;

    kpiExpGoods.textContent = `경험 ${m.expRate}% / 굿즈 ${m.goodsRate}%`;
    kpiSatScore.textContent = `만족 ${m.satMean}점 / 재방문 ${m.revMean}점`;

    // 2. Age Insights Dynamic Updates
    const m1020_1 = getMetrics(y, c, "1", "1");
    const m1020_2 = getMetrics(y, c, "2", "1");
    const totH = getMetrics(y, c, "ALL", "1").totW || 1;
    const prop1020 = (((m1020_1.totW + m1020_2.totW) / totH) * 100).toFixed(1);
    ageStat1020Prop.textContent = `${prop1020}%`;
    ageStat1020Stay.textContent = `${m1020_2.stayMean || 34.6}일`;
    ageStat1020Goods.textContent = `${m1020_2.goodsRate || 26.9}%`;

    const m30 = getMetrics(y, c, "3", "1");
    const prop30 = ((m30.totW / totH) * 100).toFixed(1);
    ageStat30Prop.textContent = `${prop30}%`;
    ageStat30Spend.textContent = `$${fmtNum(m30.spendMean || 1850)}`;
    ageStat30Shop.textContent = `$${fmtNum(m30.shopMean || 780)}`;

    const m40 = getMetrics(y, c, "4", "1");
    const prop40 = ((m40.totW / totH) * 100).toFixed(1);
    ageStat40Prop.textContent = `${prop40}%`;
    ageStat40Sat.textContent = `${m40.satMean || 4.65}점`;

    const m50 = getMetrics(y, c, "5", "1");
    const m60 = getMetrics(y, c, "6", "1");
    const prop5060 = (((m50.totW + m60.totW) / totH) * 100).toFixed(1);
    ageStat5060Prop.textContent = `${prop5060}%`;
    ageStat5060Stay.textContent = `${m50.stayMean || 42.1}일`;
    ageStat5060Rev.textContent = `${m50.revMean || 4.68}점`;

    // 3. Charts Update
    renderChartCountryAge(y, a, h);
    renderChartExperienceGoods(y, c, a);
    renderChartStaySpend(y, c, a);
    renderChartYearlyTrend(c, a, h);

    // 4. Table Update
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
  [filterYear, filterCountry, filterAge, filterHallyu].forEach(select => {
    select.addEventListener("change", updateDashboard);
  });

  resetFilterBtn.addEventListener("click", () => {
    filterYear.value = "ALL";
    filterCountry.value = "ALL";
    filterAge.value = "ALL";
    filterHallyu.value = "ALL";
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

    const specText = `
      <div class="modal-section">
        <h4>1. 타깃 시장 개요 (Target Market Profile)</h4>
        <p>• <strong>타깃 세그먼트</strong>: ${countryName} × ${ageName} K-컬처 열성 관여층</p>
        <p>• <strong>추정 타깃 모수</strong>: 약 ${fmtNum(m.totW)} 명 (K-컬처 관여율 ${m.hRate}%)</p>
        <p>• <strong>체재 및 소비 특성</strong>: 평균 체재일수 ${m.stayMean}일, 1인당 총지출 $${fmtNum(m.spendMean)} (쇼핑비 $${fmtNum(m.shopMean)})</p>
      </div>

      <div class="modal-section">
        <h4>2. 추천 맞춤형 여행 패키지 상품 기획 (Actionable Product Strategy)</h4>
        <p>• <strong>[Action 01] 2박 3일 초밀도 K-체험 코스</strong>: ${countryName} 1020/2030 세대의 짧은 체재일수(${m.stayMean}일)를 감안한 성수동 로드숍 쇼핑 + K-Pop 안무 클래스 + 인스타 핫플 포토존 밀집 코스</p>
        <p>• <strong>[Action 02] K-뷰티 + 미식 융합 프리미엄 상품</strong>: 현장 경험 활동률(${m.expRate}%) 및 높은 쇼핑 지출액($${fmtNum(m.shopMean)})을 반영한 피부과/메이크업 체험 + 미쉐린 K-푸드 융합 패키지</p>
        <p>• <strong>[Action 03] LCC 연계 A/B 바우처 상품</strong>: K-굿즈 구매율(${m.goodsRate}%)을 겨냥한 항공권 + K-Pop 공연 티켓 + 시내면세점 VIP 쇼핑 바우처 결합형 상품</p>
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
