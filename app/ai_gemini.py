import os
import google.generativeai as genai

MODEL = "gemini-2.5-flash"

def explain_plan(tasks: list[dict], plan: dict) -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY not set")

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(MODEL)

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

    response = model.generate_content(prompt)
    return (response.text or "").strip()
