# -*- coding: utf-8 -*-
import sys, io, os, json
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.metrics.pairwise import cosine_similarity

# Set UTF-8 encoding for console output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

print("=========================================================================")
print("국가별(중국, 대만, 일본, 미국) 분리 클러스터링 및 공통 클러스터링 통합 검증")
print("=========================================================================\n")

# Load raw survey datasets (2023, 2024, 2025)
df23 = pd.read_csv('2023 외래관광객조사_Data.csv', low_memory=False)
df24 = pd.read_csv('2024 외래관광객조사_Data.csv', low_memory=False)
df25 = pd.read_csv('2025 외래관광객조사_Data.csv', low_memory=False)

df23['YEAR'] = 2023
df24['YEAR'] = 2024
df25['YEAR'] = 2025

def standardize(df):
    cols = {}
    if 'pnid' in df.columns: cols['pnid'] = 'ID'
    if 'D_NAT' in df.columns: cols['D_NAT'] = 'D_NAT'
    if 'D_AGE' in df.columns: cols['D_AGE'] = 'D_AGE'
    if 'weight' in df.columns: cols['weight'] = 'WEIGHT'
    if 'M일HAP' in df.columns: cols['M일HAP'] = 'STAY_DAYS'
    if '총액1인MIS' in df.columns: cols['총액1인MIS'] = 'TOTAL_SPEND'
    if '쇼핑비1인대체' in df.columns: cols['쇼핑비1인대체'] = 'SHOP_SPEND'
    if 'Q11' in df.columns: cols['Q11'] = 'SATISFACTION'
    if 'Q13' in df.columns: cols['Q13'] = 'REVISIT_INTENT'
    if 'Q14' in df.columns: cols['Q14'] = 'RECOMMEND_INTENT'
    return df.rename(columns=cols)

df_all = pd.concat([standardize(df23), standardize(df24), standardize(df25)], ignore_index=True)
df_mok = df_all[df_all['D_MOK'] == 1].copy()

# Feature engineering
def is_hallyu(row):
    for col in ['Q1_1a1', 'Q1_1a2', 'Q1_1a3', 'Q2_1a1', 'Q2_1a2', 'Q2_1a3']:
        if col in row and pd.notnull(row[col]):
            val = float(row[col])
            if val in [1.0, 2.0, 8.0, 9.0, 10.0]:
                return 1
    return 0

def is_exp(row):
    for col in ['Q8_1a1', 'Q8_1a2', 'Q8_1a3']:
        if col in row and pd.notnull(row[col]):
            val = float(row[col])
            if val in [1.0, 2.0]: return 1
    return 0

def is_goods(row):
    for col in ['Q10_2a11', 'Q10_2a1', 'Q10_2a2', 'Q10_1a1']:
        if col in row and pd.notnull(row[col]):
            val = float(row[col])
            if val in [11.0, 1.0]: return 1
    return 0

df_mok['IS_HALLYU'] = df_mok.apply(is_hallyu, axis=1)
df_mok['IS_EXP'] = df_mok.apply(is_exp, axis=1)
df_mok['IS_GOODS'] = df_mok.apply(is_goods, axis=1)

# Numeric feature cleaning
features = ['D_AGE', 'STAY_DAYS', 'TOTAL_SPEND', 'SHOP_SPEND', 'IS_HALLYU', 'IS_EXP', 'IS_GOODS', 'SATISFACTION', 'REVISIT_INTENT']
for col in features:
    df_mok[col] = pd.to_numeric(df_mok[col], errors='coerce')

df_clean = df_mok.dropna(subset=features).copy()
df_clean['D_NAT'] = df_clean['D_NAT'].astype(int)

# Target Countries
COUNTRY_NAMES = {
    1: '중국 (China)',
    2: '일본 (Japan)',
    3: '대만 (Taiwan)',
    11: '미국 (USA)'
}

df_4c = df_clean[df_clean['D_NAT'].isin([1, 2, 3, 11])].copy()
print(f"Total Clean Sample Across 4 Countries: {len(df_4c)} 명\n")

# Step 1: Perform Individual Clustering for Each Country (K=4)
k_clusters = 4
centroids_dict = {}

print("--- [STEP 1] 4개국 각각 독립 클러스터링 수행 결과 (K=4) ---")
for c_code, c_name in COUNTRY_NAMES.items():
    df_c = df_4c[df_4c['D_NAT'] == c_code].copy()
    X_c = df_c[features]
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_c)
    
    kmeans = KMeans(n_clusters=k_clusters, random_state=42, n_init=10)
    labels = kmeans.fit_predict(X_scaled)
    df_c['CLUSTER'] = labels
    
    sample_sz = min(3000, len(X_scaled))
    sil_score = silhouette_score(X_scaled, labels, sample_size=sample_sz, random_state=42)
    centroids_dict[c_code] = kmeans.cluster_centers_
    
    print(f"\n📍 {c_name} (샘플 N={len(df_c)}명 | Silhouette Score: {sil_score:.3f}):")
    profile = df_c.groupby('CLUSTER')[features].mean()
    profile['COUNT'] = df_c['CLUSTER'].value_counts()
    profile['PROP(%)'] = (profile['COUNT'] / len(df_c) * 100).round(1)
    
    print(profile[['PROP(%)', 'D_AGE', 'STAY_DAYS', 'TOTAL_SPEND', 'SHOP_SPEND', 'IS_HALLYU', 'IS_EXP', 'IS_GOODS', 'SATISFACTION']].round(2))

# Step 2: Global Common Clustering across All 4 Countries Combined
print("\n-------------------------------------------------------------------------")
print("--- [STEP 2] 4개국 통합 공통 클러스터링 수행 결과 (Global K-Means, K=4) ---")
print("-------------------------------------------------------------------------")

X_global = df_4c[features]
scaler_global = StandardScaler()
X_global_scaled = scaler_global.fit_transform(X_global)

kmeans_global = KMeans(n_clusters=k_clusters, random_state=42, n_init=10)
global_labels = kmeans_global.fit_predict(X_global_scaled)
df_4c['GLOBAL_CLUSTER'] = global_labels

global_profile = df_4c.groupby('GLOBAL_CLUSTER')[features].mean()
global_profile['COUNT'] = df_4c['GLOBAL_CLUSTER'].value_counts()
global_profile['PROP(%)'] = (global_profile['COUNT'] / len(df_4c) * 100).round(1)

cluster_names = {
    0: "군집 1: 코어 한류 팬덤 (1020 청년 + 굿즈/경험 초밀도)",
    1: "군집 2: 근거리 단기 체험층 (일본/대만 주말 알뜰 방문)",
    2: "군집 3: 쇼핑 · 뷰티 고소비층 (3040 실속 / 프리미엄)",
    3: "군집 4: 순수 문화/휴양 탐방층 (장기 체재 / 비관여)"
}

print("\n🌐 4개국 공통 군집 프로필 (Global Clusters):")
for cl in range(k_clusters):
    p = global_profile.loc[cl]
    print(f"\n[{cluster_names.get(cl, f'군집 {cl}')}] (비중: {p['PROP(%)']}%, N={int(p['COUNT'])}명)")
    print(f"  • 평균 연령대(D_AGE): {p['D_AGE']:.2f} | 체재일수: {p['STAY_DAYS']:.1f}일")
    print(f"  • 총지출: ${p['TOTAL_SPEND']:.1f} | 쇼핑비: ${p['SHOP_SPEND']:.1f}")
    print(f"  • K-컬처 관여율: {p['IS_HALLYU']*100:.1f}% | 현장경험: {p['IS_EXP']*100:.1f}% | 굿즈구매: {p['IS_GOODS']*100:.1f}%")

# Step 3: Similarity Evaluation
print("\n-------------------------------------------------------------------------")
print("--- [STEP 3] 개별 국가 군집 ↔ 공통 군집 유사도(Cosine Similarity) 및 통합 가능성 검증 ---")
print("-------------------------------------------------------------------------")

for c_code, c_name in COUNTRY_NAMES.items():
    print(f"\n📌 {c_name} 개별 군집 ➔ 공통 군집 매핑 및 코사인 유사도:")
    c_centroids = centroids_dict[c_code]
    g_centroids = kmeans_global.cluster_centers_
    sim_matrix = cosine_similarity(c_centroids, g_centroids)
    
    for i in range(k_clusters):
        best_g = np.argmax(sim_matrix[i])
        max_sim = sim_matrix[i][best_g]
        print(f"  • {c_name} 개별 군집 {i} ➔ 공통 [{cluster_names[best_g]}] (유사도: {max_sim*100:.1f}%)")

print("\n=========================================================================")
print("분석 완료!")
