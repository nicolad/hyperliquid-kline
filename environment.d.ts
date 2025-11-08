declare namespace NodeJS {
  export interface ProcessEnv {
    // Hyperliquid WebSocket network selector: "mainnet" (default) | "testnet"
    readonly NEXT_PUBLIC_HL_NETWORK?: string;
    // Override WebSocket URL directly (optional). If unset, it derives from NEXT_PUBLIC_HL_NETWORK.
    readonly NEXT_PUBLIC_HL_WS_URL?: string;
    // (Legacy MQTT vars retained only if you still use the old MQTT hook.)
    readonly NEXT_PUBLIC_MQTT_URI?: string;
    readonly NEXT_PUBLIC_MQTT_USERNAME?: string;
    readonly NEXT_PUBLIC_MQTT_PASSWORD?: string;
    readonly NEXT_PUBLIC_MQTT_CLIENTID?: string;
  }
}
