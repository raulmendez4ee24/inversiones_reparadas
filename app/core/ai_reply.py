from __future__ import annotations

import os
from typing import Any, Dict

import httpx


def _extract_output_text(data: dict) -> str:
    output_text = data.get("output_text")
    if isinstance(output_text, str) and output_text.strip():
        return output_text.strip()

    for item in data.get("output", []) or []:
        for part in item.get("content", []) or []:
            text = part.get("text")
            if isinstance(text, str) and text.strip():
                return text.strip()
    return ""


async def generate_ai_reply(message: str, context: Dict[str, Any]) -> str:
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    model = os.getenv("OPENAI_MODEL", "gpt-5").strip()
    base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").strip().rstrip("/")

    if not api_key:
        return "Gracias por tu mensaje. En breve te atendemos con un asesor."

    prompt = (
        "Eres el asistente virtual de una empresa. Responde en español claro, breve y amable. "
        "Si el usuario pide informacion, ofrece opciones y pide datos faltantes. "
        "Si solicita cita, pide horario preferido, nombre y telefono.\n\n"
        f"Empresa: {context.get('company_name', 'No especificado')}\n"
        f"Rubro: {context.get('industry', 'No especificado')}\n"
        f"Actividad: {context.get('business_focus', 'No especificado')}\n"
        f"Objetivos: {context.get('goals', 'No especificado')}\n"
        f"Servicios/roles: {context.get('team_roles', 'No especificado')}\n\n"
        f"Mensaje del cliente: {message}"
    )

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(
                f"{base_url}/responses",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model or "gpt-5",
                    "input": prompt,
                    "max_output_tokens": 180,
                },
            )
        response.raise_for_status()
        data = response.json()
        text = _extract_output_text(data)
        return text or "Gracias por tu mensaje. En breve te atendemos."
    except httpx.HTTPError:
        return "Gracias por tu mensaje. En breve te atendemos."
