import json
import os
import re
from urllib.parse import quote

import requests
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise RuntimeError("GEMINI_API_KEY is not set. Add it to backend/.env.")

default_models = "gemini-3.5-flash,gemini-2.5-flash,gemini-2.5-flash-lite"
model_names = [
    name.strip()
    for name in os.getenv("GEMINI_MODELS", os.getenv("GEMINI_MODEL", default_models)).split(",")
    if name.strip()
]
request_timeout = int(os.getenv("GEMINI_TIMEOUT_SECONDS", "30"))


def generate_text(prompt: str) -> str:
    """Call Gemini over REST so failures and timeouts are surfaced clearly."""
    retryable_statuses = {429, 503}
    errors = []

    for model_name in model_names:
        model_path = quote(model_name, safe="")
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_path}:generateContent"
        try:
            response = requests.post(
                url,
                headers={"x-goog-api-key": api_key},
                json={"contents": [{"parts": [{"text": prompt}]}]},
                timeout=request_timeout,
            )
        except requests.RequestException as exc:
            errors.append(f"{model_name}: {exc.__class__.__name__}")
            continue

        if not response.ok:
            try:
                message = response.json().get("error", {}).get("message", response.text)
            except ValueError:
                message = response.text
            errors.append(f"{model_name}: Gemini API error ({response.status_code}): {message}")
            if response.status_code in retryable_statuses:
                continue
            raise RuntimeError(errors[-1])

        data = response.json()
        try:
            return data["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError, TypeError) as exc:
            raise RuntimeError("Gemini returned an unexpected response shape.") from exc

    raise RuntimeError("; ".join(errors) or "No Gemini models are configured.")

def clean_json(text: str) -> str:
    """Strip markdown code fences from Gemini response before JSON parsing."""
    text = text.strip()
    text = re.sub(r"^```json\s*", "", text)
    text = re.sub(r"^```\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return text.strip()

def generate_store(user_prompt: str) -> dict:
    """Generate a complete store from a user prompt."""
    prompt = f"""You are an AI store builder. A user wants to create an online store.

User's idea: \"{user_prompt}\"

Generate a complete store. Return ONLY valid JSON, no explanation, no markdown, no code fences.

The JSON must have exactly this structure:
{{
  \"name\": \"Creative store name (2-3 words, catchy)\",
  \"tagline\": \"A compelling one-liner tagline for the store\",
  \"category\": \"main product category (e.g. fashion, electronics, pet food)\",
  \"theme_color\": \"#hexcolor (choose a color that fits the store's vibe)\",
  \"products\": [
    {{
      \"name\": \"Product name\",
      \"description\": \"Compelling 1-2 sentence product description\",
      \"price\": 2499,
      \"category\": \"subcategory\",
      \"stock\": 100,
      \"image_url\": null
    }}
  ]
}}

Generate exactly 5 products. Make them realistic, specific, and varied. Prices must be in Indian rupees as plain numbers, not dollars. Return ONLY the JSON object."""

    cleaned = clean_json(generate_text(prompt))
    return json.loads(cleaned)


def generate_more_products(store_name: str, store_category: str, existing_products: list) -> list:
    """Generate 3 more products for an existing store."""
    existing_names = [p["name"] for p in existing_products]
    
    prompt = f"""You are a product manager for \"{store_name}\", a {store_category} store.

Existing products: {', '.join(existing_names)}

Generate 3 NEW products that complement what already exists but are not duplicates.
Return ONLY valid JSON array, no explanation, no markdown, no code fences.

[
  {{
    \"name\": \"Product name\",
    \"description\": \"Compelling 1-2 sentence description\",
    \"price\": 2499,
    \"category\": \"subcategory\",
    \"stock\": 100,
    \"image_url\": null
  }}
]

Return ONLY the JSON array."""

    cleaned = clean_json(generate_text(prompt))
    return json.loads(cleaned)


def chat_with_store_ai(store_name: str, category: str, tagline: str, products: list, user_message: str) -> str:
    """AI chat assistant with full store context."""
    product_list = "\n".join([
        f"- {p['name']} (Rs. {p.get('price', 0)}): {p['description']}"
        for p in products
    ])

    prompt = f"""You are an AI assistant for \"{store_name}\", an online {category} store.
Store tagline: \"{tagline}\"

Products available:
{product_list}

You help the store owner:
- Improve their store's marketing and branding
- Suggest new product ideas
- Write better product descriptions
- Answer questions about running the store
- Give business advice for their niche

Be concise, helpful, and specific to this store. Keep responses under 150 words.

User message: {user_message}"""

    return generate_text(prompt).strip()


def improve_product_description(product_name: str, current_description: str, store_category: str) -> str:
    """Rewrite a product description to be more compelling."""
    prompt = f"""Rewrite this product description to be more compelling and conversion-focused.

Product: {product_name}
Store category: {store_category}
Current description: {current_description}

Write a new description in 2 sentences max. Be specific, highlight benefits, create desire.
Return ONLY the new description text, no quotes, no explanation."""

    return generate_text(prompt).strip()

