from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd
import os

app = FastAPI(title="ResaleIQ API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = os.path.join(os.path.dirname(__file__), '../models/resale_model.pkl')
model = joblib.load(MODEL_PATH)

# New Schema matching your UI
class DeviceInput(BaseModel):
    Brand: str
    Usage_Months: int
    Original_Price: float
    Condition_Score: int

@app.post("/predict")
def predict_price(data: DeviceInput):
    try:
        input_df = pd.DataFrame([data.dict()])
        
        # Predict
        prediction = model.predict(input_df)[0]
        
        # Format as INR
        lower_bound = int(prediction * 0.95)
        upper_bound = int(prediction * 1.05)
        
        return {
            "predicted_price": int(prediction),
            "formatted_price": f"₹{int(prediction):,}",
            "price_range": f"₹{lower_bound:,} - ₹{upper_bound:,}"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))