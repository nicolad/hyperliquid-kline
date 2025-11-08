/**
 * Fetch historical candle data from Hyperliquid REST API
 */

export interface HyperliquidCandle {
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

export async function fetchHyperliquidCandles(
  coin: string,
  interval: string,
  startTime?: number,
  endTime?: number
): Promise<[number, string, string, string, string, string][]> {
  const url = "https://api.hyperliquid.xyz/info";

  const body = {
    type: "candleSnapshot",
    req: {
      coin,
      interval,
      startTime,
      endTime,
    },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: HyperliquidCandle[] = await response.json();

    // Convert to the format expected by the converter: [timestamp, open, high, low, close, volume]
    return (data || []).map((candle) => [
      candle.t,
      candle.o,
      candle.h,
      candle.l,
      candle.c,
      candle.v,
    ]);
  } catch (error) {
    console.error(`Error fetching candles for ${coin}:`, error);
    return [];
  }
}
