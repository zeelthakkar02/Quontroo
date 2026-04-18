import os
import requests
from dotenv import load_dotenv

load_dotenv()

WATSONX_API_KEY = os.getenv("WATSONX_API_KEY")
WATSONX_PROJECT_ID = os.getenv("WATSONX_PROJECT_ID")
WATSONX_URL = os.getenv("WATSONX_URL", "https://us-south.ml.cloud.ibm.com")

def get_iam_token():
    response = requests.post(
        "https://iam.cloud.ibm.com/identity/token",
        data={
            "apikey": WATSONX_API_KEY,
            "grant_type": "urn:ibm:params:oauth:grant-type:apikey"
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    response.raise_for_status()
    return response.json()["access_token"]

def ask_watsonx(prompt: str) -> str:
    token = get_iam_token()

    payload = {
        "model_id": "ibm/granite-3-8b-instruct",
        "input": prompt,
        "parameters": {
            "decoding_method": "greedy",
            "max_new_tokens": 300,
            "temperature": 0
        },
        "project_id": WATSONX_PROJECT_ID
    }

    response = requests.post(
        f"{WATSONX_URL}/ml/v1/text/generation?version=2023-05-29",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        },
        json=payload
    )
    response.raise_for_status()
    result = response.json()
    return result["results"][0]["generated_text"].strip()