from __future__ import annotations

import os
import urllib.parse
from pathlib import Path

import httpx

from dotenv import load_dotenv
from fastapi import FastAPI, Form, Request
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel

from .core.access import access_items
from .core.analysis import run_analysis
from .core.ai_reply import generate_ai_reply
from .core.meta import validate_messenger, validate_whatsapp
from .core.models import BusinessInput
from .core.modules import catalog
from .core.n8n import provision_workflows
from .core.storage import (
    fetch_lead,
    fetch_oauth_token,
    init_db,
    save_lead,
    save_oauth_token,
    save_project,
    update_project_status,
)

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR.parent / "data"
DB_PATH = DATA_DIR / "leads.db"

app = FastAPI(title="K'an Logic Systems", version="0.1.0")
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")

templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))


def _meta_oauth_config() -> dict[str, str]:
    scopes = os.getenv(
        "META_SCOPES",
        ",".join(
            [
                "pages_show_list",
                "pages_manage_metadata",
                "pages_messaging",
                "whatsapp_business_messaging",
                "whatsapp_business_management",
            ]
        ),
    )
    redirect_uri = os.getenv("META_REDIRECT_URI", "").strip()
    if not redirect_uri:
        base_url = os.getenv("APP_PUBLIC_URL", "").strip().rstrip("/")
        if base_url:
            redirect_uri = f"{base_url}/meta/callback"
    return {
        "app_id": os.getenv("META_APP_ID", "").strip(),
        "app_secret": os.getenv("META_APP_SECRET", "").strip(),
        "redirect_uri": redirect_uri,
        "scopes": scopes,
        "dialog_url": os.getenv("META_DIALOG_URL", "https://www.facebook.com/v19.0/dialog/oauth"),
        "token_url": os.getenv("META_TOKEN_URL", "https://graph.facebook.com/v19.0/oauth/access_token"),
    }


class AIReplyRequest(BaseModel):
    message: str
    channel: str | None = None
    sender: str | None = None
    context: dict | None = None


@app.on_event("startup")
async def startup():
    DATA_DIR.mkdir(exist_ok=True)
    init_db(DB_PATH)


@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/handoff")
async def handoff_get():
    return RedirectResponse(url="/", status_code=303)


@app.get("/onboarding/{lead_id}", response_class=HTMLResponse)
async def onboarding_view(request: Request, lead_id: int):
    try:
        payload, output = fetch_lead(DB_PATH, lead_id)
    except ValueError:
        return RedirectResponse(url="/", status_code=303)

    recommended = {module.name for module in output.recommended_modules}
    meta_connected = fetch_oauth_token(DB_PATH, lead_id, "meta") is not None

    return templates.TemplateResponse(
        "onboarding.html",
        {
            "request": request,
            "payload": payload,
            "output": output,
            "lead_id": lead_id,
            "modules": catalog(),
            "recommended": recommended,
            "access_items": access_items(),
            "meta_connected": meta_connected,
        },
    )


@app.post("/diagnose", response_class=HTMLResponse)
async def diagnose(
    request: Request,
    company_name: str = Form(...),
    industry: str = Form(...),
    business_focus: str = Form(...),
    region: str = Form("LATAM"),
    team_size: int = Form(...),
    team_size_target: int = Form(0),
    team_focus_same: str = Form(""),
    team_roles: str = Form(""),
    avg_daily_cost_mxn: float = Form(...),
    manual_days_per_week: float = Form(...),
    processes: str = Form(...),
    bottlenecks: str = Form(...),
    systems: str = Form(...),
    goals: str = Form(...),
    budget_range: str = Form(""),
    contact_email: str = Form(""),
):
    team_focus_flag = None
    if team_focus_same == "si":
        team_focus_flag = True
    elif team_focus_same == "no":
        team_focus_flag = False

    payload = BusinessInput(
        company_name=company_name,
        industry=industry,
        business_focus=business_focus,
        region=region,
        team_size=team_size,
        team_size_target=team_size_target or None,
        team_focus_same=team_focus_flag,
        team_roles=team_roles or None,
        avg_daily_cost_mxn=avg_daily_cost_mxn,
        manual_days_per_week=manual_days_per_week,
        processes=processes,
        bottlenecks=bottlenecks,
        systems=systems,
        goals=goals,
        budget_range=budget_range or None,
        contact_email=contact_email or None,
    )

    output = run_analysis(payload)
    return templates.TemplateResponse(
        "report.html",
        {
            "request": request,
            "payload": payload,
            "output": output,
        },
    )


@app.post("/handoff", response_class=HTMLResponse)
async def handoff(
    request: Request,
    company_name: str = Form(...),
    industry: str = Form(...),
    business_focus: str = Form(...),
    region: str = Form("LATAM"),
    team_size: int = Form(...),
    team_size_target: int = Form(0),
    team_focus_same: str = Form(""),
    team_roles: str = Form(""),
    avg_daily_cost_mxn: float = Form(...),
    manual_days_per_week: float = Form(...),
    processes: str = Form(...),
    bottlenecks: str = Form(...),
    systems: str = Form(...),
    goals: str = Form(...),
    budget_range: str = Form(""),
    contact_email: str = Form(""),
):
    team_focus_flag = None
    if team_focus_same == "si":
        team_focus_flag = True
    elif team_focus_same == "no":
        team_focus_flag = False

    payload = BusinessInput(
        company_name=company_name,
        industry=industry,
        business_focus=business_focus,
        region=region,
        team_size=team_size,
        team_size_target=team_size_target or None,
        team_focus_same=team_focus_flag,
        team_roles=team_roles or None,
        avg_daily_cost_mxn=avg_daily_cost_mxn,
        manual_days_per_week=manual_days_per_week,
        processes=processes,
        bottlenecks=bottlenecks,
        systems=systems,
        goals=goals,
        budget_range=budget_range or None,
        contact_email=contact_email or None,
    )

    output = run_analysis(payload)
    lead_id = save_lead(DB_PATH, payload, output)
    recommended = {module.name for module in output.recommended_modules}

    return templates.TemplateResponse(
        "onboarding.html",
        {
            "request": request,
            "payload": payload,
            "output": output,
            "lead_id": lead_id,
            "modules": catalog(),
            "recommended": recommended,
            "access_items": access_items(),
            "meta_connected": False,
        },
    )


@app.get("/meta/connect")
async def meta_connect(request: Request, lead_id: int):
    try:
        fetch_lead(DB_PATH, lead_id)
    except ValueError:
        return templates.TemplateResponse(
            "meta_connected.html",
            {
                "request": request,
                "status": "error",
                "message": "Lead no encontrado.",
                "lead_id": lead_id,
            },
        )

    config = _meta_oauth_config()
    if not config["app_id"] or not config["redirect_uri"]:
        return templates.TemplateResponse(
            "meta_connected.html",
            {
                "request": request,
                "status": "error",
                "message": "Falta configurar META_APP_ID o META_REDIRECT_URI.",
                "lead_id": lead_id,
            },
        )

    params = {
        "client_id": config["app_id"],
        "redirect_uri": config["redirect_uri"],
        "state": str(lead_id),
        "scope": config["scopes"],
        "response_type": "code",
    }
    oauth_url = f"{config['dialog_url']}?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url=oauth_url, status_code=302)


@app.get("/meta/callback", response_class=HTMLResponse)
async def meta_callback(
    request: Request,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    error_description: str | None = None,
):
    lead_id = 0
    if state:
        try:
            lead_id = int(state.split(":")[0])
        except ValueError:
            lead_id = 0

    if error:
        return templates.TemplateResponse(
            "meta_connected.html",
            {
                "request": request,
                "status": "error",
                "message": error_description or error,
                "lead_id": lead_id,
            },
        )

    if not code or lead_id == 0:
        return templates.TemplateResponse(
            "meta_connected.html",
            {
                "request": request,
                "status": "error",
                "message": "No se recibio el codigo de autorizacion.",
                "lead_id": lead_id,
            },
        )

    config = _meta_oauth_config()
    if not config["app_id"] or not config["app_secret"] or not config["redirect_uri"]:
        return templates.TemplateResponse(
            "meta_connected.html",
            {
                "request": request,
                "status": "error",
                "message": "Falta configurar META_APP_ID o META_APP_SECRET.",
                "lead_id": lead_id,
            },
        )

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(
                config["token_url"],
                params={
                    "client_id": config["app_id"],
                    "client_secret": config["app_secret"],
                    "redirect_uri": config["redirect_uri"],
                    "code": code,
                },
            )
        data = response.json()
    except httpx.HTTPError as exc:
        return templates.TemplateResponse(
            "meta_connected.html",
            {
                "request": request,
                "status": "error",
                "message": f"Error conectando con Meta: {exc}",
                "lead_id": lead_id,
            },
        )

    if "access_token" not in data:
        return templates.TemplateResponse(
            "meta_connected.html",
            {
                "request": request,
                "status": "error",
                "message": data.get("error", {}).get("message", "No se pudo obtener el token."),
                "lead_id": lead_id,
            },
        )

    try:
        fetch_lead(DB_PATH, lead_id)
    except ValueError:
        return templates.TemplateResponse(
            "meta_connected.html",
            {
                "request": request,
                "status": "error",
                "message": "Lead no encontrado para guardar el token.",
                "lead_id": lead_id,
            },
        )

    save_oauth_token(DB_PATH, lead_id, "meta", data)
    return templates.TemplateResponse(
        "meta_connected.html",
        {
            "request": request,
            "status": "ok",
            "message": "Cuenta Meta conectada. Ya podemos validar y solicitar permisos.",
            "lead_id": lead_id,
        },
    )


@app.post("/implement", response_class=HTMLResponse)
async def implement(request: Request):
    form = await request.form()
    lead_id = int(form.get("lead_id", "0") or 0)
    if lead_id == 0:
        return templates.TemplateResponse(
            "implement.html",
            {
                "request": request,
                "error": "Lead invalido.",
            },
        )

    try:
        payload, output = fetch_lead(DB_PATH, lead_id)
    except ValueError:
        return templates.TemplateResponse(
            "implement.html",
            {
                "request": request,
                "error": "Lead no encontrado.",
            },
        )

    selected_modules = form.getlist("selected_modules")
    if not selected_modules:
        selected_modules = [module.name for module in output.recommended_modules]

    payment_method = (form.get("payment_method") or "").strip()
    wants_whatsapp = form.get("wants_whatsapp") == "on"
    wants_messenger = form.get("wants_messenger") == "on"
    advanced_workflow = form.get("advanced_workflow") == "on"
    crm_webhook_url = (form.get("crm_webhook_url") or "").strip()
    calendar_webhook_url = (form.get("calendar_webhook_url") or "").strip()
    crm_name = (form.get("crm_name") or "").strip()
    calendar_tool = (form.get("calendar_tool") or "").strip()
    meta_access = {
        "meta_business_id": (form.get("meta_business_id") or "").strip(),
        "facebook_page_id": (form.get("facebook_page_id") or "").strip(),
        "messenger_page_token": (form.get("messenger_page_token") or "").strip(),
        "messenger_test_psid": (form.get("messenger_test_psid") or "").strip(),
        "whatsapp_waba_id": (form.get("whatsapp_waba_id") or "").strip(),
        "whatsapp_phone_number_id": (form.get("whatsapp_phone_number_id") or "").strip(),
        "whatsapp_token": (form.get("whatsapp_token") or "").strip(),
        "whatsapp_test_number": (form.get("whatsapp_test_number") or "").strip(),
        "webhook_verify_token": (form.get("webhook_verify_token") or "").strip(),
    }
    automation_options = {
        "advanced_workflow": advanced_workflow,
        "crm_webhook_url": crm_webhook_url,
        "calendar_webhook_url": calendar_webhook_url,
        "crm_name": crm_name,
        "calendar_tool": calendar_tool,
    }
    delivery_channels = form.getlist("delivery_channels")
    bot_preferences = form.getlist("bot_preferences")
    meta_oauth = fetch_oauth_token(DB_PATH, lead_id, "meta")
    meta_oauth_connected = meta_oauth is not None

    delivery_map = {
        "whatsapp_total": "Todo por WhatsApp",
        "pdf": "Reporte en PDF",
        "pdf_whatsapp": "PDF por WhatsApp",
        "email": "Correo",
    }
    bot_map = {
        "chatbot": "Chatbot de atencion",
        "ventas": "Bot de ventas",
        "agente_operativo": "Agente operativo",
    }
    delivery_labels = [delivery_map.get(item, item) for item in delivery_channels]
    bot_labels = [bot_map.get(item, item) for item in bot_preferences]
    contract_consent = form.get("consent") == "on"
    access_consent = form.get("access_consent") == "on"
    consent = contract_consent and access_consent

    access_payload = {
        "contract": {
            "accepted": contract_consent,
            "payment_method": payment_method,
        },
        "access_consent": access_consent,
        "delivery_channels": delivery_labels,
        "bot_preferences": bot_labels,
        "wants_whatsapp": wants_whatsapp,
        "wants_messenger": wants_messenger,
        "meta_access": meta_access,
        "automation_options": automation_options,
        "meta_oauth_connected": meta_oauth_connected,
    }
    for item in access_items():
        key = f"access_{item['key']}"
        value = (form.get(key) or "").strip()
        if value:
            access_payload[item["key"]] = {
                "label": item["label"],
                "value": value,
            }

    notes = (form.get("notes") or "").strip()
    status = "pending_consent" if not consent else "queued"
    project_id = save_project(
        DB_PATH,
        lead_id,
        selected_modules,
        access_payload,
        notes,
        status,
    )

    webhook_url = os.getenv("N8N_WEBHOOK_URL", "").strip()
    webhook_status = "no_configured"
    if webhook_url and consent:
        try:
            async with httpx.AsyncClient(timeout=12) as client:
                response = await client.post(
                    webhook_url,
                    json={
                        "lead_id": lead_id,
                        "project_id": project_id,
                        "payload": payload.model_dump(),
                        "analysis": output.model_dump(),
                        "selected_modules": selected_modules,
                        "access": access_payload,
                        "notes": notes,
                    },
                )
            webhook_status = f"sent:{response.status_code}"
            update_project_status(DB_PATH, project_id, "sent_to_n8n")
        except httpx.HTTPError:
            webhook_status = "failed"
            update_project_status(DB_PATH, project_id, "n8n_failed")
    elif consent:
        update_project_status(DB_PATH, project_id, "ready_no_webhook")

    n8n_result = None
    meta_validation = None
    if consent and (wants_whatsapp or wants_messenger):
        meta_validation = {}
        if wants_whatsapp:
            meta_validation["whatsapp"] = await validate_whatsapp(
                meta_access.get("whatsapp_phone_number_id", ""),
                meta_access.get("whatsapp_token", ""),
            )
        if wants_messenger:
            meta_validation["messenger"] = await validate_messenger(
                meta_access.get("facebook_page_id", ""),
                meta_access.get("messenger_page_token", ""),
            )

        n8n_result = provision_workflows(
            project_id,
            payload,
            meta_access,
            automation_options,
            wants_whatsapp,
            wants_messenger,
        )

    return templates.TemplateResponse(
        "implement.html",
        {
            "request": request,
            "payload": payload,
            "output": output,
            "lead_id": lead_id,
            "project_id": project_id,
            "webhook_status": webhook_status,
            "webhook_configured": bool(webhook_url),
            "consent": consent,
            "contract_consent": contract_consent,
            "access_consent": access_consent,
            "payment_method": payment_method,
            "delivery_channels": delivery_labels,
            "bot_preferences": bot_labels,
            "wants_whatsapp": wants_whatsapp,
            "wants_messenger": wants_messenger,
            "n8n_result": n8n_result,
            "meta_validation": meta_validation,
            "meta_oauth_connected": meta_oauth_connected,
            "automation_options": automation_options,
            "selected_modules": selected_modules,
        },
    )


@app.get("/implement")
async def implement_get():
    return RedirectResponse(url="/", status_code=303)


@app.post("/api/diagnose")
async def diagnose_api(payload: BusinessInput):
    output = run_analysis(payload)
    return JSONResponse(output.model_dump())


@app.post("/api/ai-reply")
async def ai_reply(payload: AIReplyRequest):
    context = payload.context or {}
    reply = await generate_ai_reply(payload.message, context)
    return {"reply": reply}


@app.get("/health")
async def health():
    return {"status": "ok"}
