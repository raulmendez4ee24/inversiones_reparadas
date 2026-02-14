from __future__ import annotations

import asyncio
import os
from typing import Any, Dict

from .gemini_client import generate_content


async def generate_ai_reply(message: str, context: Dict[str, Any]) -> str:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()

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
        text, _, _ = await asyncio.to_thread(
            generate_content,
            prompt,
            180,
            0.2,
        )
        return text or "Gracias por tu mensaje. En breve te atendemos."
    except Exception:
        return "Gracias por tu mensaje. En breve te atendemos."
