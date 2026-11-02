# ResaleIQ -- Smart Gadget Resale Estimator

ResaleIQ is a web-based gadget resale price estimation project. It
collects basic device information and condition details, then uses a
machine-learning regression model to estimate the device's resale value
in Indian Rupees (INR).

## Features

-   Select a device brand: Apple, Samsung, OnePlus, Xiaomi, Google,
    Realme, or Vivo.
-   Enter the device's usage duration and original purchase price.
-   Assess device condition through questions about scratches, screen
    damage, button functionality, and battery health.
-   Calculate a condition score out of 100.
-   Get an estimated resale price from a Random Forest regression model.
-   View an illustrative depreciation chart.
-   Switch between dark and light themes.
-   Display the estimated price in INR, with an approximate range
    returned by the API.

## Technology Stack

**Frontend** - HTML5 - CSS3 - JavaScript - Chart.js

**Backend** - Python - FastAPI - Uvicorn - Pydantic

**Machine Learning and Data Processing** - scikit-learn - pandas -
NumPy - joblib

## Project Structure

Arrange the project files in the following structure so that the model
path in `backend/main.py` resolves correctly:

``` text
ResaleIQ/
├── backend/
│   └── main.py
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── models/
│   └── resale_model.pkl
├── train_model.py
└── requirements.txt
```

The uploaded `main.py` loads the model from
`../models/resale_model.pkl`. The training script creates
`models/resale_model.pkl` relative to the directory from which
`train_model.py` is run. Therefore, run the training script from the
project root.

## Prerequisites

-   Python 3.9 or later
-   pip
-   A modern web browser
-   VS Code Live Server or another local static web server (recommended)

## Installation and Setup

### 1. Clone or download the project

``` bash
git clone <your-repository-url>
cd ResaleIQ
```

If you downloaded the source as a ZIP file, extract it and open the
`ResaleIQ` folder in your terminal.

### 2. Create and activate a virtual environment

**Windows**

``` bash
python -m venv venv
venv\Scripts\activate
```

**macOS / Linux**

``` bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install the dependencies

``` bash
pip install -r requirements.txt
```

The requirements file includes FastAPI, Uvicorn, scikit-learn, pandas,
joblib, and Pydantic. The model training script also imports NumPy; if
it is not installed in your environment, install it with:

``` bash
pip install numpy
```

### 4. Train the machine-learning model

Run this command from the project root:

``` bash
python train_model.py
```

The script generates a synthetic dataset of 2,000 device records,
preprocesses the input features, trains a Random Forest Regressor, and
saves the trained pipeline to:

``` text
models/resale_model.pkl
```

If you already have a compatible `resale_model.pkl` in the `models`
directory, you can skip this step.

### 5. Start the FastAPI backend

Open a terminal and run:

``` bash
cd backend
uvicorn main:app --reload
```

The API will be available at:

``` text
http://127.0.0.1:8000
```

FastAPI's interactive API documentation is available at:

``` text
http://127.0.0.1:8000/docs
```

Keep this terminal running while using the frontend.

### 6. Run the frontend

Open a second terminal, then serve the `frontend` folder using VS Code
Live Server or another local static web server.

Alternatively, if Python is installed, run:

``` bash
cd frontend
python -m http.server 5500
```

Then open:

``` text
http://127.0.0.1:5500
```

The frontend currently sends prediction requests to
`http://127.0.0.1:8000/predict`. If you deploy the backend to another
host, update this URL in `frontend/script.js`.

## API Reference

### Predict resale price

**Endpoint**

``` http
POST /predict
```

**Request body**

``` json
{
  "Brand": "apple",
  "Usage_Months": 12,
  "Original_Price": 75000,
  "Condition_Score": 85
}
```

**Response format**

``` json
{
  "predicted_price": 42000,
  "formatted_price": "₹42,000",
  "price_range": "₹39,900 - ₹44,100"
}
```

The values above are an example of the response format, not a guaranteed
prediction. Actual output depends on the saved model and input values.

## How the Model Works

The training script creates synthetic input data using these features:

-   `Brand`
-   `Usage_Months`
-   `Original_Price`
-   `Condition_Score`

It generates the target resale price using a depreciation formula based
on original price, a brand retention factor, condition score, and
exponential time decay:

``` text
Resale Price = Original Price
               × Brand Retention Factor
               × (Condition Score / 100)
               × exp(-0.02 × Usage Months)
```

A minimum resale value of ₹1,000 is applied to the generated target
values.

The model pipeline applies: - `StandardScaler` to the numerical
features. - `OneHotEncoder` to the brand feature. -
`RandomForestRegressor` with 100 estimators and a maximum depth of 10.

The data is split into training and testing sets, with 80% used for
training and 20% for testing.

## Important Notes and Limitations

-   **Synthetic training data:** The current training script generates
    artificial data from a predefined formula. It does not use verified
    live resale listings or actual marketplace transaction records.
    Predictions should be treated as project estimates, not confirmed
    market prices.
-   **Condition scoring:** The frontend converts the four condition
    answers into a score. The score is sent to the backend as a model
    input.
-   **Illustrative chart:** The depreciation chart uses the original
    price, a calculated midpoint, and the predicted price. It is a
    visual illustration, not a record of actual historical prices.
-   **Market confidence:** The confidence percentage shown in the
    frontend is assigned using a simple condition-score rule. It is not
    a statistically calibrated model confidence score.
-   **CORS:** The backend currently allows requests from all origins for
    local development. Restrict this configuration before deploying the
    application.
-   **Local API URL:** The frontend is configured for a backend running
    on the same computer at `127.0.0.1:8000`.

The uploaded frontend also contains controls for comparison and report
download. Their complete behaviour is not implemented in the supplied
`script.js`, so those controls may need additional JavaScript before
they can be used.

## Future Enhancements

-   Train the model using verified resale transaction data.
-   Add device-specific model and storage variants as model inputs.
-   Evaluate the model using metrics such as MAE, RMSE, and R².
-   Add input validation and clearer API error messages.
-   Implement and test device comparison and downloadable reports.
-   Configure production CORS settings and deploy the frontend and
    backend.
-   Store prediction history for users who need previous estimates.

## Disclaimer

ResaleIQ is an academic/demo project intended to demonstrate a
machine-learning-based resale price estimation workflow. Its estimates
are not professional valuations or guaranteed selling prices.

## Author

Rajat Naik

Computer Science and Engineering  
CMR Institute of Technology (CMRIT), Bengaluru, Karnataka, India.

Project: ResaleIQ – Smart Gadget Resale Estimator

Developed as an academic project to demonstrate the application of Machine Learning in estimating electronic resale values based on brand, usage duration, original purchase price, and device condition.
