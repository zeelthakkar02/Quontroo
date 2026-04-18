import os
import requests
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from core.orchestrator import run_agents

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_KEY = os.getenv("API_KEY")
BASE_URL = "https://www.alphavantage.co/query"

if not API_KEY:
    raise ValueError("API_KEY is missing. Check your .env file.")


@app.get("/")
def home():
    return {"message": "Stock API backend is running"}


@app.get("/debug-stock")
def debug_stock(symbol: str = "AAPL"):
    params = {
        "function": "GLOBAL_QUOTE",
        "symbol": symbol.upper(),
        "apikey": API_KEY
    }

    try:
        response = requests.get(BASE_URL, params=params, timeout=10)
        return {
            "status_code": response.status_code,
            "raw_response": response.json()
        }
    except Exception as e:
        return {"error": str(e)}


@app.get("/stock")
def get_stock(symbol: str = "AAPL"):
    params = {
        "function": "GLOBAL_QUOTE",
        "symbol": symbol.upper(),
        "apikey": API_KEY
    }

    try:
        response = requests.get(BASE_URL, params=params, timeout=10)
        data = response.json()
        print("RAW RESPONSE:", data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Request failed: {str(e)}")

    quote = data.get("Global Quote", {})

    if not quote or "05. price" not in quote:
        raise HTTPException(
            status_code=404,
            detail=f"No stock data found for symbol {symbol.upper()}"
        )

    return {
        "symbol": quote.get("01. symbol"),
        "price": float(quote.get("05. price")),
        "change": float(quote.get("09. change", 0)),
        "change_percent": quote.get("10. change percent")
    }

@app.get("/analyze")
def analyze_stock(symbol: str = "AAPL", market_signal: str = "Neutral"):
    stock_data = get_stock(symbol)
    result = run_agents(stock_data, market_signal)
    return result