import type { KLineData } from "klinecharts";

/**
 * Converts Hyperliquid candle data to KLineChart format
 * Hyperliquid candle format: [timestamp, open, high, low, close, volume]
 */
export function convertHyperliquidToKLine(
  hlCandle: [number, string, string, string, string, string]
): KLineData {
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
 */
export function convertHyperliquidCandlesToKLine(
  hlCandles: [number, string, string, string, string, string][]
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
