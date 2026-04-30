import { useState, useEffect, useRef } from "react";

const getDecisionColor = (decision) => {
  if (!decision) return "";
  const d = decision.toLowerCase();
  if (d.includes("invest")) return "decision-invest";
  if (d.includes("hold")) return "decision-hold";
  if (d.includes("avoid")) return "decision-avoid";
  return "";
};

const getRiskColor = (level) => {
  if (level === "Low") return "risk-low";
  if (level === "Medium") return "risk-medium";
  if (level === "High") return "risk-high";
  return "";
};

function WatchlistCard({ item, onRemove, onAnalyze }) {
  const isPositive = parseFloat(item.change_percent) >= 0;

  return (
    <div className="watchlist-card glass-card">
      <div className="watchlist-card-top">
        <div className="watchlist-left">
          <div className="ticker-badge">{item.symbol}</div>
          <div className="watchlist-price-row">
            <span className="watchlist-price">${item.price?.toFixed(2)}</span>
            <span className={`change-badge ${isPositive ? "up" : "down"}`}>
              {isPositive ? "▲" : "▼"} {item.change_percent}
            </span>
          </div>
        </div>

        <div className="watchlist-right">
          {item.recommendation ? (
            <div className="watchlist-rec">
              <span className="watchlist-rec-label">AI says</span>
              <span className={`watchlist-rec-value ${getDecisionColor(item.recommendation)}`}>
                {item.recommendation}
              </span>
              <span className={`watchlist-risk ${getRiskColor(item.risk)}`}>
                {item.risk} Risk
              </span>
            </div>
          ) : (
            <span className="watchlist-no-rec">Not analyzed yet</span>
          )}
        </div>
      </div>

      <div className="watchlist-card-actions">
        <button
          className="watchlist-analyze-btn"
          onClick={() => onAnalyze(item.symbol)}
        >
          🔍 Analyze
        </button>
        <button
          className="watchlist-remove-btn"
          onClick={() => onRemove(item.symbol)}
        >
          🗑 Remove
        </button>
      </div>

      <div className="watchlist-added">
        Added {new Date(item.addedAt).toLocaleDateString("en-US", {
          month: "short", day: "numeric", year: "numeric"
        })}
      </div>
    </div>
  );
}

function Watchlist({ onNavigateHome }) {
  const [watchlist, setWatchlist] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(null);
  const [error, setError] = useState("");

  // Load from localStorage on mount
useEffect(() => {
  const saved = localStorage.getItem("quontro-watchlist");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setWatchlist(parsed);
      }
    } catch (e) {
      console.log("Failed to parse watchlist:", e);
    }
  }
}, []);

// Save to localStorage — but only after first load
const isFirstRender = useRef(true);
useEffect(() => {
  if (isFirstRender.current) {
    isFirstRender.current = false;
    return; // skip saving on first render
  }
  localStorage.setItem("quontro-watchlist", JSON.stringify(watchlist));
}, [watchlist]);

  const addStock = async () => {
    const symbol = input.trim().toUpperCase();
    if (!symbol) return;
    if (watchlist.find(w => w.symbol === symbol)) {
      setError(`${symbol} is already in your watchlist`);
      return;
    }
    setError("");
    setLoading(true);

    try {
      // fetch basic stock data
      const res = await fetch(`http://127.0.0.1:8000/stock?symbol=${symbol}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Symbol not found");

      const newItem = {
        symbol: data.symbol,
        price: data.price,
        change_percent: data.change_percent,
        recommendation: null,
        risk: null,
        addedAt: new Date().toISOString()
      };

      setWatchlist(prev => [newItem, ...prev]);
      setInput("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const removeStock = (symbol) => {
    setWatchlist(prev => prev.filter(w => w.symbol !== symbol));
  };

  const refreshStock = async (symbol) => {
    setRefreshing(symbol);
    try {
      // fetch full analysis
      const res = await fetch(
        `http://127.0.0.1:8000/analyze?symbol=${symbol}&market_signal=Neutral`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);

      setWatchlist(prev => prev.map(w =>
        w.symbol === symbol
          ? {
              ...w,
              price: data.price,
              change_percent: data.change_percent,
              recommendation: data.recommendation?.decision,
              risk: data.risk?.level
            }
          : w
      ));
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(null);
    }
  };

  const handleAnalyze = (symbol) => {
    // navigate to home and trigger analysis
    onNavigateHome(symbol);
  };

  const refreshAll = async () => {
    for (let i = 0; i < watchlist.length; i++) {
      await new Promise(r => setTimeout(r, i === 0 ? 0 : 2000));
      await refreshStock(watchlist[i].symbol);
    }
  };

  return (
    <div className="watchlist-page">
      <div className="watchlist-hero">
        <div className="section-label">MY WATCHLIST</div>
        <h2 className="watchlist-title">Stock Watchlist</h2>
        <p className="watchlist-sub">
          Track your favorite stocks and get AI recommendations
        </p>
      </div>

      {/* Add stock input */}
      <div className="watchlist-add-wrapper">
        <div className="watchlist-add-box glass-card">
          <span className="search-icon">⭐</span>
          <input
            type="text"
            placeholder="Add a stock symbol (e.g. NVDA)"
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && addStock()}
            maxLength={5}
          />
          <button
            className="watchlist-add-btn"
            onClick={addStock}
            disabled={loading || !input.trim()}
          >
            {loading ? "Adding..." : "+ Add"}
          </button>
        </div>
        {error && <p className="watchlist-error">{error}</p>}
      </div>

      {/* Watchlist stats + refresh all */}
      {watchlist.length > 0 && (
        <div className="watchlist-toolbar">
          <span className="watchlist-count">
            {watchlist.length} stock{watchlist.length !== 1 ? "s" : ""} tracked
          </span>
          <button className="watchlist-refresh-all" onClick={refreshAll}>
            ↻ Refresh All
          </button>
        </div>
      )}

      {/* Empty state */}
      {watchlist.length === 0 && (
        <div className="watchlist-empty glass-card">
          <span className="watchlist-empty-icon">⭐</span>
          <h3>Your watchlist is empty</h3>
          <p>Add stock symbols above to start tracking them</p>
        </div>
      )}

      {/* Watchlist grid */}
      <div className="watchlist-grid">
        {watchlist.map((item) => (
          <div key={item.symbol} className="watchlist-item-wrapper">
            {refreshing === item.symbol && (
              <div className="watchlist-refreshing">
                <div className="loader-ring"></div>
                <span>Refreshing {item.symbol}...</span>
              </div>
            )}
            {refreshing !== item.symbol && (
              <WatchlistCard
                item={item}
                onRemove={removeStock}
                onAnalyze={handleAnalyze}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Watchlist;