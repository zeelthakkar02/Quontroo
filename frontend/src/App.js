import { useState, useEffect, useRef, useMemo } from "react";
import "./App.css";
import SecurityImage from "./IMAGES/security.png";
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
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [target, duration]);

  return <span>{count}</span>;
}

const API_BASE = "https://quontro-backend-0pic.onrender.com";
console.log("API_BASE =", API_BASE);

function App() {
  const [inputValue, setInputValue] = useState("");
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [history, setHistory] = useState([]);
  const [chartRange, setChartRange] = useState(30);
  const [page, setPage] = useState("home");
  const [marketSignal, setMarketSignal] = useState("Neutral");
  const [investorProfile, setInvestorProfile] = useState("Balanced");
  const [viewMode, setViewMode] = useState("Beginner");
  const [recentSearches, setRecentSearches] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState("");
  const resultsRef = useRef(null);

  useEffect(() => {
    document.body.className = darkMode ? "dark" : "light";
  }, [darkMode]);

  const handleLearnMore = () => {
    setPage("home");
    setTimeout(() => {
      document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  const buildFallbackStock = (data, symbol) => ({
    symbol: data.symbol || symbol,
    price: data.price ?? 0,
    change: data.change ?? 0,
    change_percent: data.change_percent || "0%",
    market_signal: marketSignal,
    risk: {
      level: "N/A",
      analysis: "AI analysis is temporarily unavailable. Showing live stock data only."
    },
    recommendation: {
      decision: "Live Data Only",
      confidence: 0,
      reasoning:
        "The AI analysis endpoint is currently unavailable, so the app is showing the latest stock price and chart data instead."
    }
  });

  const handleAnalyze = async (customSymbol = null) => {
    const rawValue = typeof customSymbol === "string" ? customSymbol : inputValue;
    const symbol = rawValue.trim().toUpperCase();
    if (!symbol) return;

    setInputValue(symbol);
    setLoading(true);
    setSearched(true);
    setStock(null);
    setHistory([]);
    setError("");
    setSelectedQuestion("");

    const historyPromise = fetch(`${API_BASE}/history?symbol=${symbol}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.history) setHistory(d.history);
        else setHistory([]);
      })
      .catch(() => setHistory([]));

    try {
      const analyzeRes = await fetch(
        `${API_BASE}/analyze?symbol=${symbol}&market_signal=${marketSignal}`
      );

      const analyzeData = await analyzeRes.json();

      if (!analyzeRes.ok) {
        throw new Error(analyzeData.detail || "Analyze endpoint failed");
      }

      setStock(analyzeData);

      setRecentSearches((prev) => {
        const updated = [symbol, ...prev.filter((s) => s !== symbol)];
        return updated.slice(0, 5);
      });

      await historyPromise;

      setTimeout(() => {
        setLoading(false);
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }, 700);
    } catch (analyzeErr) {
      console.warn("Analyze failed, falling back to /stock:", analyzeErr.message);

      try {
        const stockRes = await fetch(`${API_BASE}/stock?symbol=${symbol}`);
        const stockData = await stockRes.json();

        if (!stockRes.ok) {
          throw new Error(stockData.detail || "Stock endpoint failed");
        }

        setStock(buildFallbackStock(stockData, symbol));

        setRecentSearches((prev) => {
          const updated = [symbol, ...prev.filter((s) => s !== symbol)];
          return updated.slice(0, 5);
        });

        await historyPromise;

        setTimeout(() => {
          setLoading(false);
          setTimeout(() => {
            resultsRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }, 700);
      } catch (stockErr) {
        setLoading(false);
        setError(stockErr.message || "Failed to fetch stock data.");
      }
    }
  };

  const isPositive = useMemo(() => {
    if (!stock?.change_percent) return true;
    return parseFloat(String(stock.change_percent).replace("%", "")) >= 0;
  }, [stock]);

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

  const confidence = Number(stock?.recommendation?.confidence || 0);
  const trendLabel = isPositive ? "Bullish" : "Bearish";
  const decisionText = stock?.recommendation?.decision || "N/A";
  const riskLevel = stock?.risk?.level || "N/A";

  const marketSentiment = useMemo(() => {
    if (marketSignal === "Bullish") {
      return {
        label: "Positive",
        text: "The current market signal is supportive and aligns with stronger upside expectations."
      };
    }
    if (marketSignal === "Bearish") {
      return {
        label: "Negative",
        text: "The current market signal suggests weaker sentiment and more caution in the short term."
      };
    }
    if (marketSignal === "Volatile") {
      return {
        label: "Mixed / Volatile",
        text: "Conditions look unstable, which can increase uncertainty and reduce consistency in near-term decisions."
      };
    }
    return {
      label: "Neutral",
      text: "The market backdrop appears balanced, with no strong directional pressure dominating the current view."
    };
  }, [marketSignal]);

  const confidenceExplanation = useMemo(() => {
    if (decisionText === "Live Data Only") {
      return "AI confidence is unavailable right now because the app fell back to the live stock endpoint.";
    }
    if (confidence >= 85) {
      return "Confidence is high because the stock signal, recent movement, and agent reasoning are relatively aligned.";
    }
    if (confidence >= 70) {
      return "Confidence is moderate because the data gives a usable direction, but there is still some uncertainty in the setup.";
    }
    return "Confidence is lower because the market context and stock behavior are mixed or less predictable right now.";
  }, [confidence, decisionText]);

  const riskFactors = useMemo(() => {
    const factors = [];
    if (!isPositive) factors.push("Recent downward price movement is increasing short-term caution.");
    if (riskLevel === "Medium") factors.push("The stock shows moderate uncertainty rather than a clearly safe setup.");
    if (riskLevel === "High") factors.push("The risk score is elevated, which suggests larger downside concern.");
    if (marketSignal === "Volatile") factors.push("Volatile market conditions can reduce confidence in short-term timing.");
    if (marketSignal === "Bearish") factors.push("Bearish market sentiment may create additional downside pressure.");
    if (decisionText === "Live Data Only") factors.push("AI-generated risk scoring is temporarily unavailable.");
    if (factors.length === 0) factors.push("No major red flags are dominating the current setup.");
    return factors.slice(0, 4);
  }, [isPositive, riskLevel, marketSignal, decisionText]);

  const opportunitySignals = useMemo(() => {
    const signals = [];
    if (isPositive) signals.push("Positive recent movement supports a more optimistic short-term trend.");
    if (marketSignal === "Bullish") signals.push("Bullish market tone provides a stronger backdrop for upward momentum.");
    if (riskLevel === "Low") signals.push("Lower risk conditions make the setup more stable for decision-making.");
    if (decisionText === "Hold") signals.push("A hold signal suggests the stock may still be worth keeping under observation.");
    if (decisionText === "Invest") signals.push("The recommendation indicates upside potential under current conditions.");
    if (decisionText === "Live Data Only") signals.push("Live stock data is available even though AI analysis is temporarily unavailable.");
    if (signals.length === 0) signals.push("Opportunity exists, but the current setup needs more confirmation before becoming stronger.");
    return signals.slice(0, 4);
  }, [isPositive, marketSignal, riskLevel, decisionText]);

  const portfolioFit = useMemo(() => {
    if (decisionText === "Live Data Only") {
      return "This view still helps you track price movement and chart trends while AI analysis is temporarily unavailable.";
    }
    if (investorProfile === "Conservative") {
      if (riskLevel === "Low") {
        return "Suitable for conservative investors who prioritize stability and controlled risk.";
      }
      return "Only a moderate fit for conservative investors because the current risk is not especially low.";
    }
    if (investorProfile === "Aggressive") {
      return "Suitable for aggressive investors who can tolerate more uncertainty for potential upside.";
    }
    return "A reasonable fit for balanced investors looking for a mix of opportunity and controlled risk.";
  }, [investorProfile, riskLevel, decisionText]);

  const actionPlan = useMemo(() => {
    if (decisionText === "Invest") {
      return "Consider entering gradually, monitor the next few trading sessions, and watch whether the bullish case continues to strengthen.";
    }
    if (decisionText === "Avoid") {
      return "Review your exposure, reduce risk if needed, and avoid waiting for confirmation if downside pressure continues to build.";
    }
    if (decisionText === "Live Data Only") {
      return "Use the live price and chart for now, and retry later when the AI analysis endpoint is available.";
    }
    return "Maintain the position, monitor price behavior over the next few sessions, and wait for a clearer breakout or stronger signal before changing strategy.";
  }, [decisionText]);

  const whatIfCards = useMemo(
    () => [
      { title: "If market turns Bullish", value: decisionText === "Hold" ? "Could shift toward Invest" : "Confidence may improve" },
      { title: "If price drops 5%", value: riskLevel === "High" ? "Risk likely rises further" : "Would increase caution" },
      { title: "If volatility increases", value: "Confidence may decrease and timing becomes harder" }
    ],
    [decisionText, riskLevel]
  );

  const followupAnswer = useMemo(() => {
    switch (selectedQuestion) {
      case "Why is the risk medium?":
        return `The risk is ${riskLevel.toLowerCase()} because the system sees a mix of caution and stability rather than a fully safe or fully dangerous setup.`;
      case "Should I buy now or wait?":
        return decisionText === "Invest"
          ? "The AI currently leans toward investing, but entering gradually is usually safer than rushing all at once."
          : "The current output suggests waiting for a clearer setup before making a stronger move.";
      case "What does hold mean?":
        return "Hold means keep the stock under observation without making a major change right now unless new signals appear.";
      case "Is this good for beginners?":
        return investorProfile === "Conservative" || investorProfile === "Balanced"
          ? "Yes, this setup can work for beginners because the dashboard explains both risk and recommendation clearly."
          : "It may be better suited for users comfortable with more volatility and faster decisions.";
      default:
        return "";
    }
  }, [selectedQuestion, riskLevel, decisionText, investorProfile]);

  const displayedRiskText =
    viewMode === "Beginner"
      ? stock?.risk?.analysis || ""
      : `${stock?.risk?.analysis || ""} Current risk level is ${riskLevel}, market signal is ${marketSignal}, and recent price direction appears ${trendLabel.toLowerCase()}.`;

  const displayedRecommendationText =
    viewMode === "Beginner"
      ? stock?.recommendation?.reasoning || ""
      : `${stock?.recommendation?.reasoning || ""} The system currently leans ${decisionText.toLowerCase()} with ${confidence}% confidence for a ${investorProfile.toLowerCase()} investor profile.`;

  return (
    <div className={`app ${darkMode ? "dark" : "light"}`}>
      <div className="bg-gradient"></div>
      <div className="bg-grid"></div>

      <header className="navbar">
        <div className="logo">
          <div className="logo-icon">Q</div>
          <div className="logo-text">
            <h1>QUONTRO</h1>
            <span>Finance</span>
          </div>
        </div>
        <nav>
          <a href="#home" onClick={() => setPage("home")} className={page === "home" ? "nav-active" : ""}>Home</a>
          <a
            href="#about"
            onClick={(e) => {
              e.preventDefault();
              handleLearnMore();
            }}
            className={page === "home" ? "nav-active" : ""}
          >
            About
          </a>
          <button className="nav-compare-btn" onClick={() => setPage("compare")}>Compare</button>
          <button className="nav-watchlist-btn" onClick={() => setPage("watchlist")}>Watchlist</button>
        </nav>
        <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? "Light" : "Dark"}
        </button>
      </header>

      <main className="main-content">
        {page === "compare" ? (
          <Compare darkMode={darkMode} />
        ) : page === "watchlist" ? (
          <Watchlist
            onNavigateHome={(symbol) => {
              setPage("home");
              setInputValue(symbol);
              setTimeout(() => document.querySelector(".search-box button")?.click(), 300);
            }}
          />
        ) : (
          <>
            <section className="home" id="home">
              <div className="hero">
                <div className="hero-left">
                  <div className="hero-badge">✦ AI-Powered Financial Platform</div>
                  <h1 className="hero-title" style={{ paddingBottom: "0.1em", overflow: "visible" }}>
                    Multi-AI Financial<br />Decision Intelligence
                  </h1>
                  <p className="hero-sub">
                    Smarter investing powered by AI. Analyze stocks, understand
                    market trends, and make confident financial decisions in seconds.
                  </p>
                  <div className="hero-actions">
                    <button className="secondary-btn" onClick={handleLearnMore}>
                      Learn More ↓
                    </button>
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
                  <div className="hero-img-wrapper anim-container">
                    <img src={SecurityImage} alt="AI Financial Security" />
                    <div className="gear-overlay g-top"></div>
                    <div className="gear-overlay g-left"></div>
                    <div className="gear-overlay g-bottom"></div>
                    <div className="scan-beam"></div>
                    <div className="lock-shackle"></div>
                    <div className="hero-img-glow"></div>
                  </div>
                </div>
              </div>
            </section>

            <section className="features" id="about">
              <div className="section-label">What We Offer</div>
              <h2>Powered by Three AI Agents</h2>
              <p className="features-subtext">Each agent has a specific role — together they give you a complete picture.</p>
              <div className="features-grid">
                {[
                  { icon: "📊", title: "AI Stock Analysis", desc: "Real-time stock data with intelligent AI-driven analysis and insights." },
                  { icon: "📈", title: "Market Agent", desc: "Determines if the market signal is Positive, Neutral, or Negative." },
                  { icon: "⚠️", title: "Risk Agent", desc: "Evaluates investment risk levels with detailed watsonx.ai reasoning." },
                  { icon: "💡", title: "Recommendation Agent", desc: "Delivers a final decision with confidence score and full explanation." }
                ].map((f, i) => (
                  <div className="feature-card" key={i}>
                    <div className="feature-icon">{f.icon}</div>
                    <h3>{f.title}</h3>
                    <p>{f.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="cta" id="contact">
              <div className="cta-inner">
                <h2>Start Investing Smarter Today</h2>
                <p>Enter a stock symbol and let AI guide your decisions.</p>
              </div>
            </section>

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
                <button onClick={() => handleAnalyze()} disabled={loading}>
                  {loading ? "Analyzing..." : "Analyze →"}
                </button>
              </div>

              <div className="controls-row">
                <div className="control-group">
                  <label>Market Signal</label>
                  <select value={marketSignal} onChange={(e) => setMarketSignal(e.target.value)}>
                    <option>Neutral</option>
                    <option>Bullish</option>
                    <option>Bearish</option>
                    <option>Volatile</option>
                  </select>
                </div>
                <div className="control-group">
                  <label>Investor Profile</label>
                  <select value={investorProfile} onChange={(e) => setInvestorProfile(e.target.value)}>
                    <option>Conservative</option>
                    <option>Balanced</option>
                    <option>Aggressive</option>
                  </select>
                </div>
                <div className="control-group">
                  <label>Explanation Mode</label>
                  <div className="view-toggle">
                    <button className={viewMode === "Beginner" ? "toggle-btn active-toggle" : "toggle-btn"} onClick={() => setViewMode("Beginner")}>
                      Beginner
                    </button>
                    <button className={viewMode === "Expert" ? "toggle-btn active-toggle" : "toggle-btn"} onClick={() => setViewMode("Expert")}>
                      Expert
                    </button>
                  </div>
                </div>
              </div>

              {recentSearches.length > 0 && (
                <div className="recent-searches">
                  <span>Recent:</span>
                  {recentSearches.map((s) => (
                    <button key={s} className="recent-tag" onClick={() => handleAnalyze(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!searched && <p className="hint-text">Type a symbol and press Analyze or hit Enter</p>}

            {loading && (
              <div className="loader">
                <div className="loader-ring"></div>
                <div className="loader-ring ring2"></div>
                <p className="analyzing">Running stock analysis on {inputValue}...</p>
                <div className="agent-steps">
                  <span className="agent-step">🛡 Trying AI Analysis</span>
                  <span className="agent-step">📊 Falling back to Live Data if needed</span>
                  <span className="agent-step">📈 Loading Price History</span>
                </div>
              </div>
            )}

            {error && !loading && <div className="error-box">⚠️ {error}</div>}

            {!loading && stock && (
              <div className="results fade-in" ref={resultsRef}>
                <div className="summary-strip">
                  <div className="summary-pill"><span>Trend</span><strong>{trendLabel}</strong></div>
                  <div className="summary-pill"><span>Risk</span><strong>{riskLevel}</strong></div>
                  <div className="summary-pill"><span>Action</span><strong>{decisionText}</strong></div>
                  <div className="summary-pill"><span>Confidence</span><strong>{confidence}%</strong></div>
                  <div className="summary-pill"><span>Profile</span><strong>{investorProfile}</strong></div>
                  <div className="summary-pill"><span>Market</span><strong>{marketSignal}</strong></div>
                </div>

                <div className="cards-grid">
                  <div className="card glass-card price-card">
                    <div className="card-header">
                      <div className="ticker-badge">{stock.symbol}</div>
                      <span className={`change-badge ${isPositive ? "up" : "down"}`}>
                        {isPositive ? "▲" : "▼"} {stock.change_percent}
                      </span>
                    </div>
                    <div className="price-display">
                      <span className="currency">$</span>
                      <span className="price-number">{Number(stock.price || 0).toFixed(2)}</span>
                    </div>
                    <div className="price-meta">
                      <div className="meta-item">
                        <span>Market Signal</span>
                        <strong className={isPositive ? "text-green" : "text-red"}>{stock.market_signal}</strong>
                      </div>
                      <div className="meta-divider"></div>
                      <div className="meta-item">
                        <span>Change</span>
                        <strong className={isPositive ? "text-green" : "text-red"}>{stock.change_percent}</strong>
                      </div>
                    </div>
                  </div>

                  <div className={`card glass-card risk-card ${getRiskColor(stock.risk?.level)}`}>
                    <div className="card-icon">🛡</div>
                    <div className="card-label">Risk Level</div>
                    <div className="card-value">{stock.risk?.level}</div>
                    <div className="risk-bar-wrapper">
                      <div
                        className={`risk-bar ${getRiskColor(stock.risk?.level)}`}
                        style={{
                          width:
                            stock.risk?.level === "Low"
                              ? "33%"
                              : stock.risk?.level === "Medium"
                              ? "66%"
                              : stock.risk?.level === "High"
                              ? "100%"
                              : "0%"
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="card glass-card confidence-card">
                    <div className="card-icon">📊</div>
                    <div className="card-label">Confidence</div>
                    <div className="confidence-ring">
                      <svg viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" className="ring-bg" />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          className="ring-fill"
                          strokeDasharray={`${(confidence / 100) * 251} 251`}
                        />
                      </svg>
                      <div className="confidence-number"><CountUp target={confidence} />%</div>
                    </div>
                  </div>

                  <div className={`card glass-card rec-card ${getDecisionColor(stock.recommendation?.decision)}`}>
                    <div className="card-icon">💡</div>
                    <div className="card-label">Recommendation</div>
                    <div className="card-value rec-value">{stock.recommendation?.decision}</div>
                    <div className="rec-tag">AI Decision</div>
                  </div>
                </div>

                {history.length > 0 && (
                  <div className="glass-card chart-card fade-in">
                    <div className="chart-header">
                      <div>
                        <h3 className="chart-title">Price History</h3>
                        <p className="chart-sub">{stock.symbol} — last {chartRange} days</p>
                      </div>
                      <div className="chart-range-btns">
                        {[7, 14, 30].map((r) => (
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
                    <StockChart symbol={history.slice(-chartRange)} darkMode={darkMode} />
                  </div>
                )}

                <div className="two-col-grid">
                  <div className="glass-card info-pad">
                    <div className="info-head"><span>🧠</span><h3>AI Market Sentiment</h3></div>
                    <div className={`big-badge ${isPositive ? "badge-green" : "badge-red"}`}>{marketSentiment.label}</div>
                    <p className="info-text">{marketSentiment.text}</p>
                  </div>
                  <div className="glass-card info-pad">
                    <div className="info-head"><span>📊</span><h3>Confidence Explanation</h3></div>
                    <div className="conf-bar-wrapper">
                      <span className="conf-num">{confidence}%</span>
                      <div className="conf-bar"><div className="conf-fill" style={{ width: `${confidence}%` }}></div></div>
                    </div>
                    <p className="info-text">{confidenceExplanation}</p>
                  </div>
                </div>

                <div className="analysis-grid">
                  <div className="analysis-card glass-card">
                    <div className="analysis-header">
                      <span className="analysis-icon">🛡</span>
                      <h3>Risk Analysis</h3>
                      <span className={`level-tag ${getRiskColor(stock.risk?.level)}`}>{stock.risk?.level}</span>
                    </div>
                    <p>{displayedRiskText}</p>
                  </div>
                  <div className="analysis-card glass-card">
                    <div className="analysis-header">
                      <span className="analysis-icon">💡</span>
                      <h3>Recommendation Reasoning</h3>
                      <span className={`level-tag ${getDecisionColor(stock.recommendation?.decision)}`}>{stock.recommendation?.decision}</span>
                    </div>
                    <p>{displayedRecommendationText}</p>
                  </div>
                </div>

                <div className="three-col-grid">
                  <div className="glass-card info-pad">
                    <div className="info-head"><span>🚨</span><h3>Risk Factors</h3></div>
                    <ul className="info-list">
                      {riskFactors.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                  <div className="glass-card info-pad">
                    <div className="info-head"><span>✨</span><h3>Opportunity Signals</h3></div>
                    <ul className="info-list">
                      {opportunitySignals.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                  <div className="glass-card info-pad">
                    <div className="info-head"><span>🎯</span><h3>Portfolio Fit</h3></div>
                    <div className="profile-badge-pill">{investorProfile} Profile</div>
                    <p className="info-text">{portfolioFit}</p>
                  </div>
                </div>

                <div className="two-col-grid">
                  <div className="glass-card info-pad">
                    <div className="info-head"><span>🛠</span><h3>Suggested Action Plan</h3></div>
                    <p className="info-text">{actionPlan}</p>
                  </div>
                  <div className="glass-card info-pad">
                    <div className="info-head"><span>💬</span><h3>Ask the AI</h3></div>
                    <div className="question-chips">
                      {["Why is the risk medium?","Should I buy now or wait?","What does hold mean?","Is this good for beginners?"].map((q) => (
                        <button
                          key={q}
                          className={`question-chip ${selectedQuestion === q ? "active-question" : ""}`}
                          onClick={() => setSelectedQuestion(q)}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                    {followupAnswer && <div className="question-answer">{followupAnswer}</div>}
                  </div>
                </div>

                <div className="glass-card info-pad">
                  <div className="info-head"><span>🔮</span><h3>What-If Simulation</h3></div>
                  <div className="whatif-grid">
                    {whatIfCards.map((card) => (
                      <div key={card.title} className="whatif-card">
                        <span>{card.title}</span>
                        <strong>{card.value}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`decision-box glass-card ${getDecisionColor(stock.recommendation?.decision)}`}>
                  <div className="decision-left">
                    <p className="decision-label">Final AI Decision</p>
                    <h1 className="decision-title">{stock.recommendation?.decision} in {stock.symbol}</h1>
                    <p className="decision-sub">Based on live market data + IBM watsonx.ai analysis</p>
                    <p className="decision-sub">{riskLevel} risk · {trendLabel} trend · {investorProfile} profile</p>
                  </div>
                  <div className="decision-right">
                    <div className="confidence-big"><CountUp target={confidence} /><span>%</span></div>
                    <p>Confidence</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;