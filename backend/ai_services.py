import os

# Check if the AI library is available
try:
    from groq import Groq
    HAS_GROQ = True
except ImportError:
    HAS_GROQ = False

def generate_financial_report(expenses, prefs):
    if not HAS_GROQ:
        return {"error": "Groq library not installed on server"}, 503

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return {"error": "GROQ_API_KEY not set"}, 500

    # Construct the prompt
    prompt_text = "I need a financial update based on my recent expenses.\n"
    prompt_text += f"Expenses Data: {str(expenses)}\n"
    
    if prefs:
        goal = prefs.get("goal_amount", "N/A")
        date = prefs.get("target_date", "N/A")
        prompt_text += f"My Goal: Save {goal} by {date}.\n"
    
    prompt_text += "Please analyze my spending habits and tell me if I'm on track. Keep it concise."
    
    try:
        client = Groq(api_key=api_key)
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful and concise financial assistant."
                },
                {
                    "role": "user",
                    "content": prompt_text,
                }
            ],
            model="llama-3.1-8b-instant",  # Updated supported model
        )
        report = chat_completion.choices[0].message.content
        return {"report": report}, 200
    except Exception as e:
        print(f"AI Service Error: {e}")
        return {"error": f"Failed: {str(e)}"}, 500
