# K'an Logic Systems - Diagnostico IA

Prototipo web para generar auditorias IA, ROI estimado y cotizacion automatica.

## Como correrlo (local)

```bash
python3 -m venv .venv
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
  "team_roles": "10 ventas, 8 admin, 7 soporte",
  "manual_hours_per_week": 12,
  "selected_modules": ["whatsapp_ventas", "inventarios_datos"],
  "bottlenecks": "responder mensajes, capturar pedidos y actualizar inventario manualmente",
  "processes": "ventas, inventario, reportes",
  "systems": "ERP, Excel, WhatsApp",
  "goals": "vender mas y responder mas rapido"
}
```

## Personalizar

- Modulos: `app/core/modules.py`
- Logica de ROI y cotizacion: `app/core/analysis.py` y `app/core/pricing.py`
- Integrar LLM: reemplaza `app/core/llm.py`

## Analisis con Gemini (opcional)

Configura Gemini para personalizar diagnostico y respuestas de chatbot:

```bash
export GEMINI_API_KEY="tu_api_key"
export GEMINI_MODEL="gemini-2.0-flash"
export GEMINI_BASE_URL="https://generativelanguage.googleapis.com/v1beta"
```

Para verificar si la API quedo conectada:

```bash
curl http://127.0.0.1:8000/api/health/ai
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
2) Agenda tu sesion de Activacion (15 min) para conectar cuentas de forma segura.
3) La solicitud se guarda en `data/leads.db` (tabla `projects`).

## Pago (checkout)

Configura links de pago para que el flujo termine directo en checkout:

```bash
export PAYMENT_URL_CARD="https://tu-checkout.com/tarjeta?lead={lead_id}&project={project_id}&company={company_name}"
export PAYMENT_URL_TRANSFER="https://tu-checkout.com/transferencia?lead={lead_id}&project={project_id}&company={company_name}"
export PAYMENT_URL_DEFAULT="https://tu-checkout.com/default?lead={lead_id}&project={project_id}"
```

Tokens disponibles en el URL:
- `{lead_id}`
- `{project_id}`
- `{company_name}`
- `{payment_method}`

## Portal del cliente (login)

Para mantener sesiones seguras en el portal:

```bash
export SESSION_SECRET="tu_clave_larga"
```

## Cifrado de datos sensibles (recomendado)

Para guardar tokens/API keys de forma segura (Meta OAuth y accesos en onboarding), configura una llave de cifrado:

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
export DATA_ENCRYPTION_KEY="PEGA_AQUI_LA_LLAVE_GENERADA"
```

Sin `DATA_ENCRYPTION_KEY`, el sistema no guardara accesos sensibles en la base de datos.

## Founder Presence (confianza)

La landing incluye seccion "Sobre el Arquitecto" y badges de tecnologia. Personaliza con variables:

```bash
export SUPPORT_EMAIL="soporte@tu-dominio.com"
export FOUNDER_NAME="Tu Nombre"
export FOUNDER_ROLE="Arquitecto de automatizacion"
export FOUNDER_HEADLINE="No construyo para que las cosas funcionen, diseno sistemas robustos para que tu negocio no se detenga."
export FOUNDER_BIO="K'an disena la infraestructura neuronal de tu PyME. No solo \"recuperamos tiempo\", convertimos tus operaciones manuales en flujos de inteligencia autonoma que trabajan 24/7."
export FOUNDER_PHOTO_URL="/static/founder.svg"
export FOUNDER_WHATSAPP="+52 55 1234 5678"
export FOUNDER_CALENDAR_URL="https://cal.com/tuusuario/15min"
```

## Paginas legales (Meta)

La app expone:
- `/privacy`
- `/terms`
- `/data-deletion`
