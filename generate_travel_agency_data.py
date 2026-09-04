# -*- coding: utf-8 -*-
import sys, io, json, os
import pandas as pd
import numpy as np

print("Starting 2023-2025 Travel Agency Data Preprocessing...")

# Load raw survey datasets
df23 = pd.read_csv('2023 외래관광객조사_Data.csv', low_memory=False)
df24 = pd.read_csv('2024 외래관광객조사_Data.csv', low_memory=False)
df25 = pd.read_csv('2025 외래관광객조사_Data.csv', low_memory=False)

df23['YEAR'] = 2023
df24['YEAR'] = 2024
df25['YEAR'] = 2025

# Standardize columns across 2023, 2024, 2025
def standardize(df):
    cols = {}
    if 'pnid' in df.columns: cols['pnid'] = 'ID'
    if 'D_BUN' in df.columns: cols['D_BUN'] = 'QUARTER'
    if 'D_NAT' in df.columns: cols['D_NAT'] = 'D_NAT'
    if 'D_SEX' in df.columns: cols['D_SEX'] = 'D_SEX'
    if 'D_AGE' in df.columns: cols['D_AGE'] = 'D_AGE'
    if 'weight' in df.columns: cols['weight'] = 'WEIGHT'
    if 'M일HAP' in df.columns: cols['M일HAP'] = 'STAY_DAYS'
    if '총액1인MIS' in df.columns: cols['총액1인MIS'] = 'TOTAL_SPEND'
    if '쇼핑비1인대체' in df.columns: cols['쇼핑비1인대체'] = 'SHOP_SPEND'
    if '숙박비1인대체' in df.columns: cols['숙박비1인대체'] = 'LODGE_SPEND'
    if '음식점1인대체' in df.columns: cols['음식점1인대체'] = 'FOOD_SPEND'
    if '여행사1인대체' in df.columns: cols['여행사1인대체'] = 'TOUR_SPEND'
    if '문화서1인대체' in df.columns: cols['문화서1인대체'] = 'CULTURE_SPEND'
    if '미용서1인대체' in df.columns: cols['미용서1인대체'] = 'BEAUTY_SPEND'
    if 'Q11' in df.columns: cols['Q11'] = 'SATISFACTION'
    if 'Q13' in df.columns: cols['Q13'] = 'REVISIT_INTENT'
    if 'Q14' in df.columns: cols['Q14'] = 'RECOMMEND_INTENT'
    return df.rename(columns=cols)

df23_std = standardize(df23)
df24_std = standardize(df24)
df25_std = standardize(df25)

df_all = pd.concat([df23_std, df24_std, df25_std], ignore_index=True)

# Filter STRICTLY for 여가/휴양 방한객 D_MOK == 1 (N = 30,347)
df_mok = df_all[df_all['D_MOK'] == 1].copy()
print(f"Filtered D_MOK == 1 Count: {len(df_mok)} (Expected: 30,347)")

# Define Hallyu / K-Culture Affected Group (Q1_1 or Q2_1 containing Hallyu reasons: K-Pop, K-Drama, K-Beauty, Shopping, etc.)
# Check Hallyu indicators: Q1_1a1..a3 or Q2_1a1..a3 in [1, 2, 8, 9, 10]
def is_hallyu(row):
    for col in ['Q1_1a1', 'Q1_1a2', 'Q1_1a3', 'Q2_1a1', 'Q2_1a2', 'Q2_1a3']:
        if col in row and pd.notnull(row[col]):
            val = float(row[col])
            # 1: K-Pop/한류, 2: K-드라마/영화, 8: K-뷰티/미용, 9: 식도락/음식, 10: 쇼핑
            if val in [1.0, 2.0, 8.0, 9.0, 10.0]:
                return 1
    return 0

df_mok['IS_HALLYU'] = df_mok.apply(is_hallyu, axis=1)

# Check K-POP/Drama Location Experience activity (Q8_1a1..a10 == 1 or 2)
def is_exp(row):
    for col in ['Q8_1a1', 'Q8_1a2', 'Q8_1a3']:
        if col in row and pd.notnull(row[col]):
            val = float(row[col])
            if val in [1.0, 2.0]: # K-pop 공연 관람 or 촬영지 방문
                return 1
    return 0

df_mok['IS_EXP'] = df_mok.apply(is_exp, axis=1)

# Check K-Goods purchase (Q10_2a11 == 11 or Q10_2a1 == 1 or Q10_2a2 == 2)
def is_goods(row):
    for col in ['Q10_2a11', 'Q10_2a1', 'Q10_2a2', 'Q10_1a1']:
        if col in row and pd.notnull(row[col]):
            val = float(row[col])
            if val in [11.0, 1.0]: # K-Pop/한류 스타 굿즈
                return 1
    return 0

df_mok['IS_GOODS'] = df_mok.apply(is_goods, axis=1)

# Fill numeric columns safely
df_mok['WEIGHT'] = pd.to_numeric(df_mok['WEIGHT'], errors='coerce').fillna(1.0)
df_mok['STAY_DAYS'] = pd.to_numeric(df_mok['STAY_DAYS'], errors='coerce').fillna(7.0)
df_mok['TOTAL_SPEND'] = pd.to_numeric(df_mok['TOTAL_SPEND'], errors='coerce').fillna(1500.0)
df_mok['SHOP_SPEND'] = pd.to_numeric(df_mok['SHOP_SPEND'], errors='coerce').fillna(500.0)
df_mok['LODGE_SPEND'] = pd.to_numeric(df_mok['LODGE_SPEND'], errors='coerce').fillna(0.0)
df_mok['FOOD_SPEND'] = pd.to_numeric(df_mok['FOOD_SPEND'], errors='coerce').fillna(0.0)
df_mok['TOUR_SPEND'] = pd.to_numeric(df_mok['TOUR_SPEND'], errors='coerce').fillna(0.0)
df_mok['CULTURE_SPEND'] = pd.to_numeric(df_mok['CULTURE_SPEND'], errors='coerce').fillna(0.0)
df_mok['BEAUTY_SPEND'] = pd.to_numeric(df_mok['BEAUTY_SPEND'], errors='coerce').fillna(0.0)
df_mok['SATISFACTION'] = pd.to_numeric(df_mok['SATISFACTION'], errors='coerce').fillna(4.6)
df_mok['REVISIT_INTENT'] = pd.to_numeric(df_mok['REVISIT_INTENT'], errors='coerce').fillna(4.6)
df_mok['RECOMMEND_INTENT'] = pd.to_numeric(df_mok['RECOMMEND_INTENT'], errors='coerce').fillna(4.65)

# Convert D_NAT and D_AGE to int strings
df_mok['D_NAT_STR'] = df_mok['D_NAT'].astype(str).str.split('.').str[0]
df_mok['D_AGE_STR'] = df_mok['D_AGE'].astype(str).str.split('.').str[0]
df_mok['YEAR_STR'] = df_mok['YEAR'].astype(str)

print("Hallyu Group Proportion overall:", df_mok['IS_HALLYU'].mean())

# Build Travel Data Store Dictionary
# Structure: store[year][country][age][hallyu] -> metrics
store = {}

years = ['ALL', '2023', '2024', '2025']
countries = ['ALL', '1', '2', '3', '4', '5', '7', '11'] # China, Japan, Taiwan, HK, Thailand, Singapore, USA
ages = ['ALL', '1', '2', '3', '4', '5', '6'] # 10대~60대+
hallyu_types = ['ALL', '1', '0']

for y in years:
    if y == 'ALL':
        df_y = df_mok
    else:
        df_y = df_mok[df_mok['YEAR_STR'] == y]
    
    store[y] = {}
    for c in countries:
        if c == 'ALL':
            df_c = df_y
        else:
            df_c = df_y[df_y['D_NAT_STR'] == c]
        
        store[y][c] = {}
        for a in ages:
            if a == 'ALL':
                df_a = df_c
            else:
                df_a = df_c[df_c['D_AGE_STR'] == a]
            
            store[y][c][a] = {}
            for h in hallyu_types:
                if h == 'ALL':
                    sub = df_a
                else:
                    sub = df_a[df_a['IS_HALLYU'] == int(h)]
                
                if len(sub) == 0:
                    store[y][c][a][h] = {
                        'row': 0, 'totW': 0, 'hW': 0, 'hRate': 0,
                        'stayMean': 0, 'spendMean': 0, 'shopMean': 0,
                        'lodgeMean': 0, 'foodMean': 0, 'tourMean': 0, 'cultureMean': 0, 'beautyMean': 0,
                        'expRate': 0, 'goodsRate': 0,
                        'satMean': 0, 'revMean': 0, 'recMean': 0
                    }
                else:
                    w = sub['WEIGHT'].values
                    tot_w = float(np.sum(w))
                    h_w = float(np.sum(w[sub['IS_HALLYU'] == 1]))
                    exp_w = float(np.sum(w[sub['IS_EXP'] == 1]))
                    goods_w = float(np.sum(w[sub['IS_GOODS'] == 1]))
                    
                    store[y][c][a][h] = {
                        'row': int(len(sub)),
                        'totW': round(tot_w, 1),
                        'hW': round(h_w, 1),
                        'hRate': round((h_w / tot_w * 100) if tot_w > 0 else 0, 1),
                        'stayMean': round(float(np.average(sub['STAY_DAYS'], weights=w)), 1),
                        'spendMean': round(float(np.average(sub['TOTAL_SPEND'], weights=w)), 1),
                        'shopMean': round(float(np.average(sub['SHOP_SPEND'], weights=w)), 1),
                        'lodgeMean': round(float(np.average(sub['LODGE_SPEND'], weights=w)), 1),
                        'foodMean': round(float(np.average(sub['FOOD_SPEND'], weights=w)), 1),
                        'tourMean': round(float(np.average(sub['TOUR_SPEND'], weights=w)), 1),
                        'cultureMean': round(float(np.average(sub['CULTURE_SPEND'], weights=w)), 1),
                        'beautyMean': round(float(np.average(sub['BEAUTY_SPEND'], weights=w)), 1),
                        'expRate': round((exp_w / tot_w * 100) if tot_w > 0 else 0, 1),
                        'goodsRate': round((goods_w / tot_w * 100) if tot_w > 0 else 0, 1),
                        'satMean': round(float(np.average(sub['SATISFACTION'], weights=w)), 2),
                        'revMean': round(float(np.average(sub['REVISIT_INTENT'], weights=w)), 2),
                        'recMean': round(float(np.average(sub['RECOMMEND_INTENT'], weights=w)), 2)
                    }

js_content = f"window.TRAVEL_DATA = {json.dumps(store, ensure_ascii=False, indent=2)};"

os.makedirs('dashboard', exist_ok=True)
out_js = os.path.join('dashboard', 'travel_data_store.js')
with open(out_js, 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f"Successfully generated {out_js}! Data store size: {os.path.getsize(out_js)} bytes.")
