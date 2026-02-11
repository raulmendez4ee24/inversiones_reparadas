from __future__ import annotations

from typing import List

from .models import AutomationModule


def catalog() -> List[AutomationModule]:
    return [
        AutomationModule(
            name="Bot de ventas para WhatsApp",
            description="Captura leads, responde FAQs, califica prospectos y agenda llamadas.",
            effort="M",
            impact=5,
            integrations=["WhatsApp", "CRM"],
            estimated_weeks=3,
            tags=["whatsapp", "ventas", "leads", "seguimiento", "cotizacion", "citas", "agenda", "reservas"],
        ),
        AutomationModule(
            name="Chatbot de atencion al cliente",
            description="Responde preguntas frecuentes en web o WhatsApp y escala a un humano.",
            effort="M",
            impact=4,
            integrations=["Webchat", "WhatsApp", "CRM"],
            estimated_weeks=3,
            tags=["chatbot", "soporte", "web", "whatsapp", "faq", "citas", "agenda"],
        ),
        AutomationModule(
            name="Conciliacion bancaria automatica",
            description="Cruza movimientos bancarios con facturas y reportes contables.",
            effort="M",
            impact=4,
            integrations=["Banco", "ERP", "Contabilidad"],
            estimated_weeks=3,
            tags=["banco", "conciliacion", "contabilidad", "tesoreria"],
        ),
        AutomationModule(
            name="Sincronizacion Shopify-ERP",
            description="Actualiza inventario, pedidos y clientes entre Shopify y ERP.",
            effort="L",
            impact=4,
            integrations=["Shopify", "ERP"],
            estimated_weeks=4,
            tags=["shopify", "inventario", "erp", "stock", "pedido"],
        ),
        AutomationModule(
            name="Facturacion inteligente",
            description="Genera facturas, valida datos y envia comprobantes automaticamente.",
            effort="S",
            impact=3,
            integrations=["Facturacion", "Correo"],
            estimated_weeks=2,
            tags=["factura", "facturacion", "comprobante", "correo", "sat"],
        ),
        AutomationModule(
            name="Reportes y dashboards operativos",
            description="Convierte datos dispersos en dashboards semanales con alertas.",
            effort="S",
            impact=3,
            integrations=["BI", "Google Sheets"],
            estimated_weeks=2,
            tags=["reporte", "dashboard", "kpi", "excel", "administracion", "indicadores"],
        ),
        AutomationModule(
            name="Ruteo de tickets de soporte",
            description="Clasifica tickets y asigna SLA automaticamente.",
            effort="S",
            impact=3,
            integrations=["Helpdesk"],
            estimated_weeks=2,
            tags=["soporte", "ticket", "servicio", "sla"],
        ),
        AutomationModule(
            name="Enriquecimiento y limpieza de CRM",
            description="Depura duplicados y completa datos de clientes.",
            effort="S",
            impact=2,
            integrations=["CRM"],
            estimated_weeks=1,
            tags=["crm", "duplicado", "limpieza", "datos"],
        ),
        AutomationModule(
            name="Onboarding de personal",
            description="Automatiza checklist, accesos y capacitaciones.",
            effort="S",
            impact=2,
            integrations=["HR", "Correo"],
            estimated_weeks=1,
            tags=["onboarding", "rh", "recursos humanos", "capacitar"],
        ),
        AutomationModule(
            name="Automatizacion de correo",
            description="Clasifica, etiqueta y responde correos repetitivos.",
            effort="S",
            impact=3,
            integrations=["Correo"],
            estimated_weeks=2,
            tags=["correo", "email", "bandeja", "seguimiento"],
        ),
    ]
