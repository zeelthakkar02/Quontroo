from core.watsonx_client import ask_watsonx


def get_recommendation(stock_data: dict, risk_level: str, market_signal: str) -> dict:
    prompt = f"""You are a financial advisor AI.

Here is a stock analysis summary:
- Symbol: {stock_data['symbol']}
- Price: ${stock_data['price']}
- Change: ${stock_data['change']} ({stock_data['change_percent']})
- Market Signal: {market_signal}
- Risk Level: {risk_level}

Based on this data, provide a recommendation and explain your reasoning in 2-3 sentences.

Reply in this exact format:
Recommendation: <Invest, Invest moderately, Hold, or Avoid>
Confidence: <number between 0 and 100>
Reasoning: <your detailed explanation of why you made this recommendation>"""

    response = ask_watsonx(prompt)

    recommendation = "Hold"
    confidence = 60
    reasoning = "Unable to determine recommendation reasoning."

    for line in response.splitlines():
        line = line.strip()
        if line.lower().startswith("recommendation:"):
            recommendation = line.split(":", 1)[1].strip()
        elif line.lower().startswith("confidence:"):
            try:
                confidence = int("".join(filter(str.isdigit, line.split(":", 1)[1])))
                confidence = max(0, min(100, confidence))
            except ValueError:
                pass
        elif line.lower().startswith("reasoning:"):
            reasoning = line.split(":", 1)[1].strip()

    return {
        "recommendation": recommendation,
        "confidence": confidence,
        "reasoning": reasoning
    }