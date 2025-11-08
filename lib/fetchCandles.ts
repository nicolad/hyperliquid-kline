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
  // Use Next.js API route to avoid CORS issues
  const url = "/api/hyperliquid";

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
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      console.error(
        `❌ [FETCH] HTTP error for ${coin}! Status: ${response.status} ${response.statusText}`
      );
      console.error(`❌ [FETCH] Error details:`, errorData);
      throw new Error(
        `HTTP error! status: ${response.status}, details: ${JSON.stringify(
          errorData
        )}`
      );
    }

    const data: HyperliquidCandle[] = await response.json();

    if (!Array.isArray(data)) {
      console.error(`❌ [FETCH] Invalid response format for ${coin}:`, data);
      return [];
    }

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
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `❌ [FETCH] Error fetching candles for ${coin}:`,
      errorMessage
    );
    if (error instanceof Error && error.stack) {
      console.error(`❌ [FETCH] Stack trace:`, error.stack);
    }
    return [];
  }
}
