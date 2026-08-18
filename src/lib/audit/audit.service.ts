export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  resource: string;
  resourceId: string;
  changes?: Record<string, { before: unknown; after: unknown }>;
  ipAddress?: string;
  timestamp: string;
}

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: "log-1",
    actorId: "usr_admin_01",
    actorName: "Shakhwat Hossain",
    action: "HOMEPAGE_PUBLISHED",
    resource: "homepage_cms",
    resourceId: "v2",
    changes: { status: { before: "DRAFT", after: "PUBLISHED" } },
    timestamp: "2026-08-18T19:50:00Z",
  },
  {
    id: "log-2",
    actorId: "usr_admin_01",
    actorName: "Shakhwat Hossain",
    action: "PRODUCT_PRICE_UPDATED",
    resource: "products",
    resourceId: "prod-1",
    changes: { price: { before: 5800, after: 6960 } },
    timestamp: "2026-08-18T18:30:00Z",
  },
  {
    id: "log-3",
    actorId: "usr_admin_01",
    actorName: "Shakhwat Hossain",
    action: "INVENTORY_ADJUSTED",
    resource: "inventory",
    resourceId: "RR-JKT-003-L",
    changes: { quantity: { before: 5, after: 2 } },
    timestamp: "2026-08-18T17:15:00Z",
  },
  {
    id: "log-4",
    actorId: "usr_admin_01",
    actorName: "Shakhwat Hossain",
    action: "MEDIA_UPLOADED",
    resource: "media",
    resourceId: "med-1",
    changes: { filename: { before: null, after: "autumn-hero-fashion-model-35mm.webp" } },
    timestamp: "2026-08-18T16:00:00Z",
  },
];

let auditLogs: AuditLogEntry[] = [...INITIAL_AUDIT_LOGS];

export class AuditService {
  public static async recordLog(entry: Omit<AuditLogEntry, "id" | "timestamp">): Promise<AuditLogEntry> {
    const log: AuditLogEntry = {
      ...entry,
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    auditLogs = [log, ...auditLogs];
    return log;
  }

  public static async getLogs(): Promise<AuditLogEntry[]> {
    return auditLogs;
  }
}
