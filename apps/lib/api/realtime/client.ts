import { getAccessTokenProvider } from "@/lib/api/auth";
import { assertPublicRealtimeUrl, getRealtimeUrl } from "@/lib/api/config";
import { ApiError } from "@/lib/api/errors";
import { normalizeRealtimeEvent, type RealtimeEvent, type RealtimeWireEvent } from "@/lib/api/realtime/events";
import { getReconnectDelay } from "@/lib/api/realtime/reconnect";
import type { RealtimeSubscription } from "@/lib/api/realtime/subscriptions";

type Listener = (event: RealtimeEvent) => void;
type ConnectionListener = (connected: boolean) => void;

export interface RealtimeClientOptions {
  url?: string;
}

export class RealtimeClient {
  private socket: WebSocket | null = null;
  private listeners = new Set<Listener>();
  private connectionListeners = new Set<ConnectionListener>();
  private _isConnected = false;
  private reconnectAttempt = 0;
  private reconnectTimer: number | null = null;
  private intentionalClose = false;
  private seenEventIds = new Set<string>();
  private activeWorkspaceId: string | null = null;
  private readonly url: string;

  get isConnected(): boolean {
    return this._isConnected;
  }

  onConnectionChange(listener: ConnectionListener): () => void {
    this.connectionListeners.add(listener);
    return () => this.connectionListeners.delete(listener);
  }

  private setConnected(connected: boolean): void {
    if (this._isConnected === connected) return;
    this._isConnected = connected;
    this.connectionListeners.forEach((fn) => fn(connected));
  }

  constructor(options: RealtimeClientOptions = {}) {
    this.url = assertPublicRealtimeUrl(options.url ?? getRealtimeUrl());
  }

  subscribe(listener: Listener): RealtimeSubscription {
    this.listeners.add(listener);

    return {
      unsubscribe: () => {
        this.listeners.delete(listener);
      },
    };
  }

  async connect(): Promise<void> {
    if (typeof window === "undefined" || this.socket) {
      return;
    }

    const token = await getAccessTokenProvider().getAccessToken();
    if (!token) {
      return;
    }

    this.intentionalClose = false;
    this.socket = new WebSocket(this.url, ["bearer", token]);

    this.socket.addEventListener("open", () => {
      this.reconnectAttempt = 0;
      this.setConnected(true);
      if (this.activeWorkspaceId) {
        this.send({
          type: "subscribe",
          workspaceId: this.activeWorkspaceId,
        });
      }
    });

    this.socket.addEventListener("message", (message) => {
      const parsed = JSON.parse(message.data) as RealtimeWireEvent;
      if (this.seenEventIds.has(parsed.id)) {
        return;
      }

      this.seenEventIds.add(parsed.id);
      if (this.seenEventIds.size > 500) {
        const [first] = this.seenEventIds;
        if (first) {
          this.seenEventIds.delete(first);
        }
      }

      const event = normalizeRealtimeEvent(parsed);
      if (this.activeWorkspaceId && event.workspaceId && event.workspaceId !== this.activeWorkspaceId) {
        return;
      }

      this.listeners.forEach((listener) => {
        listener(event);
      });
    });

    this.socket.addEventListener("close", () => {
      this.socket = null;
      this.setConnected(false);
      if (!this.intentionalClose) {
        this.scheduleReconnect();
      }
    });

    this.socket.addEventListener("error", () => {
      this.setConnected(false);
      if (!this.intentionalClose) {
        this.scheduleReconnect();
      }
    });
  }

  disconnect(): void {
    this.intentionalClose = true;
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.socket?.close();
    this.socket = null;
    this.setConnected(false);
  }

  setWorkspace(workspaceId: string | null): void {
    this.activeWorkspaceId = workspaceId;
    if (workspaceId) {
      this.send({
        type: "subscribe",
        workspaceId,
      });
    }
  }

  private scheduleReconnect(): void {
    if (typeof window === "undefined" || this.reconnectTimer !== null) {
      return;
    }

    const delay = getReconnectDelay(this.reconnectAttempt++);
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      void this.connect();
    }, delay);
  }

  send(payload: Record<string, unknown>): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    this.socket.send(JSON.stringify(payload));
  }
}

let sharedRealtimeClient: RealtimeClient | null = null;

export function getSharedRealtimeClient(): RealtimeClient {
  if (!sharedRealtimeClient) {
    sharedRealtimeClient = new RealtimeClient();
  }

  return sharedRealtimeClient;
}

export function ensureRealtimeBrowserSupport(): void {
  if (typeof window === "undefined" || typeof WebSocket === "undefined") {
    throw new ApiError({
      status: 500,
      message: "WebSocket is not available in this environment.",
      kind: "internal_error",
    });
  }
}
