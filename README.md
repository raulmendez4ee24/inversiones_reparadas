# K'an Logic Systems - Diagnostico IA

Prototipo web para generar auditorias IA, ROI estimado y cotizacion automatica.

## Como correrlo (local)

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Abre `http://127.0.0.1:8000`.

## API

`POST /api/diagnose` con JSON:

```json
{
  "company_name": "Textiles Orion",
  "industry": "Retail",
  "business_focus": "Ventas de ropa al mayoreo",
  "region": "Mexico",
  "team_size": 25,
  "team_size_target": 18,
  "team_focus_same": false,
  "team_roles": "10 ventas, 8 admin, 7 soporte",
  "avg_daily_cost_mxn": 600,
  "manual_days_per_week": 4,
  "processes": "ventas, inventario, reportes",
  "bottlenecks": "facturacion lenta y conciliacion manual",
  "systems": "ERP, Excel, WhatsApp",
  "goals": "reducir costos y mejorar conversion"
}
```

## Personalizar

- Modulos: `app/core/modules.py`
- Logica de ROI y cotizacion: `app/core/analysis.py` y `app/core/pricing.py`
- Integrar LLM: reemplaza `app/core/llm.py`

## Analisis con GPT-5 (opcional)

Configura tu API key para activar el analisis por GPT-5:

```bash
export OPENAI_API_KEY="tu_api_key"
export OPENAI_MODEL="gpt-5"
```

## Handoff a automatizacion (n8n)

Configura la variable de entorno `N8N_WEBHOOK_URL` para enviar los diagnosticos a tu flujo de n8n.

Ejemplo:

```bash
export N8N_WEBHOOK_URL="https://tu-instancia.n8n.cloud/webhook/mi-endpoint"
```

Los leads se guardan en `data/leads.db`.

## Provision automatica de flujos n8n (WhatsApp/Messenger)

Para que el sistema cree flujos en tu n8n automaticamente:

```bash
export N8N_API_URL="http://localhost:5678"
export N8N_API_KEY="tu_api_key_n8n"
export APP_PUBLIC_URL="http://127.0.0.1:8000"
```

Plantillas en `n8n_templates/`:
- `whatsapp_bot.json` / `messenger_bot.json`
- `whatsapp_bot_advanced.json` / `messenger_bot_advanced.json`

## Login con Meta (opcional)

Si quieres que el cliente inicie sesion con Meta y autorice accesos:

```bash
export META_APP_ID="tu_app_id"
export META_APP_SECRET="tu_app_secret"
export APP_PUBLIC_URL="https://tu-dominio.com"
export META_REDIRECT_URI="https://tu-dominio.com/meta/callback"
# opcional, para ajustar permisos
export META_SCOPES="pages_show_list,pages_manage_metadata,pages_messaging,whatsapp_business_messaging,whatsapp_business_management"
```

## Onboarding de accesos

1) Genera el diagnostico y presiona **Implementar ahora**.
2) Selecciona modulos, agrega accesos y envia a implementacion.
3) La solicitud se guarda en `data/leads.db` (tabla `projects`).
