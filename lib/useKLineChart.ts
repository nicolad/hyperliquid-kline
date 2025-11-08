import { useEffect, useRef, useCallback } from "react";
import { init, dispose, KLineData } from "klinecharts";
import type { Chart } from "klinecharts";

export interface KLineChartOptions {
  symbol?: string;
  interval?: string;
  locale?: string;
  timezone?: string;
}

export function useKLineChart(options: KLineChartOptions = {}) {
  const chartRef = useRef<Chart | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const initChart = useCallback(
    (container: HTMLDivElement) => {
      if (chartRef.current) {
        dispose(containerRef.current!);
      }

      containerRef.current = container;
      chartRef.current = init(container, {
        locale: options.locale || "en-US",
        timezone: options.timezone || "UTC",
        styles: {
          candle: {
            bar: {
              upColor: "#26A69A",
              downColor: "#EF5350",
              upBorderColor: "#26A69A",
              downBorderColor: "#EF5350",
              upWickColor: "#26A69A",
              downWickColor: "#EF5350",
            },
          },
          grid: {
            horizontal: {
              color: "#e0e0e0",
            },
            vertical: {
              color: "#e0e0e0",
            },
          },
        },
      });

      return chartRef.current;
    },
    [options.locale, options.timezone]
  );

  const updateData = useCallback((data: KLineData | KLineData[]) => {
    if (chartRef.current) {
      if (Array.isArray(data)) {
        chartRef.current.applyNewData(data);
      } else {
        chartRef.current.updateData(data);
      }
    }
  }, []);

  const setData = useCallback((data: KLineData[]) => {
    if (chartRef.current) {
      chartRef.current.applyNewData(data);
    }
  }, []);

  const resize = useCallback(() => {
    if (chartRef.current) {
      chartRef.current.resize();
    }
  }, []);

  useEffect(() => {
    return () => {
      if (containerRef.current && chartRef.current) {
        dispose(containerRef.current);
        chartRef.current = null;
      }
    };
  }, []);

  return {
    initChart,
    updateData,
    setData,
    resize,
    chart: chartRef.current,
  };
}
