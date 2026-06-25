import json
import os

STORAGE_FILE = os.path.join(os.path.dirname(__file__), "stores.json")

def read_stores() -> list:
    if not os.path.exists(STORAGE_FILE):
        return []
    with open(STORAGE_FILE, "r") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []

def write_stores(stores: list):
    with open(STORAGE_FILE, "w") as f:
        json.dump(stores, f, indent=2)

def get_store_by_id(store_id: str) -> dict | None:
    stores = read_stores()
    for store in stores:
        if store["id"] == store_id:
            return store
    return None

def save_store(store_data: dict):
    stores = read_stores()
    stores.append(store_data)
    write_stores(stores)

def update_store(store_id: str, updates: dict) -> dict | None:
    stores = read_stores()
    for i, store in enumerate(stores):
        if store["id"] == store_id:
            stores[i].update(updates)
            write_stores(stores)
            return stores[i]
    return None

def delete_store(store_id: str) -> bool:
    stores = read_stores()
    new_stores = [s for s in stores if s["id"] != store_id]
    if len(new_stores) == len(stores):
        return False
    write_stores(new_stores)
    return True

def add_product_to_store(store_id: str, product: dict) -> dict | None:
    stores = read_stores()
    for i, store in enumerate(stores):
        if store["id"] == store_id:
            stores[i]["products"].append(product)
            write_stores(stores)
            return stores[i]
    return None

def update_product(store_id: str, product_id: str, updates: dict) -> dict | None:
    stores = read_stores()
    for store in stores:
        if store["id"] == store_id:
            for j, product in enumerate(store["products"]):
                if product["id"] == product_id:
                    store["products"][j].update(updates)
                    write_stores(stores)
                    return store["products"][j]
    return None

def delete_product(store_id: str, product_id: str) -> bool:
    stores = read_stores()
    for store in stores:
        if store["id"] == store_id:
            original_len = len(store["products"])
            store["products"] = [p for p in store["products"] if p["id"] != product_id]
            if len(store["products"]) < original_len:
                write_stores(stores)
                return True
    return False

