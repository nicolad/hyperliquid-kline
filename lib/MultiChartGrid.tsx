"use client";

import { useState, useEffect } from "react";
import useHyperliquidWs from "@/lib/hyperliquidWs";
import KLineChartComponent from "@/lib/KLineChartComponent";
import {
  convertHyperliquidCandlesToKLine,
  updateCandleWithTrade,
} from "@/lib/dataConverter";
import { fetchHyperliquidCandles } from "@/lib/fetchCandles";
import type { KLineData } from "klinecharts";

interface CoinData {
  symbol: string;
  candleData: KLineData[];
  currentCandle: KLineData | null;
}

const TOP_COINS = ["BTC", "ETH", "SOL", "AVAX"];

export default function MultiChartGrid() {
  const [selectedInterval, setSelectedInterval] = useState("1m");
  const [coinsData, setCoinsData] = useState<{ [key: string]: CoinData }>(
    TOP_COINS.reduce((acc, coin) => {
      acc[coin] = { symbol: coin, candleData: [], currentCandle: null };
      return acc;
    }, {} as { [key: string]: CoinData })
  );

  useEffect(() => {
    const fetchInitialData = async () => {
      const endTime = Date.now();
      const startTime = endTime - 24 * 60 * 60 * 1000;

      for (const coin of TOP_COINS) {
        try {
          const candles = await fetchHyperliquidCandles(
            coin,
            selectedInterval,
            startTime,
            endTime
          );

          if (candles.length > 0) {
            const convertedCandles = convertHyperliquidCandlesToKLine(candles);
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
          }
        } catch (error) {}
      }
    };

    fetchInitialData();
  }, [selectedInterval]);

  const { isConnected } = useHyperliquidWs({
    subscriptions: TOP_COINS.flatMap((coin) => [
      {
        type: "candle",
        coin: coin,
        interval: selectedInterval,
      },
      {
        type: "trades",
        coin: coin,
      },
    ]),
    onMessage: (envelope) => {
      if (envelope.channel === "subscriptionResponse") {
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

      if (!coin || !TOP_COINS.includes(coin)) {
        return;
      }

      if (envelope.channel === "candle") {
        const candleData = envelope.data;

        let candles = [];
        if (Array.isArray(candleData)) {
          candles = candleData;
        } else if (candleData.candles && Array.isArray(candleData.candles)) {
          candles = candleData.candles;
        } else if (candleData.t) {
          candles = [candleData];
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
    },
  });

  return (
    <div
      style={{
        fontFamily: "sans-serif",
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxSizing: "border-box",
        position: "fixed",
        top: 0,
        left: 0,
      }}
    >
      <div
        style={{
          padding: "0.5rem 1rem",
          display: "flex",
          gap: "1rem",
          alignItems: "center",
          borderBottom: "1px solid #ddd",
          background: "#fafafa",
          flexShrink: 0,
        }}
      >
        <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Live Trading Charts</h1>

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: "1rem",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <div style={{ whiteSpace: "nowrap" }}>
            <label htmlFor="interval-select" style={{ marginRight: "0.5rem" }}>
              Interval:
            </label>
            <select
              id="interval-select"
              value={selectedInterval}
              onChange={(e) => setSelectedInterval(e.target.value)}
              style={{ padding: "0.25rem 0.5rem" }}
            >
              <option value="1m">1m</option>
              <option value="5m">5m</option>
              <option value="15m">15m</option>
              <option value="1h">1h</option>
              <option value="4h">4h</option>
              <option value="1d">1d</option>
            </select>
          </div>

          <div style={{ whiteSpace: "nowrap" }}>
            Status:{" "}
            <strong
              style={{
                color: isConnected ? "green" : "orange",
                whiteSpace: "nowrap",
              }}
            >
              {isConnected ? "Connected" : "Connecting..."}
            </strong>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr",
          gap: "0.5rem",
          flex: 1,
          minHeight: 0,
          padding: "0.5rem",
          boxSizing: "border-box",
        }}
      >
        {TOP_COINS.map((coin) => (
          <div
            key={coin}
            style={{
              border: "1px solid #ddd",
              borderRadius: "4px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              minWidth: 0,
              background: "#fff",
            }}
          >
            <div
              style={{
                padding: "0.5rem 1rem",
                background: "#f5f5f5",
                borderBottom: "1px solid #ddd",
                fontWeight: "bold",
                fontSize: "1rem",
                flexShrink: 0,
              }}
            >
              {coin}
              {coinsData[coin]?.currentCandle && (
                <span
                  style={{
                    marginLeft: "1rem",
                    fontSize: "0.85rem",
                    fontWeight: "normal",
                    color: "#666",
                  }}
                >
                  ${coinsData[coin].currentCandle?.close.toFixed(2)}
                </span>
              )}
            </div>
            <div style={{ flex: 1, minHeight: 0, minWidth: 0 }}>
              <KLineChartComponent
                symbol={coin}
                interval={selectedInterval}
                initialData={coinsData[coin]?.candleData || []}
                height="100%"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
