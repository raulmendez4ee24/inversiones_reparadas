from __future__ import annotations

import os
import secrets
import urllib.parse
from contextlib import asynccontextmanager
from pathlib import Path

import httpx

from dotenv import load_dotenv
from fastapi import FastAPI, Form, Request
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from starlette.middleware.sessions import SessionMiddleware

import sys

if __package__ in (None, ""):
    sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.core.access import access_items
from app.core.analysis import run_analysis
from app.core.ai_reply import generate_ai_reply
from app.core.gemini_client import healthcheck as gemini_healthcheck
from app.core.meta import validate_messenger, validate_whatsapp
from app.core.models import BusinessInput
from app.core.modules import catalog
from app.core.n8n import provision_workflows
from app.core.storage import (
    fetch_lead,
    fetch_lead_id_by_email,
    fetch_latest_project,
    fetch_oauth_token,
    init_db,
    save_lead,
    save_lead_capture,
    save_oauth_token,
    save_project,
    update_lead_credentials,
    update_project_status,
    validate_portal_login,
)

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR.parent / "data"
DB_PATH = DATA_DIR / "leads.db"


@asynccontextmanager
async def lifespan(_: FastAPI):
    global DB_PATH, DATA_DIR
    try:
        DATA_DIR.mkdir(exist_ok=True)
        init_db(DB_PATH)
        print(f"[startup] db ready at {DB_PATH}", flush=True)
    except Exception as exc:
        fallback_dir = Path(os.getenv("FALLBACK_DATA_DIR", "/tmp/kan_logic"))
        fallback_dir.mkdir(parents=True, exist_ok=True)
        DB_PATH = fallback_dir / "leads.db"
        DATA_DIR = fallback_dir
        init_db(DB_PATH)
        print(f"[startup] db fallback at {DB_PATH} ({exc})", flush=True)
    yield


app = FastAPI(title="K'an Logic Systems", version="0.1.0", lifespan=lifespan)
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")

templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))


def _clean_calendar_url(value: str) -> str:
    raw = (value or "").strip()
    if raw in ("", "#", "#contact"):
        return ""
    # Prevent accidental self-loop if someone configures /agenda as external URL.
    if raw.startswith("/agenda"):
        return ""
    return raw


def _session_secret() -> str:
    secret = os.getenv("SESSION_SECRET", "").strip()
    if secret:
        return secret
    return secrets.token_urlsafe(32)


app.add_middleware(
    SessionMiddleware,
    secret_key=_session_secret(),
    same_site="lax",
    https_only=bool(os.getenv("SESSION_COOKIE_SECURE"))
    or os.getenv("APP_PUBLIC_URL", "").strip().lower().startswith("https://"),
    max_age=60 * 60 * 24 * 14,
)


def _get_founder_info():
    calendar_url = _clean_calendar_url(os.getenv("FOUNDER_CALENDAR_URL", ""))
    return {
        "name": os.getenv("FOUNDER_NAME", "Raul Mendez"),
        "role": os.getenv("FOUNDER_ROLE", "Director de Ingeniería & Automatización"),
        "headline": os.getenv("FOUNDER_HEADLINE", "Infraestructura digital de clase mundial. Privacidad absoluta. Resultados exponenciales."),
        "bio": os.getenv(
            "FOUNDER_BIO",
            "En K'an construimos el sistema nervioso digital de tu empresa. Fusionamos inteligencia artificial avanzada con seguridad criptográfica de grado militar (AES-256). Tu información es sagrada y tu tiempo es el activo más valioso. Diseñamos para escalar.",
        ),
        "photo_url": os.getenv("FOUNDER_PHOTO_URL", "/static/founder.svg"),
        "whatsapp": os.getenv("FOUNDER_WHATSAPP", "").strip(),
        "calendar_url": calendar_url,
    }


def _legal_contact_info() -> dict[str, str]:
    founder = _get_founder_info()
    support_whatsapp = os.getenv("SUPPORT_WHATSAPP", "").strip() or founder.get("whatsapp", "")
    support_whatsapp_clean = support_whatsapp.replace("+", "").replace(" ", "")
    return {
        "company_name": os.getenv("LEGAL_BRAND_NAME", "K'an Logic Systems").strip(),
        "company_legal_name": os.getenv("LEGAL_COMPANY_NAME", "K'an Logic Systems").strip(),
        "support_email": os.getenv("SUPPORT_EMAIL", "soporte@kanlogicsystems.com").strip(),
        "support_phone": os.getenv("SUPPORT_PHONE", "+52 55 0000 0000").strip(),
        "support_whatsapp": support_whatsapp,
        "support_whatsapp_clean": support_whatsapp_clean,
        "support_hours": os.getenv("SUPPORT_HOURS", "Lunes a Viernes, 9:00 a 18:00 (CDMX)").strip(),
        "legal_address": os.getenv("LEGAL_ADDRESS", "Ciudad de Mexico, Mexico").strip(),
        "legal_country": os.getenv("LEGAL_COUNTRY", "Mexico").strip(),
        "legal_tax_id": os.getenv("LEGAL_TAX_ID", "No publicado").strip(),
        "privacy_effective_date": os.getenv("LEGAL_EFFECTIVE_DATE", "15 de febrero de 2026").strip(),
    }


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


def _payment_url_for_method(
    payment_method: str,
    lead_id: int,
    project_id: int,
    company_name: str,
) -> str | None:
    method = (payment_method or "").strip().lower()
    links = {
        "tarjeta": os.getenv("PAYMENT_URL_CARD", "").strip(),
        "transferencia": os.getenv("PAYMENT_URL_TRANSFER", "").strip(),
    }
    default_link = os.getenv("PAYMENT_URL_DEFAULT", "").strip()
    base = links.get(method) or default_link
    if not base:
        return None

    company_encoded = urllib.parse.quote((company_name or "").strip())
    return (
        base.replace("{lead_id}", str(lead_id))
        .replace("{project_id}", str(project_id))
        .replace("{company_name}", company_encoded)
        .replace("{payment_method}", method or "pendiente")
    )


def _payment_url_for_express(
    offer_key: str,
    lead_id: int,
    company_name: str,
) -> str | None:
    offer = (offer_key or "").strip().lower()
    links = {
        "chatbot_whatsapp": os.getenv("PAYMENT_URL_EXPRESS_CHATBOT", "").strip(),
        "agenda_chatbot": os.getenv("PAYMENT_URL_EXPRESS_AGENDA", "").strip(),
    }
    default_link = os.getenv("PAYMENT_URL_EXPRESS_DEFAULT", "").strip()
    base = links.get(offer) or default_link
    if not base:
        return None

    company_encoded = urllib.parse.quote((company_name or "").strip())
    return (
        base.replace("{lead_id}", str(lead_id))
        .replace("{company_name}", company_encoded)
        .replace("{offer}", offer or "express")
    )


def _mercadopago_config() -> dict[str, str]:
    return {
        "public_key": os.getenv("MP_PUBLIC_KEY", "").strip(),
        "access_token": os.getenv("MP_ACCESS_TOKEN", "").strip(),
        "api_base": os.getenv("MP_API_BASE_URL", "https://api.mercadopago.com").strip().rstrip("/"),
    }


EXPRESS_CATALOG = {
    "chatbot_whatsapp": {
        "label": "Chatbot basico para WhatsApp",
        "price_mxn": 2000,
        "modules": [
            "Bot de ventas para WhatsApp",
            "Chatbot de atencion al cliente",
        ],
    },
    "agenda_chatbot": {
        "label": "Agenda + chatbot por WhatsApp",
        "price_mxn": 3500,
        "modules": [
            "Bot de ventas para WhatsApp",
            "Eficiencia administrativa (archivos y carpetas)",
        ],
    },
}


def _express_offer_from_payload(payload: BusinessInput) -> str | None:
    budget = (payload.budget_range or "").strip().lower()
    if "express" not in budget:
        return None

    text = " ".join(
        [
            payload.business_focus or "",
            payload.goals or "",
            payload.processes or "",
            budget,
        ]
    ).lower()

    if any(token in text for token in ["agenda", "cita", "recordatorio", "3,500"]):
        return "agenda_chatbot"
    return "chatbot_whatsapp"


def _express_details_from_payload(payload: BusinessInput) -> dict | None:
    offer_key = _express_offer_from_payload(payload)
    if not offer_key:
        return None
    details = EXPRESS_CATALOG.get(offer_key) or {}
    if not details:
        return None
    return {
        "offer_key": offer_key,
        "label": details.get("label", "Solucion express"),
        "price_mxn": int(details.get("price_mxn", 0) or 0),
        "modules": list(details.get("modules", [])),
    }


def _build_quick_payload(
    quick_offer: str,
    company_name: str,
    contact_email: str,
    contact_whatsapp: str,
) -> BusinessInput:
    offer_key = (quick_offer or "").strip().lower()
    if offer_key not in {"chatbot_whatsapp", "agenda_chatbot"}:
        offer_key = "chatbot_whatsapp"

    company = (company_name or "").strip() or "Negocio local"
    email = (contact_email or "").strip() or None
    whatsapp = (contact_whatsapp or "").strip() or None

    if offer_key == "agenda_chatbot":
        return BusinessInput(
            company_name=company,
            industry="Servicios",
            business_focus="Agenda y confirmacion de citas por WhatsApp",
            region="Mexico",
            team_size=1,
            employee_band="1-5",
            transaction_volume="bajo",
            tooling_level="solo_whatsapp",
            manual_hours_per_week=6,
            selected_modules=["whatsapp_ventas", "eficiencia_administrativa"],
            processes="agenda, citas, confirmaciones y recordatorios",
            bottlenecks=(
                "Confirmamos citas manualmente por chat y se pierden espacios "
                "por falta de recordatorios automaticos."
            ),
            systems="WhatsApp",
            goals="Automatizar agenda, confirmaciones y seguimiento por WhatsApp.",
            budget_range="$3,500 MXN (precio fijo express)",
            contact_email=email,
            contact_whatsapp=whatsapp,
        )

    return BusinessInput(
        company_name=company,
        industry="Comercio",
        business_focus="Atencion y ventas por WhatsApp con chatbot basico",
        region="Mexico",
        team_size=1,
        employee_band="1-5",
        transaction_volume="bajo",
        tooling_level="solo_whatsapp",
        manual_hours_per_week=6,
        selected_modules=["whatsapp_ventas"],
        processes="mensajes entrantes, FAQ y seguimiento de prospectos",
        bottlenecks=(
            "Responder mensajes manualmente quita tiempo y provoca "
            "que algunos prospectos se pierdan sin seguimiento."
        ),
        systems="WhatsApp",
        goals="Activar chatbot rapido para responder FAQ y captar datos de contacto.",
        budget_range="$2,000 MXN (precio fijo express)",
        contact_email=email,
        contact_whatsapp=whatsapp,
    )


class AIReplyRequest(BaseModel):
    message: str
    channel: str | None = None
    sender: str | None = None
    context: dict | None = None


class MPPreferenceRequest(BaseModel):
    lead_id: int
    project_id: int
    checkout_token: str
    payer_email: str | None = None
    payment_method: str | None = None


@app.post("/api/capture", response_class=JSONResponse)
async def capture_lead(
    request: Request,
    email: str = Form(...),
    phone: str = Form(""),
    consent_contact: str = Form(""),
    source: str = Form(""),
):
    consent_flag = consent_contact in ("1", "true", "on", "si", "yes")
    user_agent = request.headers.get("user-agent", "")
    ip = request.client.host if request.client else None
    try:
        capture_id = save_lead_capture(
            DB_PATH,
            email=email,
            phone=phone,
            consent_contact=consent_flag,
            source=source or request.headers.get("referer", ""),
            user_agent=user_agent,
            ip=ip,
        )
    except ValueError as exc:
        return JSONResponse({"ok": False, "error": str(exc)}, status_code=400)

    return {"ok": True, "capture_id": capture_id}


@app.get("/api/health/ai", response_class=JSONResponse)
async def ai_health():
    status = gemini_healthcheck()
    if status.get("ok"):
        code = 200
    elif status.get("error") == "missing_api_key":
        code = 400
    else:
        code = 503
    return JSONResponse(status, status_code=code)


@app.post("/quick-start")
async def quick_start(
    quick_offer: str = Form("chatbot_whatsapp"),
    company_name: str = Form(...),
    contact_email: str = Form(...),
    contact_whatsapp: str = Form(""),
    consent_contact: str = Form(""),
    direct_to_payment: str = Form("0"),
):
    if consent_contact not in ("1", "true", "on", "si", "yes"):
        return RedirectResponse(url="/#quick-order", status_code=303)

    payload = _build_quick_payload(
        quick_offer=quick_offer,
        company_name=company_name,
        contact_email=contact_email,
        contact_whatsapp=contact_whatsapp,
    )
    output = run_analysis(payload)
    lead_id, _ = save_lead(DB_PATH, payload, output)

    allow_direct_express = os.getenv("EXPRESS_DIRECT_PAYMENT", "0").strip().lower() in ("1", "true", "on", "si", "yes")
    if allow_direct_express and direct_to_payment in ("1", "true", "on", "si", "yes"):
        payment_url = _payment_url_for_express(
            offer_key=quick_offer,
            lead_id=lead_id,
            company_name=payload.company_name,
        )
        if payment_url:
            return RedirectResponse(url=payment_url, status_code=303)

    return RedirectResponse(url=f"/onboarding/{lead_id}", status_code=303)


@app.post("/api/payments/mercadopago/preference", response_class=JSONResponse)
async def mercadopago_preference(request: Request, payload: MPPreferenceRequest):
    cfg = _mercadopago_config()
    if not cfg["public_key"] or not cfg["access_token"]:
        return JSONResponse(
            {"ok": False, "error": "mercadopago_not_configured"},
            status_code=503,
        )

    try:
        lead_payload, lead_output = fetch_lead(DB_PATH, int(payload.lead_id))
    except ValueError:
        return JSONResponse({"ok": False, "error": "lead_not_found"}, status_code=404)

    latest_project = fetch_latest_project(DB_PATH, int(payload.lead_id))
    if not latest_project or int(latest_project.get("id", 0)) != int(payload.project_id):
        return JSONResponse({"ok": False, "error": "project_not_found"}, status_code=404)

    token_key = f"mp_checkout_token:{payload.lead_id}:{payload.project_id}"
    expected_token = str(request.session.get(token_key) or "")
    if not expected_token or payload.checkout_token != expected_token:
        return JSONResponse({"ok": False, "error": "invalid_checkout_token"}, status_code=403)

    method = (payload.payment_method or "").strip().lower()
    if method and method != "tarjeta":
        return JSONResponse({"ok": False, "error": "invalid_payment_method"}, status_code=400)

    # Security: amount is always server-side, never client-provided.
    express_details = _express_details_from_payload(lead_payload)
    server_amount = express_details["price_mxn"] if express_details and express_details.get("price_mxn") else lead_output.pricing.setup_fee_mxn
    amount = max(1.0, float(server_amount or 0))
    amount = round(amount, 2)
    company_name = lead_payload.company_name
    payer_email = (payload.payer_email or lead_payload.contact_email or "").strip() or None
    title = os.getenv("MP_ITEM_TITLE", "Implementacion K'an Logic Systems").strip()
    statement_descriptor = os.getenv("MP_STATEMENT_DESCRIPTOR", "KANLOGIC").strip()
    app_public = os.getenv("APP_PUBLIC_URL", "").strip().rstrip("/")
    if not app_public:
        app_public = str(request.base_url).rstrip("/")

    success_url = os.getenv("MP_BACK_URL_SUCCESS", f"{app_public}/")
    pending_url = os.getenv("MP_BACK_URL_PENDING", f"{app_public}/")
    failure_url = os.getenv("MP_BACK_URL_FAILURE", f"{app_public}/")
    notification_url = os.getenv("MP_WEBHOOK_URL", "").strip()

    body = {
        "items": [
            {
                "title": title,
                "quantity": 1,
                "currency_id": "MXN",
                "unit_price": amount,
            }
        ],
        "external_reference": f"lead-{payload.lead_id}-project-{payload.project_id}",
        "statement_descriptor": statement_descriptor[:13] if statement_descriptor else "KANLOGIC",
        "metadata": {
            "lead_id": payload.lead_id,
            "project_id": payload.project_id,
            "company_name": company_name,
            "payment_method": "tarjeta",
        },
        "back_urls": {
            "success": success_url,
            "pending": pending_url,
            "failure": failure_url,
        },
        "auto_return": "approved",
    }
    if payer_email:
        body["payer"] = {"email": payer_email}
    if notification_url:
        body["notification_url"] = notification_url

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(
                f"{cfg['api_base']}/checkout/preferences",
                headers={
                    "Authorization": f"Bearer {cfg['access_token']}",
                    "Content-Type": "application/json",
                },
                json=body,
            )
    except httpx.HTTPError:
        return JSONResponse({"ok": False, "error": "mercadopago_unreachable"}, status_code=502)

    if response.status_code >= 300:
        detail = ""
        try:
            detail = str(response.json())
        except ValueError:
            detail = response.text
        return JSONResponse(
            {"ok": False, "error": "mercadopago_preference_failed", "detail": detail[:400]},
            status_code=502,
        )

    data = response.json()
    preference_id = data.get("id")
    if not preference_id:
        return JSONResponse(
            {"ok": False, "error": "mercadopago_invalid_preference"},
            status_code=502,
        )

    return {
        "ok": True,
        "preference_id": preference_id,
        "public_key": cfg["public_key"],
        "init_point": data.get("init_point"),
    }


@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    founder = _get_founder_info()
    trust = [
        "OpenAI Enterprise",
        "Google Cloud Platform",
        "Meta Business",
        "AES-256 Encryption",
        "Zero-Knowledge Privacy",
    ]
    return templates.TemplateResponse(
        "index.html",
        {
            "request": request,
            "founder": founder,
            "trust": trust,
        },
    )


@app.get("/founder", response_class=HTMLResponse)
async def founder_page(request: Request):
    return templates.TemplateResponse(
        "founder.html",
        {
            "request": request,
            "founder": _get_founder_info(),
        },
    )


@app.get("/arquitecto", response_class=HTMLResponse)
async def arquitecto_page(request: Request):
    return templates.TemplateResponse(
        "founder.html",
        {
            "request": request,
            "founder": _get_founder_info(),
        },
    )


@app.get("/agenda")
async def agenda_redirect(
    lead_id: int | None = None,
    company: str = "",
    source: str = "",
):
    founder = _get_founder_info()
    calendar_url = (founder.get("calendar_url") or "").strip()
    if calendar_url:
        return RedirectResponse(url=calendar_url, status_code=302)

    whatsapp = (founder.get("whatsapp") or "").strip().replace("+", "").replace(" ", "")
    if whatsapp:
        context = (company or "tu empresa").strip()
        if lead_id:
            context = f"Folio {lead_id} ({context})"
        text = f"Hola, quiero agendar una sesion de activacion para {context}."
        if source:
            text += f" Fuente: {source}."
        wa_url = f"https://wa.me/{whatsapp}?text={urllib.parse.quote(text)}"
        return RedirectResponse(url=wa_url, status_code=302)

    return RedirectResponse(url="/#diagnostico", status_code=302)


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
    express_details = _express_details_from_payload(payload)
    is_express = express_details is not None

    return templates.TemplateResponse(
        "onboarding_express.html" if is_express else "onboarding.html",
        {
            "request": request,
            "payload": payload,
            "output": output,
            "lead_id": lead_id,
            "access_code": None,
            "modules": catalog(),
            "recommended": recommended,
            "access_items": access_items(),
            "meta_connected": meta_connected,
            "founder": _get_founder_info(),
            "is_express": is_express,
            "express_offer": express_details.get("offer_key") if express_details else "",
            "express_label": express_details.get("label") if express_details else "",
            "express_price_mxn": express_details.get("price_mxn") if express_details else 0,
            "express_modules": express_details.get("modules") if express_details else [],
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
    employee_band: str = Form(""),
    transaction_volume: str = Form(""),
    tooling_level: str = Form(""),
    manual_hours_per_week: float = Form(0),
    selected_modules: list[str] = Form(default=[]),
    processes: str = Form(""),
    bottlenecks: str = Form(...),
    systems: str = Form(""),
    goals: str = Form(""),
    budget_range: str = Form(""),
    contact_email: str = Form(...),
    contact_whatsapp: str = Form(""),
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
        employee_band=employee_band or None,
        transaction_volume=transaction_volume or None,
        tooling_level=tooling_level or None,
        manual_hours_per_week=manual_hours_per_week or 0,
        selected_modules=selected_modules or [],
        processes=processes,
        bottlenecks=bottlenecks,
        systems=systems,
        goals=goals,
        budget_range=budget_range or None,
        contact_email=contact_email or None,
        contact_whatsapp=contact_whatsapp or None,
    )

    output = run_analysis(payload)
    return templates.TemplateResponse(
        "report.html",
        {
            "request": request,
            "payload": payload,
            "output": output,
            "founder": _get_founder_info(),
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
    employee_band: str = Form(""),
    transaction_volume: str = Form(""),
    tooling_level: str = Form(""),
    manual_hours_per_week: float = Form(0),
    selected_modules: list[str] = Form(default=[]),
    processes: str = Form(""),
    bottlenecks: str = Form(...),
    systems: str = Form(""),
    goals: str = Form(""),
    budget_range: str = Form(""),
    contact_email: str = Form(...),
    contact_whatsapp: str = Form(""),
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
        employee_band=employee_band or None,
        transaction_volume=transaction_volume or None,
        tooling_level=tooling_level or None,
        manual_hours_per_week=manual_hours_per_week or 0,
        selected_modules=selected_modules or [],
        processes=processes,
        bottlenecks=bottlenecks,
        systems=systems,
        goals=goals,
        budget_range=budget_range or None,
        contact_email=contact_email or None,
        contact_whatsapp=contact_whatsapp or None,
    )

    output = run_analysis(payload)
    lead_id, access_code = save_lead(DB_PATH, payload, output)
    recommended = {module.name for module in output.recommended_modules}

    return templates.TemplateResponse(
        "onboarding.html",
        {
            "request": request,
            "payload": payload,
            "output": output,
            "lead_id": lead_id,
            "access_code": access_code,
            "modules": catalog(),
            "recommended": recommended,
            "access_items": access_items(),
            "meta_connected": False,
            "founder": _get_founder_info(),
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

    try:
        save_oauth_token(DB_PATH, lead_id, "meta", data)
    except ValueError as exc:
        return templates.TemplateResponse(
            "meta_connected.html",
            {
                "request": request,
                "status": "error",
                "message": f"No se pudo guardar el token de forma segura: {exc}",
                "lead_id": lead_id,
            },
        )
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
                "founder": _get_founder_info(),
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
                "founder": _get_founder_info(),
            },
        )

    express_details = _express_details_from_payload(payload)
    is_express = express_details is not None
    selected_modules = form.getlist("selected_modules")
    if not selected_modules:
        if is_express and express_details:
            selected_modules = express_details.get("modules", [])
        else:
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
    portal_email = (form.get("portal_email") or "").strip()
    portal_password = (form.get("portal_password") or "").strip()
    portal_password_confirm = (form.get("portal_password_confirm") or "").strip()
    marketing_opt_in = form.get("marketing_opt_in") == "on"
    marketing_channel = (form.get("marketing_channel") or "").strip()

    login_warning = None
    if not portal_email:
        login_warning = "Necesitamos un correo para activar tu portal."
    elif not portal_password:
        login_warning = "Necesitas crear una contrasena para tu portal."
    elif portal_password != portal_password_confirm:
        login_warning = "Las contrasenas no coinciden."
    elif len(portal_password) < 6:
        login_warning = "La contrasena debe tener al menos 6 caracteres."

    if not login_warning:
        update_lead_credentials(
            DB_PATH,
            lead_id,
            portal_email,
            portal_password,
            marketing_opt_in,
            marketing_channel,
        )

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
    encryption_key_configured = bool(os.getenv("DATA_ENCRYPTION_KEY", "").strip())
    security_warning = None

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
        "marketing_opt_in": marketing_opt_in,
        "marketing_channel": marketing_channel,
    }
    for item in access_items():
        key = f"access_{item['key']}"
        value = (form.get(key) or "").strip()
        if value:
            access_payload[item["key"]] = {
                "label": item["label"],
                "value": value,
            }
    access_payload_db = access_payload
    if not encryption_key_configured:
        # Keep onboarding moving even if secure storage is not configured yet.
        access_payload_db = {}
        security_warning = (
            "DATA_ENCRYPTION_KEY no esta configurada. "
            "Continuamos el flujo, pero no guardamos accesos sensibles en base de datos."
        )

    notes = (form.get("notes") or "").strip()
    status = "pending_consent" if not consent else "queued"
    try:
        project_id = save_project(
            DB_PATH,
            lead_id,
            selected_modules,
            access_payload_db,
            notes,
            status,
        )
    except ValueError as exc:
        return templates.TemplateResponse(
            "implement.html",
            {
                "request": request,
                "payload": payload,
                "output": output,
                "lead_id": lead_id,
                "error": str(exc),
                "selected_modules": selected_modules,
                "founder": _get_founder_info(),
            },
        )
    payment_url = _payment_url_for_method(
        payment_method=payment_method,
        lead_id=lead_id,
        project_id=project_id,
        company_name=payload.company_name,
    )
    pay_amount_mxn = int(output.pricing.setup_fee_mxn or 0)
    if is_express and express_details and express_details.get("price_mxn"):
        pay_amount_mxn = int(express_details["price_mxn"])
    mp_cfg = _mercadopago_config()
    mp_checkout_enabled = bool(mp_cfg["public_key"] and mp_cfg["access_token"])
    mp_checkout_token = ""
    if consent and payment_method == "tarjeta" and mp_checkout_enabled:
        mp_checkout_token = secrets.token_urlsafe(24)
        request.session[f"mp_checkout_token:{lead_id}:{project_id}"] = mp_checkout_token

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
            "login_warning": login_warning,
            "automation_options": automation_options,
            "selected_modules": selected_modules,
            "payment_url": payment_url,
            "pay_amount_mxn": pay_amount_mxn,
            "mp_checkout_enabled": mp_checkout_enabled,
            "mp_public_key": mp_cfg["public_key"],
            "mp_checkout_token": mp_checkout_token,
            "security_warning": security_warning,
            "founder": _get_founder_info(),
            "is_express": is_express,
            "express_offer": express_details.get("offer_key") if express_details else "",
            "express_label": express_details.get("label") if express_details else "",
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


@app.get("/portal", response_class=HTMLResponse)
async def portal_login(request: Request):
    return templates.TemplateResponse(
        "portal_login.html",
        {
            "request": request,
            "error": None,
            "founder": _get_founder_info(),
        },
    )


@app.post("/portal/login", response_class=HTMLResponse)
async def portal_login_post(
    request: Request,
    email: str = Form(""),
    password: str = Form(""),
):
    ok, error = validate_portal_login(DB_PATH, email, password)
    if not ok:
        return templates.TemplateResponse(
            "portal_login.html",
            {
                "request": request,
                "error": error,
                "founder": _get_founder_info(),
            },
        )

    lead_id = fetch_lead_id_by_email(DB_PATH, email)
    if lead_id is None:
        return templates.TemplateResponse(
            "portal_login.html",
            {
                "request": request,
                "error": "No encontramos tu cuenta.",
                "founder": _get_founder_info(),
            },
        )

    request.session["portal_lead_id"] = lead_id
    return RedirectResponse(url="/portal/home", status_code=303)


@app.get("/portal/home", response_class=HTMLResponse)
async def portal_home(request: Request):
    lead_id = request.session.get("portal_lead_id")
    if not lead_id:
        return RedirectResponse(url="/portal", status_code=303)

    try:
        payload, output = fetch_lead(DB_PATH, int(lead_id))
    except ValueError:
        request.session.pop("portal_lead_id", None)
        return RedirectResponse(url="/portal", status_code=303)

    latest_project = fetch_latest_project(DB_PATH, int(lead_id))
    return templates.TemplateResponse(
        "portal_home.html",
        {
            "request": request,
            "payload": payload,
            "output": output,
            "lead_id": lead_id,
            "latest_project": latest_project,
            "founder": _get_founder_info(),
        },
    )


@app.get("/portal/logout")
async def portal_logout(request: Request):
    request.session.pop("portal_lead_id", None)
    return RedirectResponse(url="/portal", status_code=303)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/about", response_class=HTMLResponse)
async def about(request: Request):
    return templates.TemplateResponse(
        "about.html",
        {
            "request": request,
            "founder": _get_founder_info(),
            "legal": _legal_contact_info(),
        },
    )


@app.get("/nosotros")
async def nosotros():
    return RedirectResponse(url="/about", status_code=302)


@app.get("/contact", response_class=HTMLResponse)
async def contact(request: Request):
    return templates.TemplateResponse(
        "contact.html",
        {
            "request": request,
            "founder": _get_founder_info(),
            "legal": _legal_contact_info(),
        },
    )


@app.get("/privacy", response_class=HTMLResponse)
async def privacy(request: Request):
    legal = _legal_contact_info()
    return templates.TemplateResponse(
        "legal_privacy.html",
        {
            "request": request,
            "support_email": legal["support_email"],
            "legal": legal,
            "founder": _get_founder_info(),
        },
    )


@app.get("/terms", response_class=HTMLResponse)
async def terms(request: Request):
    legal = _legal_contact_info()
    return templates.TemplateResponse(
        "legal_terms.html",
        {
            "request": request,
            "support_email": legal["support_email"],
            "legal": legal,
            "founder": _get_founder_info(),
        },
    )


@app.get("/data-deletion", response_class=HTMLResponse)
async def data_deletion(request: Request):
    legal = _legal_contact_info()
    return templates.TemplateResponse(
        "legal_data_deletion.html",
        {
            "request": request,
            "support_email": legal["support_email"],
            "legal": legal,
            "founder": _get_founder_info(),
        },
    )
