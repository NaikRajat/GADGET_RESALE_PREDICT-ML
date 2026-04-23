import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
import joblib
import os

print("1. Generating Synthetic INR Data...")
np.random.seed(42)
n_samples = 2000

# Aligning with your UI's specific brands
brands = np.random.choice(['apple', 'samsung', 'oneplus', 'xiaomi', 'google', 'realme', 'vivo'], n_samples)
usage_months = np.random.randint(1, 61, n_samples) # 1 to 60 months
original_price = np.random.uniform(10000, 150000, n_samples) # ₹10k to ₹1.5L
condition_score = np.random.randint(20, 100, n_samples) # 20 (Poor) to 100 (Perfect)

# Realistic Depreciation Logic
# Apple retains value best, followed by Samsung/Google, then others
brand_retention = {
    'apple': 0.9, 'samsung': 0.8, 'google': 0.8, 'oneplus': 0.75, 
    'xiaomi': 0.65, 'vivo': 0.6, 'realme': 0.6
}
retention_array = np.array([brand_retention[b] for b in brands])

# Depreciation formula: Base Price * Brand Factor * (Condition/100) * Time Decay
time_decay = np.exp(-0.02 * usage_months) # Value drops ~2% per month non-linearly
resale_price = original_price * retention_array * (condition_score / 100) * time_decay

# Ensure price doesn't drop below ₹1000
resale_price = np.maximum(resale_price, 1000)

df = pd.DataFrame({
    'Brand': brands,
    'Usage_Months': usage_months,
    'Original_Price': original_price,
    'Condition_Score': condition_score,
    'Resale_Price': resale_price
})

print("2. Preprocessing & Training Model...")
X = df.drop('Resale_Price', axis=1)
y = df['Resale_Price']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

preprocessor = ColumnTransformer(
    transformers=[
        ('num', StandardScaler(), ['Usage_Months', 'Original_Price', 'Condition_Score']),
        ('cat', OneHotEncoder(handle_unknown='ignore'), ['Brand'])
    ])

model_pipeline = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('regressor', RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42))
])

model_pipeline.fit(X_train, y_train)

print("3. Saving Model...")
os.makedirs('models', exist_ok=True)
joblib.dump(model_pipeline, 'models/resale_model.pkl')
print("Model saved! Ready for INR predictions.")