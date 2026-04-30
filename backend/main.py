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

@app.get("/history")
def get_history(symbol: str = "AAPL"):
    params = {
        "function": "TIME_SERIES_DAILY",
        "symbol": symbol.upper(),
        "outputsize": "compact",
        "apikey": API_KEY
    }

    try:
        response = requests.get(BASE_URL, params=params, timeout=10)
        data = response.json()
        print("HISTORY RAW:", list(data.keys()))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Request failed: {str(e)}")

    # Alpha Vantage rate limit returns this key instead
    if "Note" in data:
        raise HTTPException(
            status_code=429,
            detail="Alpha Vantage rate limit reached. Wait 1 minute and try again."
        )

    if "Information" in data:
        raise HTTPException(
            status_code=429,
            detail="Alpha Vantage API limit reached for today."
        )

    time_series = data.get("Time Series (Daily)", {})

    if not time_series:
        raise HTTPException(
            status_code=404,
            detail=f"No history found for {symbol}. Check the symbol is valid."
        )

    history = []
    for date, values in list(time_series.items())[:30]:
        history.append({
            "date": date,
            "price": float(values["4. close"]),
            "high": float(values["2. high"]),
            "low": float(values["3. low"]),
            "volume": int(values["5. volume"])
        })

    history.reverse()
    return {"symbol": symbol.upper(), "history": history}

NEWS_API_KEY = os.getenv("NEWS_API_KEY")

@app.get("/news")
def get_news(symbol: str = "AAPL"):
    # Map common symbols to company names for better search
    company_names = {
        "AAPL": "Apple", "TSLA": "Tesla", "MSFT": "Microsoft",
        "GOOGL": "Google", "AMZN": "Amazon", "META": "Meta",
        "NVDA": "NVIDIA", "NFLX": "Netflix", "AMD": "AMD"
    }
    query = company_names.get(symbol.upper(), symbol.upper())

    try:
        response = requests.get(
            "https://newsdata.io/api/1/news",
            params={
                "apikey": NEWS_API_KEY,
                "q": query,
                "language": "en",
                "category": "business",
                "size": 5
            },
            timeout=10
        )
        data = response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"News request failed: {str(e)}")

    if data.get("status") != "success":
        raise HTTPException(status_code=404, detail="No news found")

    articles = data.get("results", [])

    if not articles:
        raise HTTPException(status_code=404, detail=f"No news found for {symbol}")

    news = []
    for item in articles[:5]:
        # simple sentiment based on keywords in title
        title = item.get("title", "").lower()
        if any(w in title for w in ["surge", "gain", "rise", "beat", "up", "high", "growth", "profit"]):
            sentiment = "Bullish"
        elif any(w in title for w in ["drop", "fall", "loss", "down", "crash", "cut", "miss", "risk"]):
            sentiment = "Bearish"
        else:
            sentiment = "Neutral"

        news.append({
            "title": item.get("title", ""),
            "url": item.get("link", ""),
            "source": item.get("source_name", "Unknown"),
            "published": item.get("pubDate", "")[:10] if item.get("pubDate") else "Recent",
            "summary": (item.get("description") or "No summary available")[:200],
            "sentiment": sentiment
        })

    return {"symbol": symbol.upper(), "news": news}