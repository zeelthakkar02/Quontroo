import { useState } from "react";
import "./App.css";
import Homeimage from "./IMAGES/HOMEPAGEICON.jpg";

function App() {
  const [inputValue, setInputValue] = useState("");
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    if (!inputValue.trim()) return;

    setLoading(true);
    setSearched(true);
    setStock(null);
    setError("");

    try {
      // ← now calling /analyze instead of /stock
      const res = await fetch(
        `http://127.0.0.1:8000/analyze?symbol=${inputValue.trim()}&market_signal=Neutral`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to fetch stock data");
      }

      setTimeout(() => {
        setStock(data);
        setLoading(false);
      }, 1200);
    } catch (err) {
      setLoading(false);
      setError(err.message);
    }
  };

  const isPositive = stock ? parseFloat(stock.change_percent) >= 0 : true;

  const getRiskColor = (level) => {
    if (!level) return "";
    if (level === "Low") return "positive";
    if (level === "Medium") return "medium";
    if (level === "High") return "negative";
    return "";
  };

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
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <main className="main-content">
        <section className="home" id="home">
          <div className="hero">
            <div className="hero-left">
              <h2>AI-Powered Financial Platform</h2>
              <h1>Multi-AI Financial Decision Intelligence</h1>
              <p>
                Smarter investing powered by AI. Analyze stocks, understand
                market trends, and make confident financial decisions in seconds.
              </p>
              <div className="hero-actions">
                <button className="primary-btn">Request a Demo</button>
                <button className="secondary-btn">Learn More</button>
              </div>
            </div>
            <div className="hero-right">
              <img src={Homeimage} alt="AI Financial Analysis" />
            </div>
          </div>
        </section>

        <section className="features" id="about">
          <h2>What We Offer</h2>
          <p className="features-subtext">
            Powerful AI tools to help you understand stocks, evaluate risk, and
            make smarter investment choices with confidence.
          </p>
          <div className="features-grid">
            <div className="feature-card">
              <h3>📊 AI Stock Analysis</h3>
              <p>Get real-time insights on stocks with intelligent AI-driven analysis and predictions.</p>
            </div>
            <div className="feature-card">
              <h3>📈 Market Trends</h3>
              <p>Understand whether the market is bullish or bearish with clear, simple indicators.</p>
            </div>
            <div className="feature-card">
              <h3>⚠️ Risk Assessment</h3>
              <p>Evaluate investment risk levels so you can make safer financial decisions.</p>
            </div>
            <div className="feature-card">
              <h3>💡 Smart Recommendations</h3>
              <p>Receive actionable suggestions based on AI insights and market behavior.</p>
            </div>
          </div>
        </section>

        <section className="cta" id="contact">
          <h2>Start Investing Smarter Today</h2>
          <p>Enter a stock symbol and let AI guide your decisions.</p>
        </section>

        <div className="search-box">
          <input
            type="text"
            placeholder="Enter a stock symbol (e.g. AAPL)"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
          />
          <button onClick={handleAnalyze}>Analyze</button>
        </div>

        {!searched && (
          <p className="analyzing">Enter a stock symbol and press Analyze</p>
        )}

        {loading && (
          <div className="loader">
            <div className="spinner"></div>
            <p className="analyzing">
              Analyzing {inputValue.trim().toUpperCase()} with AI agents...
            </p>
          </div>
        )}

        {error && !loading && <p className="error-message">{error}</p>}

        {!loading && stock && (
          <>
            <div className="cards-grid fade-in">
              {/* Price Card */}
              <div className="card large-card">
                <div className="card-top">
                  <div className="icon teal">🛢</div>
                  <div>
                    <h3>{stock.symbol}</h3>
                    <h1>
                      ${stock.price.toFixed(2)}{" "}
                      <span className={isPositive ? "up" : "down"}>
                        {isPositive ? "▲" : "▼"}
                      </span>
                    </h1>
                  </div>
                </div>
                <div className="mini-card">
                  <p>Change:</p>
                  <h4>
                    {stock.change_percent}{" "}
                    <span className={isPositive ? "up" : "down"}>
                      {isPositive ? "▲" : "▼"}
                    </span>
                  </h4>
                </div>
                <div className="mini-card">
                  <p>Market Signal:</p>
                  <h4 className={isPositive ? "positive" : "negative"}>
                    {stock.market_signal}
                  </h4>
                </div>
              </div>

              {/* Risk Card */}
              <div className="column">
                <div className="card small-card">
                  <div className="icon gold">🛡</div>
                  <div>
                    <h3>Risk Level</h3>
                    <p className={getRiskColor(stock.risk?.level)}>
                      {stock.risk?.level}
                    </p>
                  </div>
                </div>

                <div className="card small-card center-card">
                  <h3>Confidence</h3>
                  <p className="medium">
                    {stock.recommendation?.confidence}%
                  </p>
                </div>
              </div>

              {/* Recommendation Card */}
              <div className="column">
                <div className="card small-card">
                  <div className="icon green">💡</div>
                  <div>
                    <h3>Recommendation</h3>
                    <p className={isPositive ? "positive" : "negative"}>
                      {stock.recommendation?.decision}
                    </p>
                  </div>
                </div>

                <div className="card small-card center-card">
                  <h3>Market</h3>
                  <p className={isPositive ? "positive" : "negative"}>
                    {stock.market_signal}
                  </p>
                </div>
              </div>
            </div>

            {/* AI Analysis Section */}
            <div className="analysis-section fade-in">
              <div className="analysis-card">
                <h3>🛡 Risk Analysis</h3>
                <p>{stock.risk?.analysis}</p>
              </div>

              <div className="analysis-card">
                <h3>💡 Recommendation Reasoning</h3>
                <p>{stock.recommendation?.reasoning}</p>
              </div>
            </div>

            {/* Final Decision */}
            <div className="decision-box fade-in">
              <h2>Final Decision:</h2>
              <h1>{stock.recommendation?.decision} in {stock.symbol}</h1>
              <p>Confidence: {stock.recommendation?.confidence}%</p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;