import type { Response } from 'express';

type Client = {
  id: string;
  orgId: string;
  res: Response;
};

const clients = new Map<string, Client>();

export function sseAddClient(client: Client) {
  clients.set(client.id, client);
}

export function sseRemoveClient(id: string) {
  clients.delete(id);
}

export function sseBroadcast(orgId: string, event: { type: string; payload: unknown }) {
  const data = JSON.stringify(event.payload);
  for (const c of clients.values()) {
    if (c.orgId !== orgId) continue;
    c.res.write(`event: ${event.type}\n`);
    c.res.write(`data: ${data}\n\n`);
  }
}

export function ssePing() {
  for (const c of clients.values()) {
    c.res.write(`event: ping\n`);
    c.res.write(`data: {}\n\n`);
  }
}

