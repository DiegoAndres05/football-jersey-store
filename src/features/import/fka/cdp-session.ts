export type CdpResponse = {
  id?: number;
  method?: string;
  sessionId?: string;
  params?: Record<string, unknown>;
  result?: {
    targetId?: string;
    sessionId?: string;
    targetInfos?: { targetId: string; type: string }[];
    result?: { value?: unknown; subtype?: string; description?: string };
    exceptionDetails?: { text?: string };
  };
  error?: { message?: string };
};

export class CdpSession {
  private ws: WebSocket;
  private seq = 0;
  private pending = new Map<number, (msg: CdpResponse) => void>();
  private eventWaiters: { method: string; resolve: (msg: CdpResponse) => void }[] = [];

  constructor(ws: WebSocket) {
    this.ws = ws;
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(String(event.data)) as CdpResponse;
      if (msg.id && this.pending.has(msg.id)) {
        this.pending.get(msg.id)!(msg);
        this.pending.delete(msg.id);
        return;
      }
      if (msg.method) {
        const index = this.eventWaiters.findIndex((waiter) => waiter.method === msg.method);
        if (index >= 0) {
          const [waiter] = this.eventWaiters.splice(index, 1);
          waiter.resolve(msg);
        }
      }
    };
  }

  waitForEvent(method: string, timeoutMs = 15000): Promise<CdpResponse> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.eventWaiters = this.eventWaiters.filter((waiter) => waiter.resolve !== resolve);
        reject(new Error(`CDP event timeout: ${method}`));
      }, timeoutMs);
      this.eventWaiters.push({
        method,
        resolve: (msg) => {
          clearTimeout(timer);
          resolve(msg);
        },
      });
    });
  }

  send(method: string, params: Record<string, unknown> = {}, sessionId?: string | null): Promise<CdpResponse> {
    const id = ++this.seq;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (this.pending.delete(id)) reject(new Error(`CDP timeout: ${method}`));
      }, 30000);
      this.pending.set(id, (msg) => {
        clearTimeout(timer);
        if (msg.error) reject(new Error(msg.error.message ?? "CDP error"));
        else resolve(msg);
      });
      const payload: Record<string, unknown> = { id, method, params };
      if (sessionId) payload.sessionId = sessionId;
      this.ws.send(JSON.stringify(payload));
    });
  }

  async evaluate<T>(expression: string, awaitPromise = false, sessionId?: string | null): Promise<T> {
    const res = await this.send(
      "Runtime.evaluate",
      {
        expression,
        returnByValue: true,
        awaitPromise,
      },
      sessionId,
    );
    const exception = res.result?.exceptionDetails?.text ?? res.result?.result?.description;
    if (res.result?.result?.subtype === "error" || res.result?.exceptionDetails) {
      throw new Error(exception ?? "CDP evaluate error");
    }
    return (res.result?.result?.value ?? null) as T;
  }

  close() {
    try {
      this.ws.close();
    } catch {
      /* noop */
    }
  }
}

export async function openCdpWebSocket(url: string): Promise<WebSocket> {
  if (typeof WebSocket === "undefined") {
    throw new Error("WebSocket no está disponible en este runtime. No se puede usar CDP.");
  }
  const ws = new WebSocket(url);
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timeout al abrir el WebSocket CDP.")), 20000);
    ws.onopen = () => {
      clearTimeout(timer);
      resolve();
    };
    ws.onerror = () => {
      clearTimeout(timer);
      reject(new Error("No se pudo conectar con el navegador FKA/CDP (WebSocket)."));
    };
  });
  return ws;
}
