import type { KLineData } from "klinecharts";

/**
 * WebSocket candle format (object)
 */
interface HyperliquidCandleObject {
  t: number; // timestamp (ms)
  T: number; // close timestamp
  s: string; // symbol
  i: string; // interval
  o: string; // open
  c: string; // close
  h: string; // high
  l: string; // low
  v: string; // volume
  n: number; // number of trades
}

/**
 * HTTP API candle format (array)
 */
type HyperliquidCandleArray = [number, string, string, string, string, string];

/**
 * Converts Hyperliquid candle data to KLineChart format
 * Supports both array format (HTTP API) and object format (WebSocket)
 */
export function convertHyperliquidToKLine(
  hlCandle: HyperliquidCandleArray | HyperliquidCandleObject
): KLineData {
  // Check if it's an object (WebSocket format)
  if (!Array.isArray(hlCandle) && typeof hlCandle === "object") {
    return {
      timestamp: hlCandle.t,
      open: parseFloat(hlCandle.o),
      high: parseFloat(hlCandle.h),
      low: parseFloat(hlCandle.l),
      close: parseFloat(hlCandle.c),
      volume: parseFloat(hlCandle.v),
    };
  }

  // Array format (HTTP API)
  const [timestamp, open, high, low, close, volume] = hlCandle;

  return {
    timestamp: timestamp,
    open: parseFloat(open),
    high: parseFloat(high),
    low: parseFloat(low),
    close: parseFloat(close),
    volume: parseFloat(volume),
  };
}

/**
 * Converts an array of Hyperliquid candles to KLineChart format
 * Supports both array format (HTTP API) and object format (WebSocket)
 */
export function convertHyperliquidCandlesToKLine(
  hlCandles: (HyperliquidCandleArray | HyperliquidCandleObject)[]
): KLineData[] {
  return hlCandles.map(convertHyperliquidToKLine);
}

/**
 * Creates a KLineData object from trade data
 * Useful for building candles from real-time trade updates
 */
export function createKLineFromTrade(
  timestamp: number,
  price: number,
  volume: number,
  previousCandle?: KLineData
): KLineData {
  if (!previousCandle) {
    return {
      timestamp,
      open: price,
      high: price,
      low: price,
      close: price,
      volume,
    };
  }

  return {
    timestamp: previousCandle.timestamp,
    open: previousCandle.open,
    high: Math.max(previousCandle.high, price),
    low: Math.min(previousCandle.low, price),
    close: price,
    volume: (previousCandle.volume || 0) + volume,
  };
}

/**
 * Merges a new trade into the current candle
 */
export function updateCandleWithTrade(
  currentCandle: KLineData,
  price: number,
  volume: number
): KLineData {
  return {
    ...currentCandle,
    high: Math.max(currentCandle.high, price),
    low: Math.min(currentCandle.low, price),
    close: price,
    volume: (currentCandle.volume || 0) + volume,
  };
}
