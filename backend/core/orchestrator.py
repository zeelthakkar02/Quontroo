from agents.risk_agent import assess_risk
from agents.recommendation_agent import get_recommendation


def run_agents(stock_data: dict, market_signal: str = "Neutral") -> dict:
    print(f"Running agents for {stock_data['symbol']}...")

    print("→ Assessing risk...")
    risk_result = assess_risk(stock_data)
    print(f"  Risk: {risk_result['level']}")
    print(f"  Analysis: {risk_result['analysis']}")

    print("→ Getting recommendation...")
    rec_result = get_recommendation(stock_data, risk_result['level'], market_signal)
    print(f"  Recommendation: {rec_result['recommendation']}")
    print(f"  Confidence: {rec_result['confidence']}%")
    print(f"  Reasoning: {rec_result['reasoning']}")

    return {
        "symbol": stock_data["symbol"],
        "price": stock_data["price"],
        "change_percent": stock_data["change_percent"],
        "market_signal": market_signal,
        "risk": {
            "level": risk_result["level"],
            "analysis": risk_result["analysis"]
        },
        "recommendation": {
            "decision": rec_result["recommendation"],
            "confidence": rec_result["confidence"],
            "reasoning": rec_result["reasoning"]
        }
    }