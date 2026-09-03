// Interactive Dashboard Controller
document.addEventListener('DOMContentLoaded', () => {
  // Global Chart instances
  let chartCountryAge = null;
  let chartVisitSpend = null;
  let chartAgeDistribution = null;
  let chartClusterScatter = null;

  // DOM Elements
  const filterYear = document.getElementById('filterYear');
  const filterCountry = document.getElementById('filterCountry');
  const filterVisit = document.getElementById('filterVisit');
  const filterAge = document.getElementById('filterAge');
  const resetFilterBtn = document.getElementById('resetFilterBtn');

  // Age label mapping
  const ageLabels = {
    '1': '10대 (15-19세)',
    '2': '20대',
    '3': '30대',
    '4': '40대',
    '5': '50대',
    '6': '60세 이상'
  };

  // Country label mapping
  const countryLabels = {
    'ALL': '전체 국가',
    '1': '중국 (China)',
    '2': '일본 (Japan)',
    '3': '대만 (Taiwan)',
    '4': '홍콩 (Hong Kong)',
    '5': '태국 (Thailand)',
    '7': '싱가포르 (Singapore)',
    '11': '미국 (USA)'
  };

  // Helper formatting functions
  function formatNumber(num) {
    return Math.round(num).toLocaleString('ko-KR');
  }

  function formatCurrency(num) {
    return '$' + Math.round(num).toLocaleString('en-US');
  }

  // Calculate filtered stats from WINDOW.DASHBOARD_DATA
  function getFilteredCellData(year, country, visit, age) {
    const dataStore = window.DASHBOARD_DATA;
    if (!dataStore || !dataStore[year]) return null;

    const yrStore = dataStore[year];
    const nKey = yrStore[country] ? country : 'ALL';
    
    if (yrStore[nKey]) {
      if (yrStore[nKey][visit] && yrStore[nKey][visit][age]) {
        return yrStore[nKey][visit][age];
      }
      if (yrStore[nKey][visit] && yrStore[nKey][visit]['ALL']) {
        return yrStore[nKey][visit]['ALL'];
      }
      if (yrStore[nKey]['ALL'] && yrStore[nKey]['ALL'][age]) {
        return yrStore[nKey]['ALL'][age];
      }
      if (yrStore[nKey]['ALL'] && yrStore[nKey]['ALL']['ALL']) {
        return yrStore[nKey]['ALL']['ALL'];
      }
    }
    return null;
  }

  // Update KPI Cards
  function updateKPIs() {
    const yr = filterYear.value;
    const nat = filterCountry.value;
    const visit = filterVisit.value;
    const age = filterAge.value;

    const cell = getFilteredCellData(yr, nat, visit, age);

    if (cell) {
      document.getElementById('kpiTotalVisitors').textContent = formatNumber(cell.totW) + ' 명';
      document.getElementById('kpiTotalRows').textContent = `표본 ${formatNumber(cell.row)} 행`;

      document.getElementById('kpiGoodsBuyers').textContent = formatNumber(cell.gW) + ' 명';
      const goodsPct = cell.totW > 0 ? ((cell.gW / cell.totW) * 100).toFixed(1) : '0.0';
      document.getElementById('kpiGoodsRate').textContent = `구매율 ${goodsPct}%`;

      document.getElementById('kpiRepeatRate').textContent = cell.totW > 0 ? ((cell.repW / cell.totW) * 100).toFixed(1) + '%' : '0.0%';
      document.getElementById('kpiRepeatVisitors').textContent = `재방문객 ${formatNumber(cell.repW)} 명`;

      document.getElementById('kpiSpendMedian').textContent = formatCurrency(cell.tMed);
      document.getElementById('kpiSpendMean').textContent = `평균 ${formatCurrency(cell.tMean)}`;

      document.getElementById('kpiShopMedian').textContent = formatCurrency(cell.sMed);
      document.getElementById('kpiShopMean').textContent = `평균 ${formatCurrency(cell.sMean)}`;
    }

    // Update First vs Repeat Comparison Hero Cards
    const firstCell = getFilteredCellData(yr, nat, 'First', age);
    const repeatCell = getFilteredCellData(yr, nat, 'Repeat', age);

    const fW = firstCell ? firstCell.totW : 0;
    const fgW = firstCell ? firstCell.gW : 0;
    const fRate = fW > 0 ? ((fgW / fW) * 100).toFixed(1) : '0.0';

    const rW = repeatCell ? repeatCell.totW : 0;
    const rgW = repeatCell ? repeatCell.gW : 0;
    const rRate = rW > 0 ? ((rgW / rW) * 100).toFixed(1) : '0.0';

    const diffRate = (parseFloat(rRate) - parseFloat(fRate)).toFixed(1);
    const diffCount = Math.round(rgW - fgW);

    document.getElementById('compFirstGoodsRate').textContent = `${fRate}%`;
    document.getElementById('kpiFirstGoodsCount').textContent = `추정 ${formatNumber(fgW)} 명 (전체 ${formatNumber(fW)} 명 중)`;

    document.getElementById('compRepeatGoodsRate').textContent = `${rRate}%`;
    document.getElementById('kpiRepeatGoodsCount').textContent = `추정 ${formatNumber(rgW)} 명 (전체 ${formatNumber(rW)} 명 중)`;

    const signRate = parseFloat(diffRate) >= 0 ? '+' : '';
    const signCount = diffCount >= 0 ? '+' : '';
    document.getElementById('compGoodsDiff').textContent = `${signRate}${diffRate}%p`;
    document.getElementById('compGoodsCountDiff').textContent = `구매 인원 ${signCount}${formatNumber(diffCount)} 명 ${diffCount >= 0 ? '증가' : '감소'}`;
  }

  // Global Chart instance for comparison
  let chartFirstVsRepeatAgeGoods = null;

  // Render Dedicated First vs Repeat Goods Comparison Chart (Side-by-Side)
  function renderChartFirstVsRepeatAgeGoods() {
    const yr = filterYear.value;
    const nat = filterCountry.value;

    const ageKeys = ['1', '2', '3', '4', '5', '6'];
    const labels = ageKeys.map(a => ageLabels[a]);

    const firstRates = [];
    const repeatRates = [];

    ageKeys.forEach(a => {
      const fCell = getFilteredCellData(yr, nat, 'First', a);
      const rCell = getFilteredCellData(yr, nat, 'Repeat', a);

      const fR = (fCell && fCell.totW > 0) ? ((fCell.gW / fCell.totW) * 100).toFixed(1) : 0;
      const rR = (rCell && rCell.totW > 0) ? ((rCell.gW / rCell.totW) * 100).toFixed(1) : 0;

      firstRates.push(fR);
      repeatRates.push(rR);
    });

    const ctx = document.getElementById('chartFirstVsRepeatAgeGoods').getContext('2d');
    if (chartFirstVsRepeatAgeGoods) chartFirstVsRepeatAgeGoods.destroy();

    chartFirstVsRepeatAgeGoods = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: '🔴 첫 방문객 굿즈 구매율 (%)',
            data: firstRates,
            backgroundColor: 'rgba(236, 72, 153, 0.75)',
            borderColor: '#ec4899',
            borderWidth: 1.5
          },
          {
            label: '🔵 재방문객 굿즈 구매율 (%)',
            data: repeatRates,
            backgroundColor: 'rgba(59, 130, 246, 0.75)',
            borderColor: '#3b82f6',
            borderWidth: 1.5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#f8fafc', font: { family: 'Pretendard' } } },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.raw}%`;
              }
            }
          }
        },
        scales: {
          x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' }, title: { display: true, text: '구매율 (%)', color: '#94a3b8' } }
        }
      }
    });
  }

  // Render Chart 1: Country Comparison Chart
  function renderChartCountryAge() {
    const yr = filterYear.value;
    const visit = filterVisit.value;
    const age = filterAge.value;

    const targetCountries = ['1', '2', '3', '4', '5', '7', '11'];
    const labels = targetCountries.map(c => countryLabels[c].split(' ')[0]);
    const goodsWData = [];
    const goodsRateData = [];

    targetCountries.forEach(c => {
      const cell = getFilteredCellData(yr, c, visit, age);
      if (cell) {
        goodsWData.push(Math.round(cell.gW));
        const rate = cell.totW > 0 ? ((cell.gW / cell.totW) * 100).toFixed(1) : 0;
        goodsRateData.push(rate);
      } else {
        goodsWData.push(0);
        goodsRateData.push(0);
      }
    });

    const ctx = document.getElementById('chartCountryAge').getContext('2d');
    if (chartCountryAge) chartCountryAge.destroy();

    chartCountryAge = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'K-굿즈 구매 인원 (명)',
            data: goodsWData,
            backgroundColor: 'rgba(236, 72, 153, 0.65)',
            borderColor: '#ec4899',
            borderWidth: 1.5,
            yAxisID: 'y'
          },
          {
            label: 'K-굿즈 구매율 (%)',
            data: goodsRateData,
            type: 'line',
            borderColor: '#3b82f6',
            backgroundColor: '#3b82f6',
            borderWidth: 3,
            pointRadius: 5,
            pointHoverRadius: 7,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#f8fafc', font: { family: 'Pretendard' } } }
        },
        scales: {
          x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: {
            type: 'linear',
            position: 'left',
            ticks: { color: '#94a3b8' },
            grid: { color: 'rgba(255,255,255,0.05)' },
            title: { display: true, text: '구매 인원 (명)', color: '#ec4899' }
          },
          y1: {
            type: 'linear',
            position: 'right',
            ticks: { color: '#94a3b8' },
            grid: { drawOnChartArea: false },
            title: { display: true, text: '구매율 (%)', color: '#3b82f6' }
          }
        }
      }
    });
  }

  // Render Chart 2: First vs Repeat Spend Comparison
  function renderChartVisitSpend() {
    const yr = filterYear.value;
    const nat = filterCountry.value;
    const age = filterAge.value;

    const firstCell = getFilteredCellData(yr, nat, 'First', age);
    const repeatCell = getFilteredCellData(yr, nat, 'Repeat', age);

    const labels = ['🔴 첫 방문객', '🔵 재방문객'];
    const totalSpendData = [firstCell ? firstCell.tMed : 0, repeatCell ? repeatCell.tMed : 0];
    const shopSpendData = [firstCell ? firstCell.sMed : 0, repeatCell ? repeatCell.sMed : 0];
    const goodsSpendData = [firstCell ? firstCell.gtMed : 0, repeatCell ? repeatCell.gtMed : 0];

    const ctx = document.getElementById('chartVisitSpend').getContext('2d');
    if (chartVisitSpend) chartVisitSpend.destroy();

    chartVisitSpend = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: '1인당 총 지출액 중위값 ($)',
            data: totalSpendData,
            backgroundColor: 'rgba(59, 130, 246, 0.75)',
            borderColor: '#3b82f6',
            borderWidth: 1.5
          },
          {
            label: '1인당 쇼핑비 중위값 ($)',
            data: shopSpendData,
            backgroundColor: 'rgba(16, 185, 129, 0.75)',
            borderColor: '#10b981',
            borderWidth: 1.5
          },
          {
            label: '굿즈 구매자 총지출 중위값 ($)',
            data: goodsSpendData,
            backgroundColor: 'rgba(236, 72, 153, 0.75)',
            borderColor: '#ec4899',
            borderWidth: 1.5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#f8fafc', font: { family: 'Pretendard' } } }
        },
        scales: {
          x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' }, title: { display: true, text: '금액 ($ USD)', color: '#94a3b8' } }
        }
      }
    });
  }

  // Render Chart 3: Age Group Breakdown (10s to 60s+)
  function renderChartAgeDistribution() {
    const yr = filterYear.value;
    const nat = filterCountry.value;
    const visit = filterVisit.value;

    const ageKeys = ['1', '2', '3', '4', '5', '6'];
    const labels = ageKeys.map(a => ageLabels[a]);
    const goodsWData = [];
    const goodsRateData = [];

    ageKeys.forEach(a => {
      const cell = getFilteredCellData(yr, nat, visit, a);
      if (cell) {
        goodsWData.push(Math.round(cell.gW));
        const rate = cell.totW > 0 ? ((cell.gW / cell.totW) * 100).toFixed(1) : 0;
        goodsRateData.push(rate);
      } else {
        goodsWData.push(0);
        goodsRateData.push(0);
      }
    });

    const ctx = document.getElementById('chartAgeDistribution').getContext('2d');
    if (chartAgeDistribution) chartAgeDistribution.destroy();

    chartAgeDistribution = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: '연령대별 굿즈 구매 인원 (명)',
            data: goodsWData,
            backgroundColor: 'rgba(168, 85, 247, 0.65)',
            borderColor: '#a855f7',
            borderWidth: 1.5,
            yAxisID: 'y'
          },
          {
            label: '연령대 내 굿즈 구매율 (%)',
            data: goodsRateData,
            type: 'line',
            borderColor: '#f59e0b',
            backgroundColor: '#f59e0b',
            borderWidth: 3,
            pointRadius: 5,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#f8fafc', font: { family: 'Pretendard' } } }
        },
        scales: {
          x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: {
            type: 'linear',
            position: 'left',
            ticks: { color: '#94a3b8' },
            grid: { color: 'rgba(255,255,255,0.05)' }
          },
          y1: {
            type: 'linear',
            position: 'right',
            ticks: { color: '#94a3b8' },
            grid: { drawOnChartArea: false }
          }
        }
      }
    });
  }

  // Render Chart 4: K-Means Scatter Plot (Spending vs Repeat Rate)
  function renderChartClusterScatter() {
    const clusters = [
      { name: '클러스터 1: 단골 2030 자유여행 팬덤', x: 1145.4, y: 100.0, r: 28, color: '#ec4899', pop: '80.4만 명 (53.6%)' },
      { name: '클러스터 2: 신규 입덕 Z세대 자유여행층', x: 989.8, y: 0.0, r: 20, color: '#f59e0b', pop: '39.4만 명 (26.2%)' },
      { name: '클러스터 3: 패키지/에어텔 동반 팬덤층', x: 850.0, y: 65.0, r: 16, color: '#3b82f6', pop: '23.5만 명 (15.6%)' },
      { name: '클러스터 4: 하이엔드 VVIP 고액 소비층', x: 5202.2, y: 78.3, r: 12, color: '#a855f7', pop: '6.8만 명 (4.5%)' }
    ];

    const ctx = document.getElementById('chartClusterScatter').getContext('2d');
    if (chartClusterScatter) chartClusterScatter.destroy();

    chartClusterScatter = new Chart(ctx, {
      type: 'bubble',
      data: {
        datasets: clusters.map(c => ({
          label: c.name,
          data: [{ x: c.x, y: c.y, r: c.r }],
          backgroundColor: c.color + 'aa',
          borderColor: c.color,
          borderWidth: 2
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#f8fafc', font: { family: 'Pretendard' } } },
          tooltip: {
            callbacks: {
              label: function(context) {
                const c = clusters[context.datasetIndex];
                return `${c.name}: 총지출 중위값 $${c.x}, 재방문율 ${c.y}%, 인원 ${c.pop}`;
              }
            }
          }
        },
        scales: {
          x: {
            ticks: { color: '#94a3b8' },
            grid: { color: 'rgba(255,255,255,0.05)' },
            title: { display: true, text: '1인당 총지출액 중위값 ($)', color: '#94a3b8' }
          },
          y: {
            ticks: { color: '#94a3b8' },
            grid: { color: 'rgba(255,255,255,0.05)' },
            title: { display: true, text: '재방문율 (%)', color: '#94a3b8' },
            min: -10,
            max: 110
          }
        }
      }
    });
  }

  // Render Table
  function renderTable() {
    const yr = filterYear.value;
    const nat = filterCountry.value;
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';

    const ageKeys = ['1', '2', '3', '4', '5', '6'];
    const visitTypes = [
      { key: 'First', label: '첫 방문객', badgeClass: 'badge-first' },
      { key: 'Repeat', label: '재방문객', badgeClass: 'badge-repeat' }
    ];

    ageKeys.forEach(a => {
      visitTypes.forEach(v => {
        const cell = getFilteredCellData(yr, nat, v.key, a);
        if (cell && cell.row > 0) {
          const goodsRate = cell.totW > 0 ? ((cell.gW / cell.totW) * 100).toFixed(1) : '0.0';
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td><strong>${ageLabels[a]}</strong></td>
            <td><span class="${v.badgeClass}">${v.label}</span></td>
            <td>${formatNumber(cell.row)}행</td>
            <td>${formatNumber(cell.totW)}명</td>
            <td>${formatNumber(cell.gW)}명</td>
            <td><strong>${goodsRate}%</strong></td>
            <td>${formatCurrency(cell.tMed)}</td>
            <td>${formatCurrency(cell.sMed)}</td>
            <td><strong>${formatCurrency(cell.gtMed)}</strong></td>
          `;
          tableBody.appendChild(tr);
        }
      });
    });
  }

  // Update All Components
  function updateDashboard() {
    updateKPIs();
    renderChartFirstVsRepeatAgeGoods();
    renderChartCountryAge();
    renderChartVisitSpend();
    renderChartAgeDistribution();
    renderChartClusterScatter();
    renderTable();
  }

  // Event Listeners
  filterYear.addEventListener('change', updateDashboard);
  filterCountry.addEventListener('change', updateDashboard);
  filterVisit.addEventListener('change', updateDashboard);
  filterAge.addEventListener('change', updateDashboard);

  resetFilterBtn.addEventListener('click', () => {
    filterYear.value = '2025';
    filterCountry.value = 'ALL';
    filterVisit.value = 'ALL';
    filterAge.value = 'ALL';
    updateDashboard();
  });

  // Initial Load
  updateDashboard();
});
