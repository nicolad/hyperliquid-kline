import { useEffect, useRef, useCallback, useState } from "react";

export type HyperliquidNetwork = "mainnet" | "testnet";

export interface HLSubscription {
  [key: string]: any;
}

export interface HLMessageEnvelope<T = any> {
  channel: string;
  data: T;
}

export interface UseHyperliquidWsOptions<T = any> {
  network?: HyperliquidNetwork;
  urlOverride?: string;
  subscriptions: HLSubscription[];
  onMessage?: (msg: HLMessageEnvelope) => void;
  onOpen?: (ws: WebSocket) => void;
  onError?: (ev: Event) => void;
  onClose?: (ev: CloseEvent) => void;
  reconnect?: boolean;
  reconnectDelayMs?: number;
  maxReconnectAttempts?: number;
}

function deriveUrl(network: HyperliquidNetwork): string {
  return network === "testnet"
    ? "wss://api.hyperliquid-testnet.xyz/ws"
    : "wss://api.hyperliquid.xyz/ws";
}

export function useHyperliquidWs({
  network = (process.env.NEXT_PUBLIC_HL_NETWORK as HyperliquidNetwork) ||
    "mainnet",
  urlOverride = process.env.NEXT_PUBLIC_HL_WS_URL,
  subscriptions,
  onMessage,
  onOpen,
  onError,
  onClose,
  reconnect = true,
  reconnectDelayMs = 3000,
  maxReconnectAttempts = 10,
}: UseHyperliquidWsOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const attemptsRef = useRef(0);
  const [isConnected, setIsConnected] = useState(false);

  const targetUrl = urlOverride || deriveUrl(network);

  const setupWebSocket = useCallback(() => {
    const ws = new WebSocket(targetUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      attemptsRef.current = 0;
      setIsConnected(true);
      subscriptions.forEach((sub) => {
        const payload = { method: "subscribe", subscription: sub };
        ws.send(JSON.stringify(payload));
      });
      onOpen && onOpen(ws);
    };

    ws.onmessage = (ev) => {
      try {
        const parsed = JSON.parse(ev.data) as HLMessageEnvelope;
        onMessage && onMessage(parsed);
      } catch (e) {
        onMessage && onMessage({ channel: "raw", data: ev.data });
      }
    };

    ws.onerror = (ev) => {
      onError && onError(ev);
    };

    ws.onclose = (ev) => {
      setIsConnected(false);
      onClose && onClose(ev);
      if (reconnect && attemptsRef.current < maxReconnectAttempts) {
        attemptsRef.current += 1;
        setTimeout(() => {
          setupWebSocket();
        }, reconnectDelayMs);
      }
    };
  }, [
    targetUrl,
    subscriptions,
    onOpen,
    onMessage,
    onError,
    onClose,
    reconnect,
    reconnectDelayMs,
    maxReconnectAttempts,
  ]);

  useEffect(() => {
    if (!subscriptions || subscriptions.length === 0) return;
    setupWebSocket();
    return () => {
      setIsConnected(false);
      wsRef.current?.close();
    };
  }, [setupWebSocket, subscriptions]);

  return {
    websocket: wsRef.current,
    isConnected,
  };
}

export default useHyperliquidWs;
