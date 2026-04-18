from core.watsonx_client import ask_watsonx


def assess_risk(stock_data: dict) -> dict:
    prompt = f"""You are a financial risk analyst.

Given this stock data:
- Symbol: {stock_data['symbol']}
- Current Price: ${stock_data['price']}
- Change: ${stock_data['change']}
- Change Percent: {stock_data['change_percent']}

Assess the risk level and explain your reasoning in 2-3 sentences.

Reply in this exact format:
Risk: <Low, Medium, or High>
Analysis: <your detailed explanation>"""

    response = ask_watsonx(prompt)

    risk_level = "Medium"
    analysis = "Unable to determine risk analysis."

    for line in response.splitlines():
        line = line.strip()
        if line.lower().startswith("risk:"):
            value = line.split(":", 1)[1].strip()
            for level in ["High", "Medium", "Low"]:
                if level.lower() in value.lower():
                    risk_level = level
                    break
        elif line.lower().startswith("analysis:"):
            analysis = line.split(":", 1)[1].strip()

    return {
        "level": risk_level,
        "analysis": analysis
    }