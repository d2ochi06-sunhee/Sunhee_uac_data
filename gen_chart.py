import matplotlib.pyplot as plt
import os

plt.rcParams['font.family'] = 'Malgun Gothic'
plt.rcParams['axes.unicode_minus'] = False

years = [2023, 2024, 2025]
core = [10.00, 11.46, 10.97]
latent = [7.45, 8.96, 9.40]
interest = [44.99, 43.72, 42.52]
pure = [37.56, 35.87, 37.10]

plt.figure(figsize=(10, 6), dpi=150)

plt.plot(years, core, marker='o', linewidth=2.5, color='#E50914', label='1. 코어 한류 (동기O + 활동O)')
plt.plot(years, latent, marker='s', linewidth=2.5, color='#FF9900', label='2. 파생/잠재 한류 (동기X + 활동O) [상승세!]')
plt.plot(years, interest, marker='^', linewidth=2.5, color='#2196F3', label='3. 한류 관심층 (동기O + 활동X)')
plt.plot(years, pure, marker='d', linewidth=2.5, color='#757575', label='4. 순수 일반/비즈니스 (동기X + 활동X)')

for i, txt in enumerate(core):
    plt.annotate(f'{txt}%', (years[i], core[i]+1.0), ha='center', fontsize=10, fontweight='bold', color='#E50914')

for i, txt in enumerate(latent):
    plt.annotate(f'{txt}%', (years[i], latent[i]-2.0), ha='center', fontsize=10, fontweight='bold', color='#FF9900')

for i, txt in enumerate(interest):
    plt.annotate(f'{txt}%', (years[i], interest[i]+1.0), ha='center', fontsize=10, color='#2196F3')

for i, txt in enumerate(pure):
    plt.annotate(f'{txt}%', (years[i], pure[i]-2.0), ha='center', fontsize=10, color='#757575')

plt.title('2023~2025년 4대 한류 클러스터별 비율 시계열 추이 (%)', fontsize=14, pad=15, fontweight='bold')
plt.xlabel('연도 (Year)', fontsize=11, labelpad=10)
plt.ylabel('비율 (%)', fontsize=11, labelpad=10)
plt.xticks(years, ['2023년', '2024년', '2025년'], fontsize=11)
plt.ylim(0, 50)
plt.grid(True, linestyle='--', alpha=0.5)
plt.legend(fontsize=10, loc='upper left')

plt.tight_layout()
os.makedirs('scratch', exist_ok=True)
plt.savefig('scratch/hallyu_cluster_trends.png')
print("Chart created!")
