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
      const res = await fetch(
        `http://127.0.0.1:8000/stock?symbol=${inputValue.trim()}`
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

  const isPositive = stock ? stock.change >= 0 : true;

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
                market trends, and make confident financial decisions in
                seconds.
              </p>

              <div className="hero-actions">
                <button className="primary-btn">Request a Demo</button>
                <button className="secondary-btn">Learn More</button>
              </div>
            </div>

            <div className="hero-right">
              <img src={Homeimage } alt="AI Financial Analysis" />
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
              <p>
                Get real-time insights on stocks with intelligent AI-driven
                analysis and predictions.
              </p>
            </div>

            <div className="feature-card">
              <h3>📈 Market Trends</h3>
              <p>
                Understand whether the market is bullish or bearish with clear,
                simple indicators.
              </p>
            </div>

            <div className="feature-card">
              <h3>⚠️ Risk Assessment</h3>
              <p>
                Evaluate investment risk levels so you can make safer financial
                decisions.
              </p>
            </div>

            <div className="feature-card">
              <h3>💡 Smart Recommendations</h3>
              <p>
                Receive actionable suggestions based on AI insights and market
                behavior.
              </p>
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
            onChange={(e) => setInputValue(e.target.value)}
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
              Analyzing {inputValue.trim().toUpperCase()}...
            </p>
          </div>
        )}

        {error && !loading && <p className="error-message">{error}</p>}

        {!loading && stock && (
          <>
            <div className="cards-grid fade-in">
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
                  <p>↻ {stock.symbol}</p>
                  <h2>
                    ${stock.price.toFixed(2)}{" "}
                    <span className={isPositive ? "up" : "down"}>
                      {isPositive ? "▲" : "▼"}
                    </span>
                  </h2>
                </div>
              </div>

              <div className="column">
                <div className="card small-card">
                  <div className="icon green">📈</div>
                  <div>
                    <h3>Market</h3>
                    <p className={isPositive ? "positive" : "negative"}>
                      {isPositive ? "Positive" : "Negative"}
                    </p>
                  </div>
                </div>

                <div className="card small-card center-card">
                  <h3>Risk</h3>
                  <p className="medium">Medium</p>
                </div>
              </div>

              <div className="column">
                <div className="card small-card">
                  <div className="icon gold">🛡</div>
                  <div>
                    <h3>Risk Level</h3>
                    <p className="medium">Medium</p>
                  </div>
                </div>

                <div className="card small-card center-card">
                  <h3>Recommendation</h3>
                  <p>{isPositive ? "Invest moderately" : "Be cautious"}</p>
                </div>
              </div>
            </div>

            <div className="decision-box fade-in">
              <h2>Final Decision:</h2>
              <h1>
                {isPositive
                  ? `Invest moderately in ${stock.symbol}`
                  : `Be cautious with ${stock.symbol}`}
              </h1>
            </div>
          </>
        )}

       
      </main>
    </div>
  );
}

export default App;
