/**
 * Example: Adding Technical Indicators to KLineChart
 *
 * This file demonstrates how to add various technical indicators
 * like MA (Moving Average), EMA, MACD, RSI, etc. to the chart.
 */

import { useEffect, useRef } from "react";
import { init, dispose } from "klinecharts";
import type { Chart, KLineData } from "klinecharts";

export function ChartWithIndicators() {
  const chartRef = useRef<Chart | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize chart
    const chart = init(containerRef.current);
    chartRef.current = chart;

    // Sample data
    const data: KLineData[] = [
      // ... your candle data here
    ];

    chart.applyNewData(data);

    // ==============================
    // Add Moving Average (MA)
    // ==============================
    chart.createIndicator("MA", false, { id: "candle_pane" });

    // ==============================
    // Add Volume indicator
    // ==============================
    chart.createIndicator("VOL");

    // ==============================
    // Add MACD indicator
    // ==============================
    chart.createIndicator("MACD");

    // ==============================
    // Add RSI indicator
    // ==============================
    chart.createIndicator("RSI");

    // ==============================
    // Add Bollinger Bands
    // ==============================
    chart.createIndicator("BOLL", false, { id: "candle_pane" });

    // ==============================
    // Custom Indicator Parameters
    // ==============================
    chart.createIndicator(
      {
        name: "MA",
        calcParams: [5, 10, 20, 60], // MA periods
      },
      false,
      { id: "candle_pane" }
    );

    chart.createIndicator(
      {
        name: "EMA",
        calcParams: [6, 12, 26],
      },
      false,
      { id: "candle_pane" }
    );

    // Cleanup
    return () => {
      if (containerRef.current) {
        dispose(containerRef.current);
      }
    };
  }, []);

  return <div ref={containerRef} style={{ width: "100%", height: "600px" }} />;
}

/**
 * Available Built-in Indicators:
 *
 * Main Chart Overlays (overlay on candles):
 * - MA: Moving Average
 * - EMA: Exponential Moving Average
 * - SMA: Simple Moving Average
 * - BOLL: Bollinger Bands
 * - SAR: Parabolic SAR
 *
 * Separate Pane Indicators:
 * - VOL: Volume
 * - MACD: Moving Average Convergence Divergence
 * - RSI: Relative Strength Index
 * - KDJ: Stochastic Oscillator
 * - CCI: Commodity Channel Index
 * - DMI: Directional Movement Index
 * - CR: Energy Index
 * - PSY: Psychological Line
 * - DMA: Different of Moving Average
 * - TRIX: Triple Exponentially Smoothed Average
 * - OBV: On Balance Volume
 * - VR: Volume Ratio
 * - WR: Williams %R
 * - MTM: Momentum
 * - EMV: Ease of Movement
 * - AO: Awesome Oscillator
 */

/**
 * Example: Advanced indicator management
 */
export function advancedIndicatorManagement(chart: Chart) {
  // Create indicator and get its pane ID
  const paneId = chart.createIndicator("MACD");

  // Remove specific indicator
  if (paneId) {
    chart.removeIndicator(paneId, "MACD");
  }

  // Get indicator info
  const indicators = chart.getIndicatorByPaneId();
  console.log("Current indicators:", indicators);

  // Override indicator
  chart.overrideIndicator(
    {
      name: "MA",
      calcParams: [7, 25, 99], // Change MA periods
    },
    "candle_pane"
  );

  // Set indicator visibility
  chart.setIndicatorVisible("candle_pane", "MA", true);
}

/**
 * Example: Custom Indicator Style
 */
export function customIndicatorStyle(chart: Chart) {
  chart.setStyles({
    indicator: {
      lastValueMark: {
        show: true,
        text: {
          color: "#FFFFFF",
          size: 12,
          family: "Arial",
        },
      },
      tooltip: {
        showRule: "always", // or "follow_cross" or "none"
        showType: "standard", // or "rect"
        text: {
          size: 12,
          family: "Arial",
          color: "#333333",
        },
      },
      // Line colors for indicators
      bars: [
        { color: "#FF6B6B" }, // First line
        { color: "#4ECDC4" }, // Second line
        { color: "#45B7D1" }, // Third line
      ],
    },
  });
}

/**
 * Example: Creating custom indicator
 */
export function createCustomIndicator(chart: Chart) {
  // Register custom indicator
  chart.registerIndicator({
    name: "CUSTOM_MA",
    shortName: "CMA",
    calcParams: [20],
    figures: [{ key: "ma", title: "MA", type: "line" }],
    calc: (dataList: KLineData[], { calcParams }: any) => {
      const period = calcParams[0];
      return dataList.map((kLineData: KLineData, i: number) => {
        if (i < period - 1) {
          return { ma: null };
        }
        let sum = 0;
        for (let j = 0; j < period; j++) {
          sum += dataList[i - j].close;
        }
        return { ma: sum / period };
      });
    },
  });

  // Use the custom indicator
  chart.createIndicator("CUSTOM_MA", false, { id: "candle_pane" });
}
