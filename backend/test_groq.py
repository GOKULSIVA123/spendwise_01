import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()
api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    print("Error: GROQ_API_KEY is missing!")
else:
    try:
        print("Testing Groq API...")
        client = Groq(api_key=api_key)
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": "Say 'hello world'",
                }
            ],
            model="llama-3.1-8b-instant",
        )
        print("Groq API successful! Response:", chat_completion.choices[0].message.content)
    except Exception as e:
        print("Groq API Error:", e)
