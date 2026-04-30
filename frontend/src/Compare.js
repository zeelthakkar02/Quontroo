import { useState } from "react";

const getRiskColor = (level) => {
  if (level === "Low") return "risk-low";
  if (level === "Medium") return "risk-medium";
  if (level === "High") return "risk-high";
  return "";
};

const getDecisionColor = (decision) => {
  if (!decision) return "";
  const d = decision.toLowerCase();
  if (d.includes("invest")) return "decision-invest";
  if (d.includes("hold")) return "decision-hold";
  if (d.includes("avoid")) return "decision-avoid";
  return "";
};

function CompareCard({ stock, loading, symbol }) {
  if (loading) {
    return (
      <div className="compare-card glass-card">
        <div className="compare-card-loading">
          <div className="loader-ring"></div>
          <p>Analyzing {symbol}...</p>
        </div>
      </div>
    );
  }

  if (stock?.error) {
  return (
    <div className="compare-card glass-card compare-empty">
      <div className="compare-empty-inner">
        <span className="compare-empty-icon">⚠️</span>
        <p style={{ color: "#f87171" }}>{stock.error}</p>
      </div>
    </div>
  );
}

  if (!stock) {
    return (
      <div className="compare-card glass-card compare-empty">
        <div className="compare-empty-inner">
          <span className="compare-empty-icon">📊</span>
          <p>Enter a symbol above</p>
        </div>
      </div>
    );
  }

  const isPositive = stock.change_percent ? parseFloat(stock.change_percent) >= 0 : true;

  return (
    <div className="compare-card glass-card">
      {/* Header */}
      <div className="compare-card-header">
        <div className="ticker-badge">{stock.symbol}</div>
        <span className={`change-badge ${isPositive ? "up" : "down"}`}>
          {isPositive ? "▲" : "▼"} {stock.change_percent}
        </span>
      </div>

      {/* Price */}
      <div className="compare-price">
        <span className="currency">$</span>
        <span className="compare-price-number">{stock.price ? stock.price.toFixed(2) : "—"}</span>
      </div>

      {/* Metrics */}
      <div className="compare-metrics">
        <div className="compare-metric">
          <span className="compare-metric-label">Market Signal</span>
          <span className={`compare-metric-value ${isPositive ? "text-green" : "text-red"}`}>
            {stock.market_signal}
          </span>
        </div>

        <div className="compare-metric">
          <span className="compare-metric-label">Risk Level</span>
          <span className={`compare-metric-value ${getRiskColor(stock.risk?.level)}`}>
            {stock.risk?.level}
          </span>
        </div>

        <div className="compare-metric">
          <span className="compare-metric-label">Recommendation</span>
          <span className={`compare-metric-value ${getDecisionColor(stock.recommendation?.decision)}`}>
            {stock.recommendation?.decision}
          </span>
        </div>

        <div className="compare-metric">
          <span className="compare-metric-label">Confidence</span>
          <span className="compare-metric-value" style={{ color: "#818cf8" }}>
            {stock.recommendation?.confidence}%
          </span>
        </div>
      </div>

      {/* Risk bar */}
      <div className="compare-risk-bar-wrapper">
        <div
          className={`risk-bar ${getRiskColor(stock.risk?.level)}`}
          style={{
            width: stock.risk?.level === "Low" ? "33%"
              : stock.risk?.level === "Medium" ? "66%" : "100%"
          }}
        ></div>
      </div>

      {/* Analysis */}
      <div className="compare-analysis">
        <p className="compare-analysis-label">🛡 Risk Analysis</p>
        <p className="compare-analysis-text">{stock.risk?.analysis}</p>
      </div>

      <div className="compare-analysis">
        <p className="compare-analysis-label">💡 Reasoning</p>
        <p className="compare-analysis-text">{stock.recommendation?.reasoning}</p>
      </div>

      {/* Final verdict */}
      <div className={`compare-verdict ${getDecisionColor(stock.recommendation?.decision)}`}>
        {stock.recommendation?.decision} — {stock.recommendation?.confidence}% confidence
      </div>
    </div>
  );
}

function Compare({ darkMode }) {
  const [symbols, setSymbols] = useState(["", "", ""]);
  const [stocks, setStocks] = useState([null, null, null]);
  const [loadings, setLoadings] = useState([false, false, false]);
  const [error, setError] = useState("");
  const [hasCompared, setHasCompared] = useState(false);

  const updateSymbol = (index, value) => {
    const updated = [...symbols];
    updated[index] = value.toUpperCase();
    setSymbols(updated);
  };

  const handleCompare = async () => {
  const activeSymbols = symbols.filter(s => s.trim() !== "");
  if (activeSymbols.length < 2) {
    setError("Please enter at least 2 stock symbols to compare.");
    return;
  }
  setError("");
  setHasCompared(true);
  setStocks([null, null, null]);

  // set all active ones to loading
  setLoadings(symbols.map(s => s.trim() !== ""));

  // fetch one by one with 2 second delay between each
  for (let i = 0; i < symbols.length; i++) {
    const symbol = symbols[i];
    if (!symbol.trim()) continue;

    // wait 2 seconds between each call
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/analyze?symbol=${symbol.trim()}&market_signal=Neutral`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);

      setStocks(prev => {
        const updated = [...prev];
        updated[i] = data;
        return updated;
      });
    } catch (err) {
      setStocks(prev => {
        const updated = [...prev];
        updated[i] = { error: err.message };
        return updated;
      });
    } finally {
      setLoadings(prev => {
        const updated = [...prev];
        updated[i] = false;
        return updated;
      });
    }
  }
};

  const activeCount = symbols.filter(s => s.trim() !== "").length;

  return (
    <div className="compare-page">
      <div className="compare-hero">
        <div className="section-label">COMPARE MODE</div>
        <h2 className="compare-title">Stock Comparison</h2>
        <p className="compare-sub">
          Analyze up to 3 stocks side by side with AI-powered insights
        </p>
      </div>

      {/* Input row */}
      <div className="compare-inputs">
        {symbols.map((sym, i) => (
          <div key={i} className="compare-input-wrapper">
            <span className="compare-input-label">Stock {i + 1}{i === 0 ? " *" : i === 1 ? " *" : " (optional)"}</span>
            <div className="compare-input-box glass-card">
              <span className="search-icon">📈</span>
              <input
                type="text"
                placeholder={i === 0 ? "e.g. AAPL" : i === 1 ? "e.g. TSLA" : "e.g. MSFT"}
                value={sym}
                onChange={(e) => updateSymbol(i, e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCompare()}
                maxLength={5}
              />
            </div>
          </div>
        ))}
      </div>

      {error && <p className="compare-error">{error}</p>}

      <div className="compare-btn-wrapper">
        <button
          className="primary-btn compare-btn"
          onClick={handleCompare}
          disabled={activeCount < 2}
        >
          {loadings.some(l => l) 
          ? `Analyzing... (${activeCount} stocks, ~${activeCount * 2}s)` 
          : `Compare ${activeCount} Stock${activeCount !== 1 ? "s" : ""} →`}
        </button>
        {activeCount < 2 && (
          <p className="compare-hint">Enter at least 2 symbols</p>
        )}
      </div>

      {/* Results */}
      {hasCompared && (
        <div className={`compare-results compare-cols-${activeCount}`}>
          {symbols.map((sym, i) => (
            sym.trim() !== "" && (
              <CompareCard
                key={i}
                stock={stocks[i]}
                loading={loadings[i]}
                symbol={sym}
              />
            )
          ))}
        </div>
      )}
    </div>
  );
}

export default Compare;