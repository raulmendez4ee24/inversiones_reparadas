import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient, type Plan, type OrgStatus, type HealthStatus, type WorkflowStatus, type IntegrationStatus, type ApprovalStatus } from '@prisma/client';

const prisma = new PrismaClient();

function daysFromNow(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function minutesAgo(mins: number) {
  return new Date(Date.now() - mins * 60 * 1000);
}

async function upsertUser(input: {
  email: string;
  name: string;
  password: string;
  systemRole?: 'NONE' | 'SUPER_ADMIN';
}) {
  const passwordHash = await bcrypt.hash(input.password, 12);
  return prisma.user.upsert({
    where: { email: input.email.toLowerCase() },
    update: { name: input.name, passwordHash, systemRole: input.systemRole ?? 'NONE', isActive: true },
    create: { email: input.email.toLowerCase(), name: input.name, passwordHash, systemRole: input.systemRole ?? 'NONE' },
  });
}

async function main() {
  const systemOrg = await prisma.organization.upsert({
    where: { id: 'org_system' },
    update: { name: 'Kan Logic Systems', plan: 'enterprise' satisfies Plan, status: 'active' satisfies OrgStatus },
    create: { id: 'org_system', name: 'Kan Logic Systems', plan: 'enterprise' satisfies Plan, status: 'active' satisfies OrgStatus },
  });

  const demoOrg = await prisma.organization.upsert({
    where: { id: 'org_demo' },
    update: { name: 'Empresa Demo SA', plan: 'growth' satisfies Plan, status: 'active' satisfies OrgStatus },
    create: { id: 'org_demo', name: 'Empresa Demo SA', plan: 'growth' satisfies Plan, status: 'active' satisfies OrgStatus },
  });

  const superAdmin = await upsertUser({
    email: 'admin@kanlogic.systems',
    name: 'Super Admin',
    password: 'admin123',
    systemRole: 'SUPER_ADMIN',
  });

  const orgAdmin = await upsertUser({
    email: 'demo@empresa.com',
    name: 'Juan Pérez',
    password: 'demo123',
  });

  const orgUser = await upsertUser({
    email: 'user@empresa.com',
    name: 'María García',
    password: 'user123',
  });

  await prisma.membership.upsert({
    where: { userId_organizationId: { userId: superAdmin.id, organizationId: systemOrg.id } },
    update: { role: 'ORG_ADMIN' },
    create: { userId: superAdmin.id, organizationId: systemOrg.id, role: 'ORG_ADMIN' },
  });

  await prisma.membership.upsert({
    where: { userId_organizationId: { userId: orgAdmin.id, organizationId: demoOrg.id } },
    update: { role: 'ORG_ADMIN' },
    create: { userId: orgAdmin.id, organizationId: demoOrg.id, role: 'ORG_ADMIN' },
  });

  await prisma.membership.upsert({
    where: { userId_organizationId: { userId: orgUser.id, organizationId: demoOrg.id } },
    update: { role: 'ORG_USER' },
    create: { userId: orgUser.id, organizationId: demoOrg.id, role: 'ORG_USER' },
  });

  const workflows = [
    {
      id: 'wf_001',
      name: 'Captura de Leads WhatsApp',
      description: 'Detecta nuevos mensajes y crea leads en CRM',
      status: 'active' satisfies WorkflowStatus,
      lastRunAt: minutesAgo(5),
      nextRunAt: daysFromNow(0),
      runCount: 1247,
      successRate: 98.5,
      healthStatus: 'healthy' satisfies HealthStatus,
      config: { trigger: 'webhook:whatsapp', actions: ['create_lead', 'send_welcome'] },
    },
    {
      id: 'wf_002',
      name: 'Recordatorio de Citas',
      description: 'Envía recordatorios 24h antes de cada cita',
      status: 'active' satisfies WorkflowStatus,
      lastRunAt: minutesAgo(30),
      nextRunAt: daysFromNow(0),
      runCount: 856,
      successRate: 99.2,
      healthStatus: 'healthy' satisfies HealthStatus,
      config: { trigger: 'schedule:daily', actions: ['check_appointments', 'send_reminders'] },
    },
    {
      id: 'wf_003',
      name: 'Reporte Diario de Ventas',
      description: 'Genera y envía reporte de ventas cada día a las 9am',
      status: 'warning' satisfies WorkflowStatus,
      lastRunAt: minutesAgo(24 * 60),
      nextRunAt: minutesAgo(-15),
      runCount: 45,
      successRate: 87.3,
      healthStatus: 'warning' satisfies HealthStatus,
      config: { trigger: 'schedule:daily:09:00', actions: ['generate_report', 'send_email'] },
    },
    {
      id: 'wf_004',
      name: 'Recuperación de Carrito',
      description: 'Reactiva clientes con carritos abandonados',
      status: 'paused' satisfies WorkflowStatus,
      lastRunAt: minutesAgo(7 * 24 * 60),
      nextRunAt: null,
      runCount: 234,
      successRate: 92.1,
      healthStatus: 'healthy' satisfies HealthStatus,
      config: { trigger: 'event:cart_abandoned', actions: ['send_recovery_email', 'whatsapp_followup'] },
    },
    {
      id: 'wf_005',
      name: 'Sincronización de Inventario',
      description: 'Sincroniza stock entre Shopify y sistema interno',
      status: 'error' satisfies WorkflowStatus,
      lastRunAt: minutesAgo(120),
      nextRunAt: null,
      runCount: 567,
      successRate: 45.2,
      healthStatus: 'error' satisfies HealthStatus,
      config: { trigger: 'webhook:shopify', actions: ['sync_inventory', 'update_stock'] },
    },
  ];

  for (const wf of workflows) {
    await prisma.workflow.upsert({
      where: { id: wf.id },
      update: { ...wf, organizationId: demoOrg.id },
      create: { ...wf, organizationId: demoOrg.id },
    });
  }

  const task1 = await prisma.task.upsert({
    where: { id: 'task_001' },
    update: {
      organizationId: demoOrg.id,
      name: 'Generar Reporte Semanal',
      description: 'Compila métricas de ventas, leads y conversaciones',
      schedule: '0 9 * * 1',
      isPaused: false,
      requiresApproval: false,
    },
    create: {
      id: 'task_001',
      organizationId: demoOrg.id,
      name: 'Generar Reporte Semanal',
      description: 'Compila métricas de ventas, leads y conversaciones',
      schedule: '0 9 * * 1',
      isPaused: false,
      requiresApproval: false,
    },
  });

  const task2 = await prisma.task.upsert({
    where: { id: 'task_002' },
    update: {
      organizationId: demoOrg.id,
      name: 'Backup de Base de Datos',
      description: 'Realiza backup completo y lo sube a S3',
      schedule: '0 2 * * *',
      isPaused: false,
      requiresApproval: false,
    },
    create: {
      id: 'task_002',
      organizationId: demoOrg.id,
      name: 'Backup de Base de Datos',
      description: 'Realiza backup completo y lo sube a S3',
      schedule: '0 2 * * *',
      isPaused: false,
      requiresApproval: false,
    },
  });

  const task3 = await prisma.task.upsert({
    where: { id: 'task_003' },
    update: {
      organizationId: demoOrg.id,
      name: 'Procesar Facturas Pendientes',
      description: 'Extrae datos de facturas y las registra en contabilidad',
      schedule: '0 */6 * * *',
      isPaused: false,
      requiresApproval: true,
    },
    create: {
      id: 'task_003',
      organizationId: demoOrg.id,
      name: 'Procesar Facturas Pendientes',
      description: 'Extrae datos de facturas y las registra en contabilidad',
      schedule: '0 */6 * * *',
      isPaused: false,
      requiresApproval: true,
    },
  });

  // Historical run for task1
  const run1 = await prisma.taskRun.upsert({
    where: { id: 'run_001' },
    update: {
      organizationId: demoOrg.id,
      taskId: task1.id,
      requestedByUserId: orgAdmin.id,
      status: 'completed',
      startedAt: minutesAgo(7 * 24 * 60),
      completedAt: minutesAgo(7 * 24 * 60 - 5),
      progress: 100,
      evidence: {
        screenshots: ['/evidence/report_001.png'],
        logs: ['Reporte generado exitosamente', 'Email enviado a 3 destinatarios'],
      },
    },
    create: {
      id: 'run_001',
      organizationId: demoOrg.id,
      taskId: task1.id,
      requestedByUserId: orgAdmin.id,
      status: 'completed',
      startedAt: minutesAgo(7 * 24 * 60),
      completedAt: minutesAgo(7 * 24 * 60 - 5),
      progress: 100,
      evidence: {
        screenshots: ['/evidence/report_001.png'],
        logs: ['Reporte generado exitosamente', 'Email enviado a 3 destinatarios'],
      },
    },
  });

  const stepsRun1 = [
    { id: 'step_001_1', name: 'Recolectar datos', status: 'completed' as const, progress: 100 },
    { id: 'step_001_2', name: 'Generar gráficos', status: 'completed' as const, progress: 100 },
    { id: 'step_001_3', name: 'Enviar email', status: 'completed' as const, progress: 100 },
  ];
  for (const s of stepsRun1) {
    await prisma.taskStep.upsert({
      where: { id: s.id },
      update: { organizationId: demoOrg.id, taskRunId: run1.id, name: s.name, status: s.status, progress: s.progress },
      create: { id: s.id, organizationId: demoOrg.id, taskRunId: run1.id, name: s.name, status: s.status, progress: s.progress },
    });
  }

  // Running run for task2
  const run2 = await prisma.taskRun.upsert({
    where: { id: 'run_002' },
    update: {
      organizationId: demoOrg.id,
      taskId: task2.id,
      requestedByUserId: orgAdmin.id,
      status: 'running',
      startedAt: minutesAgo(5),
      progress: 65,
    },
    create: {
      id: 'run_002',
      organizationId: demoOrg.id,
      taskId: task2.id,
      requestedByUserId: orgAdmin.id,
      status: 'running',
      startedAt: minutesAgo(5),
      progress: 65,
    },
  });

  const stepsRun2 = [
    { id: 'step_002_1', name: 'Exportar datos', status: 'completed' as const, progress: 100 },
    { id: 'step_002_2', name: 'Comprimir archivo', status: 'completed' as const, progress: 100 },
    { id: 'step_002_3', name: 'Subir a S3', status: 'running' as const, progress: 30 },
  ];
  for (const s of stepsRun2) {
    await prisma.taskStep.upsert({
      where: { id: s.id },
      update: { organizationId: demoOrg.id, taskRunId: run2.id, name: s.name, status: s.status, progress: s.progress },
      create: { id: s.id, organizationId: demoOrg.id, taskRunId: run2.id, name: s.name, status: s.status, progress: s.progress },
    });
  }

  // Integrations (include Meta compliance placeholders)
  const integrations = [
    {
      id: 'int_001',
      name: 'WhatsApp Business',
      provider: 'Meta',
      status: 'connected' satisfies IntegrationStatus,
      lastSyncAt: minutesAgo(2),
      healthStatus: 'healthy' satisfies HealthStatus,
      config: {
        features: ['messages', 'templates', 'webhooks'],
        appIconUrl: null,
        privacyPolicyUrl: null,
        userDataDeletionUrl: null,
        category: null,
      },
      credentials: { hasCredentials: true, expiresAt: daysFromNow(90).toISOString() },
    },
    {
      id: 'int_002',
      name: 'Google Calendar',
      provider: 'Google',
      status: 'connected' satisfies IntegrationStatus,
      lastSyncAt: minutesAgo(15),
      healthStatus: 'healthy' satisfies HealthStatus,
      config: { features: ['events', 'availability', 'reminders'] },
      credentials: { hasCredentials: true, expiresAt: daysFromNow(180).toISOString() },
    },
    {
      id: 'int_003',
      name: 'Shopify',
      provider: 'Shopify',
      status: 'error' satisfies IntegrationStatus,
      lastSyncAt: minutesAgo(4 * 60),
      healthStatus: 'error' satisfies HealthStatus,
      config: { endpoint: 'https://tienda-demo.myshopify.com', features: ['products', 'orders', 'customers'] },
      credentials: { hasCredentials: true },
    },
    {
      id: 'int_004',
      name: 'Stripe',
      provider: 'Stripe',
      status: 'connected' satisfies IntegrationStatus,
      lastSyncAt: minutesAgo(60),
      healthStatus: 'healthy' satisfies HealthStatus,
      config: { features: ['payments', 'subscriptions', 'webhooks'] },
      credentials: { hasCredentials: true },
      estimatedCost: 250,
    },
    {
      id: 'int_005',
      name: 'OpenAI',
      provider: 'OpenAI',
      status: 'syncing' satisfies IntegrationStatus,
      lastSyncAt: minutesAgo(5),
      healthStatus: 'warning' satisfies HealthStatus,
      config: { features: ['gpt-4', 'embeddings', 'fine-tuning'] },
      credentials: { hasCredentials: true },
      estimatedCost: 450,
    },
  ];

  for (const i of integrations) {
    await prisma.integration.upsert({
      where: { id: i.id },
      update: { ...i, organizationId: demoOrg.id },
      create: { ...i, organizationId: demoOrg.id },
    });
  }

  const approval1 = await prisma.approval.upsert({
    where: { id: 'app_001' },
    update: {
      organizationId: demoOrg.id,
      type: 'task_run',
      title: 'Ejecutar: Procesar Facturas Pendientes',
      description: 'Se requiere aprobación para procesar 23 facturas pendientes',
      status: 'pending' satisfies ApprovalStatus,
      requestedByUserId: null,
      metadata: { taskId: task3.id, estimatedAmount: 45000 },
    },
    create: {
      id: 'app_001',
      organizationId: demoOrg.id,
      type: 'task_run',
      title: 'Ejecutar: Procesar Facturas Pendientes',
      description: 'Se requiere aprobación para procesar 23 facturas pendientes',
      status: 'pending' satisfies ApprovalStatus,
      requestedByUserId: null,
      metadata: { taskId: task3.id, estimatedAmount: 45000 },
    },
  });

  await prisma.approval.upsert({
    where: { id: 'app_002' },
    update: {
      organizationId: demoOrg.id,
      type: 'integration_connect',
      title: 'Conectar: Salesforce CRM',
      description: 'Solicitud para conectar integración con Salesforce',
      status: 'approved' satisfies ApprovalStatus,
      requestedByUserId: orgAdmin.id,
      decidedByUserId: orgAdmin.id,
      decidedAt: minutesAgo(60),
    },
    create: {
      id: 'app_002',
      organizationId: demoOrg.id,
      type: 'integration_connect',
      title: 'Conectar: Salesforce CRM',
      description: 'Solicitud para conectar integración con Salesforce',
      status: 'approved' satisfies ApprovalStatus,
      requestedByUserId: orgAdmin.id,
      decidedByUserId: orgAdmin.id,
      decidedAt: minutesAgo(60),
    },
  });

  const events = [
    {
      id: 'evt_001',
      type: 'automation' as const,
      title: 'Captura de Leads WhatsApp',
      description: 'Procesó 12 mensajes nuevos, creó 8 leads',
      status: 'success' as const,
      createdAt: minutesAgo(5),
    },
    {
      id: 'evt_002',
      type: 'alert' as const,
      title: 'Error en sincronización Shopify',
      description: 'No se pudo conectar con la API de Shopify',
      status: 'error' as const,
      createdAt: minutesAgo(30),
    },
    {
      id: 'evt_003',
      type: 'task' as const,
      title: 'Backup de Base de Datos',
      description: 'Backup completado: 2.3GB subidos a S3',
      status: 'success' as const,
      createdAt: minutesAgo(60),
    },
    {
      id: 'evt_004',
      type: 'approval' as const,
      title: 'Aprobación requerida',
      description: 'Procesar Facturas Pendientes espera aprobación',
      status: 'pending' as const,
      createdAt: minutesAgo(30),
      metadata: { approvalId: approval1.id },
    },
  ];

  for (const e of events) {
    await prisma.event.upsert({
      where: { id: e.id },
      update: { organizationId: demoOrg.id, actorUserId: null, ...e },
      create: { organizationId: demoOrg.id, actorUserId: null, ...e },
    });
  }

  const auditLogs = [
    { id: 'log_001', actorUserId: superAdmin.id, action: 'LOGIN', resource: 'Sistema', ip: '192.168.1.100', severity: 'low', createdAt: minutesAgo(5) },
    { id: 'log_002', actorUserId: orgAdmin.id, action: 'AUTOMATION_RUN', resource: 'Captura de Leads', ip: '192.168.1.101', severity: 'low', createdAt: minutesAgo(15) },
    { id: 'log_003', actorUserId: null, action: 'INTEGRATION_ERROR', resource: 'Shopify', ip: 'internal', severity: 'high', createdAt: minutesAgo(30) },
    { id: 'log_004', actorUserId: superAdmin.id, action: 'USER_CREATED', resource: 'Usuario', ip: '192.168.1.100', severity: 'medium', createdAt: minutesAgo(2 * 60) },
    { id: 'log_005', actorUserId: orgUser.id, action: 'TASK_APPROVAL', resource: 'Procesar Facturas', ip: '192.168.1.102', severity: 'medium', createdAt: minutesAgo(4 * 60) },
  ];

  for (const l of auditLogs) {
    await prisma.auditLog.upsert({
      where: { id: l.id },
      update: {
        organizationId: demoOrg.id,
        actorUserId: l.actorUserId,
        action: l.action,
        resource: l.resource,
        resourceId: null,
        ip: l.ip,
        userAgent: 'seed',
        severity: l.severity,
        createdAt: l.createdAt,
      },
      create: {
        id: l.id,
        organizationId: demoOrg.id,
        actorUserId: l.actorUserId,
        action: l.action,
        resource: l.resource,
        resourceId: null,
        ip: l.ip,
        userAgent: 'seed',
        severity: l.severity,
        createdAt: l.createdAt,
      },
    });
  }

  console.log('Seed completo ✅');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
