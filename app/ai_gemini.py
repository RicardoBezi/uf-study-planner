import os
from google import genai

MODEL = "gemini-2.5-flash-lite"

def explain_plan(tasks: list[dict], plan: dict) -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY not set")

    client = genai.Client(api_key=api_key)

    prompt = f"""
Explain why this weekly study plan was structured the way it is.

Rules:
- 4–6 bullet points
- Mention urgency, difficulty, and workload balancing
- No emojis
- No generic study advice

Tasks:
{tasks}

Plan:
{plan}
"""

    response = client.models.generate_content(
        model=MODEL,
        contents=prompt
    )
    return (response.text or "").strip()
