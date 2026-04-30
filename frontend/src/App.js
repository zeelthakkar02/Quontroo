import { useState, useEffect, useRef } from "react";
import "./App.css";
import Homeimage from "./IMAGES/HOMEPAGEICON.jpg";
import StockChart from "./StockChart";
import Compare from "./Compare";
import Watchlist from "./Watchlist";

function CountUp({ target, duration = 1200 }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return <span>{count}</span>;
}

function App() {
  const [inputValue, setInputValue] = useState("");
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const resultsRef = useRef(null);
  const [history, setHistory] = useState([]);
  const [chartRange, setChartRange] = useState(30);
  const [news, setNews] = useState([]);
  const [page, setPage] = useState("home");

  useEffect(() => {
    document.body.className = darkMode ? "dark" : "light";
  }, [darkMode]);

  const handleAnalyze = async () => {
    if (!inputValue.trim()) return;
    setLoading(true);
    setSearched(true);
    setStock(null);
    setHistory([]);
    setNews([]);
    setError("");
    

    setTimeout(() => {
      fetch(`http://127.0.0.1:8000/history?symbol=${inputValue.trim()}`)
        .then(r => r.json())
        .then(d => {
          if (d.history) {
            setHistory(d.history);
          } else {
            console.log("History not available:", d.detail);
            setHistory([]);
          }
        })
        .catch(() => setHistory([]));
    }, 2000);  // 2 second delay to avoid rate limiting

    setTimeout(() => {
    fetch(`http://127.0.0.1:8000/news?symbol=${inputValue.trim()}`)
      .then(r => r.json())
      .then(d => {
        if (d.news) setNews(d.news);
        else setNews([]);
      })
      .catch(() => setNews([]));
  }, 3000);
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/analyze?symbol=${inputValue.trim()}&market_signal=Neutral`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to fetch stock data");
      setTimeout(() => {
        setStock(data);
        setLoading(false);
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }, 1200);
    } catch (err) {
      setLoading(false);
      setError(err.message);
    }
  };

  const isPositive = stock ? parseFloat(stock.change_percent) >= 0 : true;

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

  return (
    <div className={`app ${darkMode ? "dark" : "light"}`}>
      <div className="bg-gradient"></div>
      <div className="bg-grid"></div>

      {/* Navbar */}
      <header className="navbar">
        <div className="logo">
          <div className="logo-icon">Q</div>
          <div className="logo-text">
            <h1>Quontro</h1>
            <span>Finance</span>
          </div>
        </div>
        <nav>
          <a href="#home" onClick={() => setPage("home")} className={page === "home" ? "nav-active" : ""}>Home</a>
          <a href="#about" onClick={() => setPage("home")} className={page === "home" ? "nav-active" : ""}>About</a>
          <button className="nav-compare-btn" onClick={() => setPage("compare")}>⚡ Compare</button>
          <button className="nav-watchlist-btn" onClick={() => setPage("watchlist")}>⭐ Watchlist</button>
        </nav>
        <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? "☀️ Light" : "🌙 Dark"}
        </button>
      </header>

      <main className="main-content">
  {page === "compare" ? (
    <Compare darkMode={darkMode} />
  ) : page === "watchlist" ? (
    <Watchlist onNavigateHome={(symbol) => {
      setPage("home");
      setInputValue(symbol);
      // auto trigger analyze after short delay
      setTimeout(() => {
        document.querySelector(".search-box button")?.click();
      }, 300);
    }} />
  ) : (
    <>
        {/* Hero */}
        <section className="home" id="home">
          <div className="hero">
            <div className="hero-left">
              <div className="hero-badge">✦ AI-Powered Financial Platform</div>
              <h1 className="hero-title">Multi-AI Financial<br />Decision Intelligence</h1>
              <p className="hero-sub">
                Smarter investing powered by AI. Analyze stocks, understand
                market trends, and make confident financial decisions in seconds.
              </p>
              <div className="hero-actions">
                <button className="primary-btn">Request a Demo</button>
                <button className="secondary-btn">Learn More ↓</button>
              </div>
              <div className="hero-stats">
                <div className="stat"><strong>3</strong><span>AI Agents</span></div>
                <div className="stat-divider"></div>
                <div className="stat"><strong>Live</strong><span>Stock Data</span></div>
                <div className="stat-divider"></div>
                <div className="stat"><strong>IBM</strong><span>watsonx.ai</span></div>
              </div>
            </div>
            <div className="hero-right">
              <div className="hero-img-wrapper">
                <img src={Homeimage} alt="AI Financial Analysis" />
                <div className="hero-img-glow"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="features" id="about">
          <div className="section-label">WHAT WE OFFER</div>
          <h2>Powered by Three AI Agents</h2>
          <p className="features-subtext">
            Each agent has a specific role — together they give you a complete picture.
          </p>
          <div className="features-grid">
            {[
              { icon: "📊", title: "AI Stock Analysis", desc: "Real-time stock data with intelligent AI-driven analysis and insights.", color: "blue" },
              { icon: "📈", title: "Market Agent", desc: "Determines if the market signal is Positive, Neutral, or Negative.", color: "green" },
              { icon: "⚠️", title: "Risk Agent", desc: "Evaluates investment risk levels with detailed watsonx.ai reasoning.", color: "amber" },
              { icon: "💡", title: "Recommendation Agent", desc: "Delivers a final decision with confidence score and full explanation.", color: "purple" },
            ].map((f, i) => (
              <div className={`feature-card feature-${f.color}`} key={i}>
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="cta" id="contact">
          <div className="cta-inner">
            <h2>Start Investing Smarter Today</h2>
            <p>Enter a stock symbol and let AI guide your decisions.</p>
          </div>
        </section>

        {/* Search */}
        <div className="search-wrapper">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Enter a stock symbol (e.g. AAPL, TSLA, MSFT)"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
            />
            <button onClick={handleAnalyze} disabled={loading}>
              {loading ? "Analyzing..." : "Analyze →"}
            </button>
          </div>
        </div>

        {!searched && (
          <p className="hint-text">↑ Type a symbol and press Analyze or hit Enter</p>
        )}

        {loading && (
          <div className="loader">
            <div className="loader-ring"></div>
            <div className="loader-ring ring2"></div>
            <p className="analyzing">Running AI agents on {inputValue}...</p>
            <div className="agent-steps">
              <span className="agent-step active">🛡 Risk Agent</span>
              <span className="agent-step active">💡 Recommendation Agent</span>
              <span className="agent-step active">📊 Compiling Results</span>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="error-box">⚠️ {error}</div>
        )}

        {/* Results */}
        {!loading && stock && (
          <div className="results fade-in" ref={resultsRef}>

            {/* Top Cards */}
            <div className="cards-grid">

              {/* Price Card */}
              <div className="card glass-card price-card">
                <div className="card-header">
                  <div className="ticker-badge">{stock.symbol}</div>
                  <span className={`change-badge ${isPositive ? "up" : "down"}`}>
                    {isPositive ? "▲" : "▼"} {stock.change_percent}
                  </span>
                </div>
                <div className="price-display">
                  <span className="currency">$</span>
                  <span className="price-number">{stock.price.toFixed(2)}</span>
                </div>
                <div className="price-meta">
                  <div className="meta-item">
                    <span>Market Signal</span>
                    <strong className={isPositive ? "text-green" : "text-red"}>
                      {stock.market_signal}
                    </strong>
                  </div>
                  <div className="meta-divider"></div>
                  <div className="meta-item">
                    <span>Change</span>
                    <strong className={isPositive ? "text-green" : "text-red"}>
                      {stock.change_percent}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Risk Card */}
              <div className={`card glass-card risk-card ${getRiskColor(stock.risk?.level)}`}>
                <div className="card-icon">🛡</div>
                <div className="card-label">Risk Level</div>
                <div className="card-value">{stock.risk?.level}</div>
                <div className="risk-bar-wrapper">
                  <div className={`risk-bar ${getRiskColor(stock.risk?.level)}`}
                    style={{ width: stock.risk?.level === "Low" ? "33%" : stock.risk?.level === "Medium" ? "66%" : "100%" }}>
                  </div>
                </div>
              </div>

              {/* Confidence Card */}
              <div className="card glass-card confidence-card">
                <div className="card-icon">📊</div>
                <div className="card-label">Confidence</div>
                <div className="confidence-ring">
                  <svg viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" className="ring-bg" />
                    <circle cx="50" cy="50" r="40" className="ring-fill"
                      strokeDasharray={`${(stock.recommendation?.confidence / 100) * 251} 251`} />
                  </svg>
                  <div className="confidence-number">
                    <CountUp target={stock.recommendation?.confidence} />%
                  </div>
                </div>
              </div>

              {/* Recommendation Card */}
              <div className={`card glass-card rec-card ${getDecisionColor(stock.recommendation?.decision)}`}>
                <div className="card-icon">💡</div>
                <div className="card-label">Recommendation</div>
                <div className="card-value rec-value">{stock.recommendation?.decision}</div>
                <div className="rec-tag">AI Decision</div>
              </div>
            </div>

            {/* Price Chart */}
            {history.length > 0 && (
              <div className="glass-card chart-card fade-in">
                <div className="chart-header">
                  <div>
                    <h3 className="chart-title">Price History</h3>
                    <p className="chart-sub">{stock.symbol} — last {chartRange} days</p>
                  </div>
                  <div className="chart-range-btns">
                    {[7, 14, 30].map(r => (
                      <button
                        key={r}
                        className={`range-btn ${chartRange === r ? "active" : ""}`}
                        onClick={() => setChartRange(r)}
                      >
                        {r}D
                      </button>
                    ))}
                  </div>
                </div>
                <StockChart
                  symbol={history.slice(-chartRange)}
                  darkMode={darkMode}
                />
              </div>
            )}
            {/* Analysis Cards */}
            <div className="analysis-grid">
              <div className="analysis-card glass-card">
                <div className="analysis-header">
                  <span className="analysis-icon">🛡</span>
                  <h3>Risk Analysis</h3>
                  <span className={`level-tag ${getRiskColor(stock.risk?.level)}`}>
                    {stock.risk?.level}
                  </span>
                </div>
                <p>{stock.risk?.analysis}</p>
              </div>

              <div className="analysis-card glass-card">
                <div className="analysis-header">
                  <span className="analysis-icon">💡</span>
                  <h3>Recommendation Reasoning</h3>
                  <span className={`level-tag ${getDecisionColor(stock.recommendation?.decision)}`}>
                    {stock.recommendation?.decision}
                  </span>
                </div>
                <p>{stock.recommendation?.reasoning}</p>
              </div>
            </div>

            {/* Final Decision */}
            <div className={`decision-box glass-card ${getDecisionColor(stock.recommendation?.decision)}`}>
              <div className="decision-left">
                <p className="decision-label">Final AI Decision</p>
                <h1 className="decision-title">
                  {stock.recommendation?.decision} in {stock.symbol}
                </h1>
                <p className="decision-sub">
                  Based on live market data + IBM watsonx.ai analysis
                </p>
              </div>
              <div className="decision-right">
                <div className="confidence-big">
                  <CountUp target={stock.recommendation?.confidence} />
                  <span>%</span>
                </div>
                <p>Confidence</p>
              </div>
            </div>

            {/* News Feed */}
            {news.length > 0 && (
            <div className="news-section fade-in">
              <div className="news-header">
                <div>
                  <h3 className="news-title">📰 Latest News</h3>
                  <p className="news-subtitle">Recent coverage for {stock.symbol}</p>
                </div>
                <span className="news-count">{news.length} articles</span>
              </div>
              <div className="news-list">
                {news.map((item, i) => (
                  <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" className="news-card glass-card">
                    <div className="news-index">{String(i + 1).padStart(2, "0")}</div>
                    <div className="news-card-left">
                      <div className="news-meta">
                        <span className="news-source">{item.source}</span>
                        <span className="news-dot">·</span>
                        <span className="news-date">{item.published}</span>
                        <span className={`sentiment-badge sentiment-${item.sentiment.toLowerCase()}`}>
                          {item.sentiment === "Bullish" ? "↑" : item.sentiment === "Bearish" ? "↓" : "→"} {item.sentiment}
                        </span>
                      </div>
                      <h4 className="news-item-title">{item.title}</h4>
                      <p className="news-summary">{item.summary}...</p>
                    </div>
                    <div className="news-arrow-wrapper">
                      <span className="news-arrow-icon">↗</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
            

            

          </div>
        )}

        </>
      )}
      </main>
    </div>
  );
}

export default App;