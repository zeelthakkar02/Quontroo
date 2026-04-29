import { useMemo, useState } from "react";
import "./App.css";
import Homeimage from "./IMAGES/HOMEPAGEICON.jpg";

const API_BASE = "http://127.0.0.1:8000";

function App() {
  const [inputValue, setInputValue] = useState("");
  const [marketSignal, setMarketSignal] = useState("Neutral");
  const [investorProfile, setInvestorProfile] = useState("Balanced");
  const [viewMode, setViewMode] = useState("Beginner");
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [recentSearches, setRecentSearches] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState("");

  const handleAnalyze = async (customSymbol = null) => {
    const rawValue =
      typeof customSymbol === "string" ? customSymbol : inputValue;

    const symbol = rawValue.trim().toUpperCase();
    if (!symbol) return;

    setInputValue(symbol);
    setLoading(true);
    setSearched(true);
    setStock(null);
    setError("");
    setSelectedQuestion("");

    try {
      const analysisRes = await fetch(
  `${API_BASE}/analyze?symbol=${symbol}&market_signal=${marketSignal}`
);

      const analysisData = await analysisRes.json();

      if (!analysisRes.ok) {
        throw new Error(analysisData.detail || "Failed to analyze stock");
      }

      setStock(analysisData);

      setRecentSearches((prev) => {
        const updated = [symbol, ...prev.filter((item) => item !== symbol)];
        return updated.slice(0, 5);
      });
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const isPositive = useMemo(() => {
    if (!stock?.change_percent) return true;
    return parseFloat(String(stock.change_percent).replace("%", "")) >= 0;
  }, [stock]);

  const getRiskColor = (level) => {
    if (level === "Low") return "positive";
    if (level === "Medium") return "medium";
    if (level === "High") return "negative";
    return "muted";
  };

  const formatVolume = (value) => {
    if (!value) return "N/A";
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value;
  };

  const confidence = Number(stock?.recommendation?.confidence || 0);
  const trendLabel = isPositive ? "Bullish" : "Bearish";
  const decisionText = stock?.recommendation?.decision || "Review";
  const riskLevel = stock?.risk?.level || "N/A";

  const marketSentiment = useMemo(() => {
    if (marketSignal === "Bullish") {
      return {
        label: "Positive",
        text:
          "The current market signal is supportive and aligns with stronger upside expectations.",
      };
    }
    if (marketSignal === "Bearish") {
      return {
        label: "Negative",
        text:
          "The current market signal suggests weaker sentiment and more caution in the short term.",
      };
    }
    if (marketSignal === "Volatile") {
      return {
        label: "Mixed / Volatile",
        text:
          "Conditions look unstable, which can increase uncertainty and reduce consistency in near-term decisions.",
      };
    }
    return {
      label: "Neutral",
      text:
        "The market backdrop appears balanced, with no strong directional pressure dominating the current view.",
    };
  }, [marketSignal]);

  const confidenceExplanation = useMemo(() => {
    if (confidence >= 85) {
      return "Confidence is high because the stock signal, recent movement, and agent reasoning are relatively aligned.";
    }
    if (confidence >= 70) {
      return "Confidence is moderate because the data gives a usable direction, but there is still some uncertainty in the setup.";
    }
    return "Confidence is lower because the market context and stock behavior are mixed or less predictable right now.";
  }, [confidence]);

  const riskFactors = useMemo(() => {
    const factors = [];

    if (!isPositive) {
      factors.push("Recent downward price movement is increasing short-term caution.");
    }

    if (riskLevel === "Medium") {
      factors.push("The stock shows moderate uncertainty rather than a clearly safe setup.");
    }

    if (riskLevel === "High") {
      factors.push("The risk score is elevated, which suggests larger downside concern.");
    }

    if (marketSignal === "Volatile") {
      factors.push("Volatile market conditions can reduce confidence in short-term timing.");
    }

    if (marketSignal === "Bearish") {
      factors.push("Bearish market sentiment may create additional downside pressure.");
    }

    if (factors.length === 0) {
      factors.push("No major red flags are dominating the current setup.");
    }

    return factors.slice(0, 4);
  }, [isPositive, riskLevel, marketSignal]);

  const opportunitySignals = useMemo(() => {
    const signals = [];

    if (isPositive) {
      signals.push("Positive recent movement supports a more optimistic short-term trend.");
    }

    if (marketSignal === "Bullish") {
      signals.push("Bullish market tone provides a stronger backdrop for upward momentum.");
    }

    if (riskLevel === "Low") {
      signals.push("Lower risk conditions make the setup more stable for decision-making.");
    }

    if (decisionText === "Hold") {
      signals.push("A hold signal suggests the stock may still be worth keeping under observation.");
    }

    if (decisionText === "Buy") {
      signals.push("The recommendation indicates upside potential under current conditions.");
    }

    if (signals.length === 0) {
      signals.push("Opportunity exists, but the current setup needs more confirmation before becoming stronger.");
    }

    return signals.slice(0, 4);
  }, [isPositive, marketSignal, riskLevel, decisionText]);

  const portfolioFit = useMemo(() => {
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
  }, [investorProfile, riskLevel]);

  const actionPlan = useMemo(() => {
    if (decisionText === "Buy") {
      return "Consider entering gradually, monitor the next few trading sessions, and watch whether the bullish case continues to strengthen.";
    }
    if (decisionText === "Sell") {
      return "Review your exposure, reduce risk if needed, and avoid waiting for confirmation if downside pressure continues to build.";
    }
    return "Maintain the position, monitor price behavior over the next few sessions, and wait for a clearer breakout or stronger signal before changing strategy.";
  }, [decisionText]);

  const beginnerRiskText =
    stock?.risk?.analysis || "No risk explanation returned.";
  const beginnerRecommendationText =
    stock?.recommendation?.reasoning || "No recommendation reasoning returned.";

  const expertRiskText = `${beginnerRiskText} Current risk level is ${riskLevel}, market signal is ${marketSignal}, and recent price direction appears ${trendLabel.toLowerCase()}.`;

  const expertRecommendationText = `${beginnerRecommendationText} The system currently leans ${decisionText.toLowerCase()} with ${confidence}% confidence for a ${investorProfile.toLowerCase()} investor profile.`;

  const displayedRiskText =
    viewMode === "Beginner" ? beginnerRiskText : expertRiskText;

  const displayedRecommendationText =
    viewMode === "Beginner"
      ? beginnerRecommendationText
      : expertRecommendationText;

  const followupAnswer = useMemo(() => {
    switch (selectedQuestion) {
      case "Why is the risk medium?":
        return `The risk is ${riskLevel.toLowerCase()} because the system sees a mix of caution and stability rather than a fully safe or fully dangerous setup.`;
      case "Should I buy now or wait?":
        return decisionText === "Buy"
          ? "The AI currently leans toward buying, but entering gradually is usually safer than rushing all at once."
          : "The current output suggests waiting for a clearer setup before making a stronger move.";
      case "What does hold mean?":
        return "Hold means keep the stock under observation without making a major change right now unless new signals appear.";
      case "Is this good for beginners?":
        return investorProfile === "Conservative" || investorProfile === "Balanced"
          ? "Yes, this setup can be presented in a beginner-friendly way because the dashboard explains both risk and recommendation clearly."
          : "It may be better suited for users comfortable with more volatility and faster decisions.";
      default:
        return "";
    }
  }, [selectedQuestion, riskLevel, decisionText, investorProfile]);

  const whatIfCards = useMemo(() => {
    return [
      {
        title: "If market turns Bullish",
        value:
          decisionText === "Hold" ? "Could shift toward Buy" : "Confidence may improve",
      },
      {
        title: "If price drops 5%",
        value:
          riskLevel === "High" ? "Risk likely rises further" : "Would increase caution",
      },
      {
        title: "If volatility increases",
        value: "Confidence may decrease and timing becomes harder",
      },
    ];
  }, [decisionText, riskLevel]);

  return (
    <div className="app">
      <div className="background-overlay"></div>

      <header className="navbar">
        <div className="logo">
          <div className="logo-icon">AI</div>
          <div className="logo-text">
            <h1>Quontro</h1>
            <span>Finance</span>
          </div>
        </div>

        <nav>
          <a href="#home">Home</a>
          <a href="#about">Features</a>
          <a href="#dashboard">Analyze</a>
        </nav>
      </header>

      <main className="main-content">
        <section className="home" id="home">
          <div className="hero">
            <div className="hero-left">
              <span className="eyebrow">AI Financial Intelligence</span>
              <h1>Analyze stocks with AI agents</h1>
              <p>
                Search a stock symbol and get a coordinated AI decision with
                risk, confidence, sentiment, action planning, and explainable reasoning.
              </p>

              <div className="hero-actions">
                <a className="primary-btn" href="#dashboard">
                  Analyze Stock
                </a>
                <a className="secondary-btn" href="#about">
                  View Features
                </a>
              </div>

              <div className="hero-badge">
                <span className="badge-dot"></span>
                Multi-Agent Analysis Active
              </div>
            </div>

            <div className="hero-right">
              <img src={Homeimage} alt="AI Financial Analysis" />
            </div>
          </div>
        </section>

        <section className="features" id="about">
          <h2>AI features built for smarter stock decisions</h2>
          <p className="features-subtext">
            This dashboard goes beyond a basic stock lookup by adding decision support,
            sentiment, personalized investor profiles, and explainable AI output.
          </p>

          <div className="features-grid">
            <div className="feature-card">
              <h3>Investor Profiles</h3>
              <p>Tailors output for conservative, balanced, or aggressive users.</p>
            </div>
            <div className="feature-card">
              <h3>AI Sentiment</h3>
              <p>Shows whether the market backdrop is positive, negative, or neutral.</p>
            </div>
            <div className="feature-card">
              <h3>Action Planning</h3>
              <p>Gives the user a next-step idea instead of only Buy, Hold, or Sell.</p>
            </div>
            <div className="feature-card">
              <h3>Explainable Output</h3>
              <p>Provides beginner and expert style explanations for the same decision.</p>
            </div>
          </div>
        </section>

        <section className="dashboard" id="dashboard">
          <div className="dashboard-header">
            <div>
              <span className="eyebrow">Stock Analyzer</span>
              <h2>Run AI analysis</h2>
              <p>Enter one stock symbol and get a richer AI-powered decision system.</p>
            </div>
          </div>

          <div className="search-panel">
            <div className="field-group symbol-field">
              <label>Stock Symbol</label>
              <input
                type="text"
                placeholder="AAPL, TSLA, MSFT"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              />
              <span className="field-hint">Try AAPL, NVDA, TSLA, AMZN</span>
            </div>

            <div className="field-group">
              <label>Market Signal</label>
              <select
                value={marketSignal}
                onChange={(e) => setMarketSignal(e.target.value)}
              >
                <option>Neutral</option>
                <option>Bullish</option>
                <option>Bearish</option>
                <option>Volatile</option>
              </select>
            </div>

            <div className="field-group">
              <label>Investor Profile</label>
              <select
                value={investorProfile}
                onChange={(e) => setInvestorProfile(e.target.value)}
              >
                <option>Conservative</option>
                <option>Balanced</option>
                <option>Aggressive</option>
              </select>
            </div>

            <button
              className="analyze-btn"
              onClick={() => handleAnalyze()}
              disabled={loading}
            >
              {loading ? "Analyzing..." : "Analyze"}
            </button>
          </div>

          <div className="view-toggle-row">
            <span className="view-toggle-label">Explanation Mode</span>
            <div className="view-toggle">
              <button
                className={viewMode === "Beginner" ? "toggle-btn active-toggle" : "toggle-btn"}
                onClick={() => setViewMode("Beginner")}
              >
                Beginner
              </button>
              <button
                className={viewMode === "Expert" ? "toggle-btn active-toggle" : "toggle-btn"}
                onClick={() => setViewMode("Expert")}
              >
                Expert
              </button>
            </div>
          </div>

          {recentSearches.length > 0 && (
            <div className="recent-searches">
              <h4>Recent Searches</h4>
              <div className="search-tags">
                {recentSearches.map((item) => (
                  <button
                    key={item}
                    className="search-tag"
                    onClick={() => handleAnalyze(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!searched && (
            <div className="empty-state-card">
              <h3>Ready to analyze</h3>
              <p>Enter a stock symbol to generate an AI-powered result.</p>
            </div>
          )}

          {loading && (
            <div className="loader-card">
              <div className="spinner"></div>
              <div className="loader-steps">
                <p>Fetching stock data...</p>
                <p>Assessing risk...</p>
                <p>Generating recommendation...</p>
                <p>Preparing AI insights...</p>
              </div>
            </div>
          )}

          {error && !loading && <p className="error-message">{error}</p>}

          {!loading && stock && (
            <div className="results fade-in">
              <div className="summary-strip">
                <div className="summary-pill">
                  <span>Trend</span>
                  <strong>{trendLabel}</strong>
                </div>
                <div className="summary-pill">
                  <span>Risk</span>
                  <strong>{riskLevel}</strong>
                </div>
                <div className="summary-pill">
                  <span>Action</span>
                  <strong>{decisionText}</strong>
                </div>
                <div className="summary-pill">
                  <span>Confidence</span>
                  <strong>{confidence}%</strong>
                </div>
              </div>

              <div className="overview-grid">
                <div className="metric-card main-metric">
                  <span className="metric-label">{stock.symbol}</span>
                  <h3>
                    ${Number(stock.price || 0).toFixed(2)}
                    <span className={isPositive ? "up" : "down"}>
                      {isPositive ? "▲" : "▼"}
                    </span>
                  </h3>
                  <p className={isPositive ? "positive" : "negative"}>
                    {stock.change_percent} today
                  </p>
                </div>

                <div className="metric-card">
                  <span className="metric-label">Risk Level</span>
                  <h3 className={getRiskColor(riskLevel)}>{riskLevel}</h3>
                  <p>AI risk assessment</p>
                </div>

                <div className="metric-card">
                  <span className="metric-label">Recommendation</span>
                  <h3>{decisionText}</h3>
                  <p>{confidence}% confidence</p>
                </div>

                <div className="metric-card">
                  <span className="metric-label">Volume</span>
                  <h3>{formatVolume(stock.volume)}</h3>
                  <p>Previous close: ${Number(stock.previous_close || 0).toFixed(2)}</p>
                </div>
              </div>

              <div className="smart-grid two-col">
                <div className="info-card sentiment-card">
                  <div className="card-head">
                    <span className="card-icon">🧠</span>
                    <h3>AI Market Sentiment</h3>
                  </div>
                  <div className="big-badge">{marketSentiment.label}</div>
                  <p>{marketSentiment.text}</p>
                </div>

                <div className="info-card confidence-card">
                  <div className="card-head">
                    <span className="card-icon">📊</span>
                    <h3>Confidence Explanation</h3>
                  </div>
                  <div className="confidence-top">
                    <span>{confidence}%</span>
                  </div>
                  <div className="confidence-bar">
                    <div
                      className="confidence-fill"
                      style={{ width: `${confidence}%` }}
                    ></div>
                  </div>
                  <p>{confidenceExplanation}</p>
                </div>
              </div>

              <div className="analysis-section">
                <div className="analysis-card risk-card">
                  <div className="analysis-head">
                    <span className="analysis-icon">⚠️</span>
                    <h3>Risk Description</h3>
                  </div>
                  <p>{displayedRiskText}</p>
                </div>

                <div className="analysis-card recommendation-card">
                  <div className="analysis-head">
                    <span className="analysis-icon">💡</span>
                    <h3>Recommendation Description</h3>
                  </div>
                  <p>{displayedRecommendationText}</p>
                </div>
              </div>

              <div className="smart-grid three-col">
                <div className="info-card list-card">
                  <div className="card-head">
                    <span className="card-icon">🚨</span>
                    <h3>Risk Factors</h3>
                  </div>
                  <ul>
                    {riskFactors.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="info-card list-card">
                  <div className="card-head">
                    <span className="card-icon">✨</span>
                    <h3>Opportunity Signals</h3>
                  </div>
                  <ul>
                    {opportunitySignals.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="info-card profile-card">
                  <div className="card-head">
                    <span className="card-icon">🎯</span>
                    <h3>Portfolio Fit</h3>
                  </div>
                  <div className="profile-badge">{investorProfile} Profile</div>
                  <p>{portfolioFit}</p>
                </div>
              </div>

              <div className="smart-grid two-col">
                <div className="info-card action-card">
                  <div className="card-head">
                    <span className="card-icon">🛠</span>
                    <h3>Suggested Action Plan</h3>
                  </div>
                  <p>{actionPlan}</p>
                </div>

                <div className="info-card question-card">
                  <div className="card-head">
                    <span className="card-icon">💬</span>
                    <h3>Ask the AI</h3>
                  </div>
                  <div className="question-chips">
                    {[
                      "Why is the risk medium?",
                      "Should I buy now or wait?",
                      "What does hold mean?",
                      "Is this good for beginners?",
                    ].map((question) => (
                      <button
                        key={question}
                        className={
                          selectedQuestion === question
                            ? "question-chip active-question"
                            : "question-chip"
                        }
                        onClick={() => setSelectedQuestion(question)}
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                  {followupAnswer && <div className="question-answer">{followupAnswer}</div>}
                </div>
              </div>

              <div className="whatif-section">
                <div className="section-title-row">
                  <h3>What-If Simulation</h3>
                </div>
                <div className="whatif-grid">
                  {whatIfCards.map((card) => (
                    <div key={card.title} className="whatif-card">
                      <span>{card.title}</span>
                      <strong>{card.value}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="decision-box">
                <span className="decision-label">AI Final Decision</span>
                <h2>
                  {decisionText} {stock.symbol}
                </h2>
                <p className="decision-confidence">Confidence: {confidence}%</p>
                <div className="decision-subtext">
                  {riskLevel} risk with {trendLabel.toLowerCase()} trend conditions detected for a{" "}
                  {investorProfile.toLowerCase()} investor profile.
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
