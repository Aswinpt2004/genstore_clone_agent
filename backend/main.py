import json

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from models import (
    GenerateStoreRequest, AddProductRequest,
    UpdateStoreRequest, ChatRequest, AgentRunRequest
)
import storage
import gemini as ai
import agent as store_agent
from datetime import datetime
import uuid
from urllib.parse import quote

app = FastAPI(title="GenAI Store API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def pollinations_image_url(prompt: str, seed: str, width: int = 900, height: int = 700) -> str:
    clean_prompt = " ".join(str(prompt or "premium ecommerce product photo").split())
    return (
        f"https://image.pollinations.ai/prompt/{quote(clean_prompt)}"
        f"?width={width}&height={height}&nologo=true&seed={quote(str(seed))}"
    )

# -- Store Generation ------------------------------------------

@app.post("/api/generate")
async def generate_store(request: GenerateStoreRequest):
    """Generate a complete store from a single text prompt using Gemini."""
    try:
        generated = ai.generate_store(request.prompt)
        
        store_id = str(uuid.uuid4())
        store_data = {
            "id": store_id,
            "name": generated["name"],
            "tagline": generated["tagline"],
            "category": generated["category"],
            "theme_color": generated.get("theme_color", "#6366f1"),
            "created_at": datetime.utcnow().isoformat(),
            "products": []
        }
        
        for product in generated.get("products", []):
            product_id = str(uuid.uuid4())
            store_data["products"].append({
                "id": product_id,
                "name": product["name"],
                "description": product["description"],
                "price": float(product["price"]),
                "category": product.get("category", store_data["category"]),
                "stock": int(product.get("stock", 100)),
                "image_url": product.get("image_url") or pollinations_image_url(
                    f"{product['name']} {product.get('category', store_data['category'])}, premium ecommerce product photo for {store_data['name']}",
                    product_id
                ),
                "brand": product.get("brand"),
                "rating": product.get("rating"),
                "review_count": product.get("review_count"),
            })
        
        storage.save_store(store_data)
        return store_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Store generation failed: {str(e)}")


@app.post("/api/agent/run")
async def run_agent(request: AgentRunRequest):
    """Run an autonomous store-building agent that plans and calls backend tools."""
    try:
        return store_agent.run_store_agent(request.goal)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent run failed: {str(e)}")


@app.post("/api/agent/run/stream")
async def run_agent_stream(request: AgentRunRequest):
    """Same agent run, but streamed as server-sent events so the UI can show live progress."""
    def event_source():
        try:
            for event in store_agent.run_store_agent_steps(request.goal):
                yield f"data: {json.dumps(event)}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(event_source(), media_type="text/event-stream")


# -- Store CRUD ------------------------------------------------

@app.get("/api/stores")
async def list_stores():
    """Get all stores."""
    return storage.read_stores()


@app.get("/api/stores/{store_id}")
async def get_store(store_id: str):
    """Get a single store by ID."""
    store = storage.get_store_by_id(store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    return store


@app.put("/api/stores/{store_id}")
async def update_store(store_id: str, request: UpdateStoreRequest):
    """Update store name, tagline, or theme color."""
    updates = {k: v for k, v in request.dict().items() if v is not None}
    updated = storage.update_store(store_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail="Store not found")
    return updated


@app.delete("/api/stores/{store_id}")
async def delete_store(store_id: str):
    """Delete a store and all its products."""
    success = storage.delete_store(store_id)
    if not success:
        raise HTTPException(status_code=404, detail="Store not found")
    return {"message": "Store deleted successfully"}


# -- Product CRUD ----------------------------------------------

@app.post("/api/stores/{store_id}/products")
async def add_product(store_id: str, request: AddProductRequest):
    """Add a product manually to a store."""
    store = storage.get_store_by_id(store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    product = {
        "id": str(uuid.uuid4()),
        "name": request.name,
        "description": request.description,
        "price": request.price,
        "category": request.category,
        "stock": request.stock,
        "image_url": request.image_url or pollinations_image_url(
            f"{request.name} {request.category}, premium ecommerce product photo for {store['name']}",
            f"{store_id}-{request.name}"
        ),
        "brand": request.brand,
        "rating": request.rating,
        "review_count": request.review_count,
    }
    updated_store = storage.add_product_to_store(store_id, product)
    return updated_store


@app.post("/api/stores/{store_id}/products/generate")
async def generate_products(store_id: str):
    """Use Gemini to generate 3 more products for a store."""
    store = storage.get_store_by_id(store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    try:
        new_products = ai.generate_more_products(
            store["name"], store["category"], store["products"]
        )
        for product in new_products:
            product_id = str(uuid.uuid4())
            storage.add_product_to_store(store_id, {
                "id": product_id,
                "name": product["name"],
                "description": product["description"],
                "price": float(product["price"]),
                "category": product.get("category", store["category"]),
                "stock": int(product.get("stock", 100)),
                "image_url": product.get("image_url") or pollinations_image_url(
                    f"{product['name']} {product.get('category', store['category'])}, premium ecommerce product photo for {store['name']}",
                    product_id
                ),
                "brand": product.get("brand"),
                "rating": product.get("rating"),
                "review_count": product.get("review_count"),
            })
        return storage.get_store_by_id(store_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Product generation failed: {str(e)}")


@app.put("/api/stores/{store_id}/products/{product_id}")
async def update_product(store_id: str, product_id: str, request: AddProductRequest):
    """Edit a product."""
    updates = request.dict()
    updated = storage.update_product(store_id, product_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail="Product not found")
    return updated


@app.delete("/api/stores/{store_id}/products/{product_id}")
async def delete_product(store_id: str, product_id: str):
    """Delete a product from a store."""
    success = storage.delete_product(store_id, product_id)
    if not success:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}


@app.post("/api/stores/{store_id}/products/{product_id}/improve")
async def improve_description(store_id: str, product_id: str):
    """Use AI to rewrite a product description."""
    store = storage.get_store_by_id(store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    product = next((p for p in store["products"] if p["id"] == product_id), None)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    new_description = ai.improve_product_description(
        product["name"], product["description"], store["category"]
    )
    updated = storage.update_product(store_id, product_id, {"description": new_description})
    return updated


# -- AI Chat ---------------------------------------------------

@app.post("/api/chat")
async def chat(request: ChatRequest):
    """AI chat assistant with full store context injected."""
    store = storage.get_store_by_id(request.store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    try:
        reply = ai.chat_with_store_ai(
            store["name"],
            store["category"],
            store["tagline"],
            store["products"],
            request.message
        )
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")


# -- Health Check ----------------------------------------------

@app.get("/")
async def root():
    return {"status": "running", "app": "GenAI Store API"}

