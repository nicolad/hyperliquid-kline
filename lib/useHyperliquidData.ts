import { useState, useEffect, useCallback } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import type { KLineData } from "klinecharts";
import {
  convertHyperliquidCandlesToKLine,
  updateCandleWithTrade,
} from "./dataConverter";
import { fetchHyperliquidCandles } from "./fetchCandles";

interface HLMessageEnvelope {
  channel: string;
  data: any;
}

export interface CoinData {
  symbol: string;
  candleData: KLineData[];
  currentCandle: KLineData | null;
}

interface UseHyperliquidDataOptions {
  coins: string[];
  interval: string;
  wsUrl?: string;
}

export function useHyperliquidData({
  coins,
  interval,
  wsUrl = "wss://api.hyperliquid.xyz/ws",
}: UseHyperliquidDataOptions) {
  const [coinsData, setCoinsData] = useState<{ [key: string]: CoinData }>(
    coins.reduce((acc, coin) => {
      acc[coin] = { symbol: coin, candleData: [], currentCandle: null };
      return acc;
    }, {} as { [key: string]: CoinData })
  );
  const [error, setError] = useState<Error | null>(null);

  console.log("🔌 [WS] Initializing WebSocket connection to:", wsUrl);

  // Fetch initial historical data
  useEffect(() => {
    console.log(
      "🔄 [INIT] Starting initial data fetch for coins:",
      coins,
      "interval:",
      interval
    );
    const fetchInitialData = async () => {
      const endTime = Date.now();
      const startTime = endTime - 24 * 60 * 60 * 1000;

      for (const coin of coins) {
        try {
          console.log(`📥 [FETCH] Fetching candles for ${coin}...`);
          const candles = await fetchHyperliquidCandles(
            coin,
            interval,
            startTime,
            endTime
          );

          console.log(
            `✅ [FETCH] Received ${candles.length} candles for ${coin}`
          );
          if (candles.length > 0) {
            const convertedCandles = convertHyperliquidCandlesToKLine(candles);
            console.log(
              `🔄 [CONVERT] Converted ${convertedCandles.length} candles for ${coin}`
            );
            setCoinsData((prev) => ({
              ...prev,
              [coin]: {
                ...prev[coin],
                candleData: convertedCandles,
                currentCandle:
                  convertedCandles.length > 0
                    ? convertedCandles[convertedCandles.length - 1]
                    : null,
              },
            }));
          } else {
            console.warn(`⚠️ [FETCH] No candles received for ${coin}`);
          }
        } catch (error) {
          console.error(
            `❌ [ERROR] Error fetching candles for ${coin}:`,
            error
          );
          setError(error as Error);
        }
      }
    };

    fetchInitialData();
  }, [coins, interval]);

  // Handle incoming WebSocket messages
  const handleDataMessage = useCallback(
    (envelope: HLMessageEnvelope) => {
      try {
        console.log(
          "📨 [WS MESSAGE] Received:",
          JSON.stringify(envelope).substring(0, 200)
        );

        if (envelope.channel === "subscriptionResponse") {
          console.log("✅ [WS] Subscription response:", envelope.data);
          return;
        }

        let coin: string | undefined;

        if (envelope.channel === "candle" && envelope.data) {
          coin = envelope.data.s;
        } else if (
          envelope.channel === "trades" &&
          Array.isArray(envelope.data) &&
          envelope.data.length > 0
        ) {
          coin = envelope.data[0]?.coin;
        }

        if (!coin) {
          console.warn(
            "⚠️ [WS] Could not extract coin from message:",
            envelope.channel
          );
          return;
        }

        if (!coins.includes(coin)) {
          console.log(
            `⏭️ [WS] Skipping message for ${coin} (not in tracked coins)`
          );
          return;
        }

        console.log(
          `🎯 [WS] Processing ${envelope.channel} message for ${coin}`
        );

        if (envelope.channel === "candle") {
          const candleData = envelope.data;

          let candles = [];
          if (Array.isArray(candleData)) {
            candles = candleData;
          } else if (candleData.candles && Array.isArray(candleData.candles)) {
            candles = candleData.candles;
          } else if (candleData.t) {
            candles = [candleData];
          } else {
            console.warn("⚠️ [WS] Unexpected candle data format:", candleData);
            return;
          }

          if (candles.length > 0) {
            const convertedCandles = convertHyperliquidCandlesToKLine(candles);

            setCoinsData((prev) => {
              const existingData = prev[coin]?.candleData || [];
              const newCandle = convertedCandles[0];

              if (existingData.length > 0) {
                const lastCandle = existingData[existingData.length - 1];

                if (lastCandle.timestamp === newCandle.timestamp) {
                  const updatedData = [...existingData];
                  updatedData[updatedData.length - 1] = newCandle;

                  return {
                    ...prev,
                    [coin]: {
                      ...prev[coin],
                      candleData: updatedData,
                      currentCandle: newCandle,
                    },
                  };
                } else {
                  const updatedData = [...existingData, newCandle];

                  return {
                    ...prev,
                    [coin]: {
                      ...prev[coin],
                      candleData: updatedData,
                      currentCandle: newCandle,
                    },
                  };
                }
              } else {
                return {
                  ...prev,
                  [coin]: {
                    ...prev[coin],
                    candleData: convertedCandles,
                    currentCandle: newCandle,
                  },
                };
              }
            });
          }
        }

        if (envelope.channel === "trades") {
          const trades = envelope.data;
          if (Array.isArray(trades)) {
            setCoinsData((prev) => {
              const currentCandle = prev[coin]?.currentCandle;
              if (!currentCandle) return prev;

              let updatedCandle = currentCandle;
              trades.forEach((trade: any) => {
                const price = parseFloat(trade.px);
                const volume = parseFloat(trade.sz);
                updatedCandle = updateCandleWithTrade(
                  updatedCandle,
                  price,
                  volume
                );
              });

              const newCandleData = [...prev[coin].candleData];
              if (newCandleData.length > 0) {
                newCandleData[newCandleData.length - 1] = updatedCandle;
              }

              return {
                ...prev,
                [coin]: {
                  ...prev[coin],
                  candleData: newCandleData,
                  currentCandle: updatedCandle,
                },
              };
            });
          }
        }
      } catch (error) {
        console.error("❌ [WS MESSAGE] Error processing message:", error);
        console.error(
          "📋 [WS MESSAGE] Message envelope:",
          JSON.stringify(envelope, null, 2)
        );
        setError(error instanceof Error ? error : new Error(String(error)));
      }
    },
    [coins]
  );

  // WebSocket connection
  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(wsUrl, {
    share: false,
    shouldReconnect: (closeEvent) => {
      console.log("🔄 [WS] Attempting to reconnect...");
      console.log("🔄 [WS] Close event code:", closeEvent?.code);
      return true;
    },
    reconnectAttempts: 10,
    reconnectInterval: (attemptNumber) => {
      const delay = Math.min(1000 * Math.pow(2, attemptNumber), 10000);
      console.log(
        `⏳ [WS] Reconnect attempt ${attemptNumber}, waiting ${delay}ms`
      );
      return delay;
    },
    onOpen: (event) => {
      console.log("✅ [WS] Hyperliquid WebSocket connected successfully");
      console.log("🔗 [WS] Connection URL:", wsUrl);
      console.log("🔗 [WS] Ready state:", ReadyState.OPEN);
    },
    onClose: (event) => {
      console.log("🔌 [WS] Hyperliquid WebSocket disconnected");
      console.log("📊 [WS] Close code:", event.code);
      console.log(
        "📊 [WS] Close reason:",
        event.reason || "No reason provided"
      );
      console.log("📊 [WS] Was clean close:", event.wasClean);
    },
    onError: (event) => {
      console.error("❌ [WS ERROR] WebSocket connection error occurred");
      console.error("🔍 [WS ERROR] Error event:", event);
      console.error("🔍 [WS ERROR] WebSocket URL:", wsUrl);
      console.error("🔍 [WS ERROR] Current ready state:", readyState);

      // Try to get more information from the event
      if (event.target) {
        const ws = event.target as WebSocket;
        console.error("🔍 [WS ERROR] WebSocket ready state:", ws.readyState);
        console.error("🔍 [WS ERROR] WebSocket URL from target:", ws.url);
      }

      // Log possible causes
      console.error("💡 [WS ERROR] Possible causes:");
      console.error("  - Network connectivity issues");
      console.error("  - CORS or security policy blocking the connection");
      console.error("  - Server is down or unreachable");
      console.error("  - Invalid WebSocket URL");
      console.error("  - Firewall or proxy blocking WebSocket connections");
    },
    onMessage: (event) => {
      console.log(
        "📬 [WS] Raw message received:",
        event.data.substring(0, 150)
      );
    },
  });

  // Send subscriptions when connected
  useEffect(() => {
    if (readyState === ReadyState.OPEN) {
      console.log("🚀 [WS] WebSocket is OPEN, sending subscriptions");
      console.log("🎯 [WS] Coins to subscribe:", coins);
      console.log("⏱️ [WS] Interval:", interval);

      coins.forEach((coin) => {
        const candleSubscription = {
          method: "subscribe",
          subscription: {
            type: "candle",
            coin: coin,
            interval: interval,
          },
        };
        console.log(
          `📤 [WS] Subscribing to candles for ${coin}:`,
          candleSubscription
        );
        sendJsonMessage(candleSubscription);

        const tradesSubscription = {
          method: "subscribe",
          subscription: {
            type: "trades",
            coin: coin,
          },
        };
        console.log(
          `📤 [WS] Subscribing to trades for ${coin}:`,
          tradesSubscription
        );
        sendJsonMessage(tradesSubscription);
      });
    } else {
      const stateNames: Record<number, string> = {
        [ReadyState.CONNECTING]: "CONNECTING",
        [ReadyState.OPEN]: "OPEN",
        [ReadyState.CLOSING]: "CLOSING",
        [ReadyState.CLOSED]: "CLOSED",
      };
      console.log(
        `⏸️ [WS] WebSocket not ready. Current state: ${
          stateNames[readyState] || "UNKNOWN"
        } (${readyState})`
      );
    }
  }, [readyState, interval, coins, sendJsonMessage]);

  // Handle incoming messages
  useEffect(() => {
    if (lastJsonMessage) {
      handleDataMessage(lastJsonMessage as HLMessageEnvelope);
    }
  }, [lastJsonMessage, handleDataMessage]);

  // Track readyState changes for debugging
  useEffect(() => {
    const stateNames: Record<number, string> = {
      [ReadyState.CONNECTING]: "CONNECTING",
      [ReadyState.OPEN]: "OPEN",
      [ReadyState.CLOSING]: "CLOSING",
      [ReadyState.CLOSED]: "CLOSED",
    };
    console.log(
      `🔄 [WS STATE] Connection state changed to: ${
        stateNames[readyState] || "UNKNOWN"
      } (${readyState})`
    );
  }, [readyState]);

  return {
    coinsData,
    isConnected: readyState === ReadyState.OPEN,
    readyState,
  };
}
