from __future__ import annotations

from typing import Dict

import httpx


async def validate_whatsapp(phone_number_id: str, token: str) -> Dict[str, str | bool]:
    if not phone_number_id or not token:
        return {"ok": False, "error": "Falta phone_number_id o token"}

    url = f"https://graph.facebook.com/v18.0/{phone_number_id}"
    params = {"fields": "display_phone_number,verified_name", "access_token": token}

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(url, params=params)
        if response.status_code == 200:
            return {"ok": True, "details": response.json()}
        return {"ok": False, "error": response.text}
    except httpx.HTTPError as exc:
        return {"ok": False, "error": str(exc)}


async def validate_messenger(page_id: str, token: str) -> Dict[str, str | bool]:
    if not page_id or not token:
        return {"ok": False, "error": "Falta page_id o page token"}

    url = f"https://graph.facebook.com/v18.0/{page_id}"
    params = {"fields": "name", "access_token": token}

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(url, params=params)
        if response.status_code == 200:
            return {"ok": True, "details": response.json()}
        return {"ok": False, "error": response.text}
    except httpx.HTTPError as exc:
        return {"ok": False, "error": str(exc)}
