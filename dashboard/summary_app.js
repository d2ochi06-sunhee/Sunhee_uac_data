// Executive Summary Dashboard Controller
document.addEventListener('DOMContentLoaded', () => {
  renderChartTrend3Years();
  renderChartFirstVsRepeatGoods();
  renderChartAgeDiversification();
  renderChartKMeansScatter();
});

// Chart 1: 3-Year Trend of Repeat Visitors Buying K-Goods
function renderChartTrend3Years() {
  const ctx = document.getElementById('chartTrend3Years').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['2023년', '2024년', '2025년'],
      datasets: [
        {
          label: '재방문 K-굿즈 구매자 수 (만 명)',
          data: [19.8, 87.9, 130.1],
          borderColor: '#ec4899',
          backgroundColor: 'rgba(236, 72, 153, 0.15)',
          fill: true,
          borderWidth: 3,
          pointRadius: 6,
          pointBackgroundColor: '#ec4899',
          yAxisID: 'y'
        },
        {
          label: '재방문객 중 K-굿즈 구매 비율 (%)',
          data: [3.6, 11.7, 14.5],
          borderColor: '#3b82f6',
          borderWidth: 3,
          pointRadius: 6,
          pointBackgroundColor: '#3b82f6',
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
          title: { display: true, text: '구매 인원 (만 명)', color: '#ec4899' }
        },
        y1: {
          type: 'linear',
          position: 'right',
          ticks: { color: '#94a3b8' },
          grid: { drawOnChartArea: false },
          title: { display: true, text: '구매 비율 (%)', color: '#3b82f6' }
        }
      }
    }
  });
}

// Chart 2: First vs Repeat Goods Rates by Country
function renderChartFirstVsRepeatGoods() {
  const ctx = document.getElementById('chartFirstVsRepeatGoods').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['🇨🇳 중국 (China)', '🇯🇵 일본 (Japan)', '🇹🇼 대만 (Taiwan)'],
      datasets: [
        {
          label: '🔴 첫 방문 굿즈 구매율 (%)',
          data: [15.8, 10.4, 10.7],
          backgroundColor: 'rgba(236, 72, 153, 0.75)',
          borderColor: '#ec4899',
          borderWidth: 1.5
        },
        {
          label: '🔵 재방문 굿즈 구매율 (%)',
          data: [21.0, 13.1, 16.9],
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
        legend: { labels: { color: '#f8fafc', font: { family: 'Pretendard' } } }
      },
      scales: {
        x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' }, title: { display: true, text: '구매율 (%)', color: '#94a3b8' } }
      }
    }
  });
}

// Chart 3: Japan Repeat Goods Buyers Age Group Breakdown
function renderChartAgeDiversification() {
  const ctx = document.getElementById('chartAgeDiversification').getContext('2d');
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['10대 (4.3%)', '20대 (42.7%)', '30대 (16.4%)', '40대 (14.7%) 🚨', '50대 (17.3%) 🚨', '60대+ (4.6%) 🚨'],
      datasets: [
        {
          data: [4.3, 42.7, 16.4, 14.7, 17.3, 4.6],
          backgroundColor: [
            '#06b6d4',
            '#ec4899',
            '#3b82f6',
            '#a855f7',
            '#f59e0b',
            '#10b981'
          ],
          borderWidth: 2,
          borderColor: '#090d16'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { color: '#f8fafc', font: { family: 'Pretendard' } } },
        title: { display: true, text: '🇯🇵 일본 재방문 굿즈 구매자 연령대 분포 (중장년 36.6%)', color: '#f8fafc', font: { size: 14 } }
      }
    }
  });
}

// Chart 4: K-Means 4 Clusters Scatter Plot
function renderChartKMeansScatter() {
  const clusters = [
    { name: '클러스터 1: 단골 2030 자유여행 팬덤', x: 1145.4, y: 100.0, r: 26, color: '#ec4899', pop: '80.4만 명 (53.6%)' },
    { name: '클러스터 2: 신규 입덕 Z세대 자유여행층', x: 989.8, y: 0.0, r: 18, color: '#f59e0b', pop: '39.4만 명 (26.2%)' },
    { name: '클러스터 3: 패키지/에어텔 동반 팬덤층', x: 850.0, y: 65.0, r: 14, color: '#3b82f6', pop: '23.5만 명 (15.6%)' },
    { name: '클러스터 4: 하이엔드 VVIP 고액 소비층', x: 5202.2, y: 78.3, r: 10, color: '#a855f7', pop: '6.8만 명 (4.5%)' }
  ];

  const ctx = document.getElementById('chartKMeansScatter').getContext('2d');
  new Chart(ctx, {
    type: 'bubble',
    data: {
      datasets: clusters.map(c => ({
        label: c.name,
        data: [{ x: c.x, y: c.y, r: c.r }],
        backgroundColor: c.color + 'bb',
        borderColor: c.color,
        borderWidth: 2
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#f8fafc', font: { family: 'Pretendard', size: 11 } } },
        tooltip: {
          callbacks: {
            label: function(context) {
              const c = clusters[context.datasetIndex];
              return `${c.name}: 인당 중위지출 $${c.x}, 재방문율 ${c.y}%, 인원 ${c.pop}`;
            }
          }
        }
      },
      scales: {
        x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' }, title: { display: true, text: '총지출 중위값 ($)', color: '#94a3b8' } },
        y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' }, title: { display: true, text: '재방문율 (%)', color: '#94a3b8' }, min: -10, max: 110 }
      }
    }
  });
}

// Copy Prompt helper function
function copyPrompt(elementId, btnElement) {
  const text = document.getElementById(elementId).innerText;
  navigator.clipboard.writeText(text).then(() => {
    const originalText = btnElement.innerText;
    btnElement.innerText = '✅ 복사 완료!';
    btnElement.classList.add('copied');
    setTimeout(() => {
      btnElement.innerText = originalText;
      btnElement.classList.remove('copied');
    }, 2000);
  });
}
