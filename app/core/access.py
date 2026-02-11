from __future__ import annotations

from typing import Dict, List


ACCESS_ITEMS: List[Dict[str, object]] = [
    {
        "key": "whatsapp",
        "label": "WhatsApp Business API",
        "description": "Proveedor, numero, tipo de API (Meta/Twilio) y acceso.",
        "placeholder": "Ej. Meta Cloud API, numero +521..., token, URL webhook",
        "modules": ["Bot de ventas para WhatsApp", "Chatbot de atencion al cliente"],
    },
    {
        "key": "website",
        "label": "Sitio web / Widget",
        "description": "Acceso o dominio para instalar el chatbot.",
        "placeholder": "URL del sitio + acceso al panel o tag manager",
        "modules": ["Chatbot de atencion al cliente"],
    },
    {
        "key": "crm",
        "label": "CRM",
        "description": "Acceso al CRM para leads, pipeline y clientes.",
        "placeholder": "Ej. HubSpot, Pipedrive, Zoho + API key",
        "modules": [
            "Bot de ventas para WhatsApp",
            "Enriquecimiento y limpieza de CRM",
        ],
    },
    {
        "key": "shopify",
        "label": "Shopify",
        "description": "Admin o API key para inventario, pedidos y clientes.",
        "placeholder": "Ej. store.myshopify.com + Admin API access token",
        "modules": ["Sincronizacion Shopify-ERP"],
    },
    {
        "key": "erp",
        "label": "ERP / Inventario",
        "description": "Sistema ERP, endpoint y credenciales.",
        "placeholder": "Ej. Odoo / SAP / Bind ERP + API key",
        "modules": ["Sincronizacion Shopify-ERP", "Conciliacion bancaria automatica"],
    },
    {
        "key": "banking",
        "label": "Bancos / Conciliacion",
        "description": "Formato de estados de cuenta o API bancaria.",
        "placeholder": "Ej. Banorte CSV semanal o API token",
        "modules": ["Conciliacion bancaria automatica"],
    },
    {
        "key": "invoicing",
        "label": "Facturacion",
        "description": "Proveedor de facturacion o sistema fiscal.",
        "placeholder": "Ej. Facturama / Alegra / Contpaqi + credenciales",
        "modules": ["Facturacion inteligente"],
    },
    {
        "key": "helpdesk",
        "label": "Helpdesk / Soporte",
        "description": "Herramienta de tickets y acceso.",
        "placeholder": "Ej. Zendesk / Freshdesk + API key",
        "modules": ["Ruteo de tickets de soporte"],
    },
    {
        "key": "email",
        "label": "Correo / Mensajeria",
        "description": "Proveedor de correo para automatizaciones.",
        "placeholder": "Ej. Gmail / Outlook + cuenta y metodo de acceso",
        "modules": ["Automatizacion de correo"],
    },
    {
        "key": "bi",
        "label": "BI / Reportes",
        "description": "Fuentes de datos y herramienta de dashboards.",
        "placeholder": "Ej. Google Sheets + Looker Studio",
        "modules": ["Reportes y dashboards operativos"],
    },
    {
        "key": "hr",
        "label": "HR / Onboarding",
        "description": "Sistema de recursos humanos o accesos internos.",
        "placeholder": "Ej. BambooHR / Google Workspace",
        "modules": ["Onboarding de personal"],
    },
]


def access_items() -> List[Dict[str, object]]:
    return ACCESS_ITEMS
