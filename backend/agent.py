import json
import uuid
from datetime import datetime
from urllib.parse import quote

import gemini as ai
import storage


MAX_AGENT_STEPS = 6


def pollinations_image_url(prompt: str, seed: str, width: int = 900, height: int = 700) -> str:
    clean_prompt = " ".join(str(prompt or "premium ecommerce product photo").split())
    return (
        f"https://image.pollinations.ai/prompt/{quote(clean_prompt)}"
        f"?width={width}&height={height}&nologo=true&seed={quote(str(seed))}"
    )


def _build_store(generated: dict) -> dict:
    store_id = str(uuid.uuid4())
    store = {
        "id": store_id,
        "name": generated["name"],
        "tagline": generated["tagline"],
        "category": generated["category"],
        "theme_color": generated.get("theme_color", "#0f766e"),
        "created_at": datetime.utcnow().isoformat(),
        "products": [],
    }

    for product in generated.get("products", []):
        product_id = str(uuid.uuid4())
        store["products"].append({
            "id": product_id,
            "name": product["name"],
            "description": product["description"],
            "price": float(product["price"]),
            "category": product.get("category", store["category"]),
            "stock": int(product.get("stock", 100)),
            "image_url": product.get("image_url") or pollinations_image_url(
                f"{product['name']} {product.get('category', store['category'])}, premium ecommerce product photo for {store['name']}",
                product_id,
            ),
            "brand": product.get("brand"),
            "rating": product.get("rating"),
            "review_count": product.get("review_count"),
        })

    storage.save_store(store)
    return store


def _current_store(store_id: str | None) -> dict | None:
    if not store_id:
        return None
    return storage.get_store_by_id(store_id)


def _agent_decision(goal: str, steps: list[dict], store: dict | None, launch_advice: str) -> dict:
    # Only send a condensed summary of the store (not full descriptions/image
    # URLs) so the prompt stays small across repeated decision calls.
    store_summary = None
    if store:
        store_summary = {
            "name": store["name"],
            "category": store["category"],
            "tagline": store["tagline"],
            "product_count": len(store.get("products", [])),
            "product_names": [p["name"] for p in store.get("products", [])],
        }
    state = {
        "store_exists": bool(store),
        "store": store_summary,
        "launch_advice_written": bool(launch_advice),
        "completed_steps": steps,
    }
    prompt = f"""You are an autonomous ecommerce store-building agent.

Goal: {goal}

Current state:
{json.dumps(state, indent=2)}

Choose exactly one next tool. Return ONLY valid JSON.

Available tools:
1. create_store
   args: {{"prompt": "specific store generation prompt"}}
   Use first when no store exists.
2. generate_more_products
   args: {{}}
   Use when the store needs a richer catalog.
3. improve_all_descriptions
   args: {{}}
   Use after products exist to make copy more conversion-focused.
4. update_store_branding
   args: {{"name": "optional name", "tagline": "optional tagline", "theme_color": "#hex"}}
   Use only if branding should be sharpened.
5. write_launch_advice
   args: {{"question": "what launch advice to prepare"}}
   Use after the catalog is ready.
6. finish
   args: {{"summary": "short final summary"}}
   Use only after a store exists and launch advice has been written.

Response shape:
{{
  "thought": "brief reason",
  "tool": "tool_name",
  "args": {{}}
}}"""
    return json.loads(ai.clean_json(ai.generate_text(prompt)))


def _execute_tool(tool: str, args: dict, goal: str, store_id: str | None, launch_advice: str) -> tuple[str | None, str, str]:
    store = _current_store(store_id)

    if tool == "create_store":
        generated = ai.generate_store(args.get("prompt") or goal)
        store = _build_store(generated)
        return store["id"], launch_advice, f"Created {store['name']} with {len(store['products'])} products."

    if not store:
        generated = ai.generate_store(goal)
        store = _build_store(generated)
        return store["id"], launch_advice, f"Created {store['name']} with {len(store['products'])} products."

    if tool == "generate_more_products":
        products = ai.generate_more_products(store["name"], store["category"], store["products"])
        for product in products:
            product_id = str(uuid.uuid4())
            storage.add_product_to_store(store["id"], {
                "id": product_id,
                "name": product["name"],
                "description": product["description"],
                "price": float(product["price"]),
                "category": product.get("category", store["category"]),
                "stock": int(product.get("stock", 100)),
                "image_url": product.get("image_url") or pollinations_image_url(
                    f"{product['name']} {product.get('category', store['category'])}, premium ecommerce product photo for {store['name']}",
                    product_id,
                ),
                "brand": product.get("brand"),
                "rating": product.get("rating"),
                "review_count": product.get("review_count"),
            })
        return store["id"], launch_advice, f"Added {len(products)} complementary products."

    if tool == "improve_all_descriptions":
        products = store.get("products", [])
        new_descriptions = ai.improve_all_descriptions(products, store["category"]) if products else {}
        improved_count = 0
        for product in products:
            new_description = new_descriptions.get(product["id"])
            if new_description:
                storage.update_product(store["id"], product["id"], {"description": new_description})
                improved_count += 1
        return store["id"], launch_advice, f"Improved descriptions for {improved_count} products."

    if tool == "update_store_branding":
        updates = {key: value for key, value in args.items() if value}
        if updates:
            storage.update_store(store["id"], updates)
        return store["id"], launch_advice, "Refined store branding."

    if tool == "write_launch_advice":
        question = args.get("question") or f"Give a launch plan for this goal: {goal}"
        store = storage.get_store_by_id(store["id"])
        launch_advice = ai.chat_with_store_ai(
            store["name"],
            store["category"],
            store["tagline"],
            store["products"],
            question,
        )
        return store["id"], launch_advice, "Prepared launch advice."

    return store["id"], launch_advice, args.get("summary", "Agent finished the store build.")


def run_store_agent_steps(goal: str):
    """Generator that yields live progress events while the agent works.

    Event shapes:
      {"type": "thinking"}                                  - deciding the next tool
      {"type": "running", "tool": ..., "thought": ...}       - a tool started executing
      {"type": "step", "tool": ..., "thought": ..., "observation": ...} - a tool finished
      {"type": "done", "result": {...}}                      - final result, same shape run_store_agent used to return
    """
    steps = []
    store_id = None
    launch_advice = ""
    used_tools = set()

    for _ in range(MAX_AGENT_STEPS):
        store = _current_store(store_id)
        yield {"type": "thinking"}
        decision = _agent_decision(goal, steps, store, launch_advice)
        tool = decision.get("tool", "finish")
        args = decision.get("args") or {}

        if tool in used_tools and tool not in {"finish", "update_store_branding"}:
            if not store:
                tool, args = "create_store", {"prompt": goal}
            elif not launch_advice:
                tool, args = "write_launch_advice", {"question": f"Create a launch plan for {store['name']}."}
            else:
                tool, args = "finish", {"summary": "Store build completed."}

        if tool == "finish":
            step = {
                "tool": "finish",
                "thought": decision.get("thought", "The goal is complete."),
                "observation": args.get("summary", "Agent finished the store build."),
            }
            steps.append(step)
            yield {"type": "step", **step}
            break

        yield {"type": "running", "tool": tool, "thought": decision.get("thought", "")}
        store_id, launch_advice, observation = _execute_tool(tool, args, goal, store_id, launch_advice)
        used_tools.add(tool)
        step = {
            "tool": tool,
            "thought": decision.get("thought", ""),
            "observation": observation,
        }
        steps.append(step)
        yield {"type": "step", **step}

    store = _current_store(store_id)
    if store and not launch_advice:
        yield {"type": "running", "tool": "write_launch_advice", "thought": "The store needs launch guidance before finishing."}
        store_id, launch_advice, observation = _execute_tool(
            "write_launch_advice",
            {"question": f"Create a launch plan for {store['name']}."},
            goal,
            store_id,
            launch_advice,
        )
        step = {
            "tool": "write_launch_advice",
            "thought": "The store needs launch guidance before finishing.",
            "observation": observation,
        }
        steps.append(step)
        yield {"type": "step", **step}
        store = _current_store(store_id)

    result = {
        "goal": goal,
        "store": store,
        "steps": steps,
        "launch_advice": launch_advice,
        "summary": f"Agent completed {store['name']} with {len(store.get('products', []))} products." if store else "Agent could not create a store.",
    }
    yield {"type": "done", "result": result}


def run_store_agent(goal: str) -> dict:
    result = None
    for event in run_store_agent_steps(goal):
        if event["type"] == "done":
            result = event["result"]
    return result
