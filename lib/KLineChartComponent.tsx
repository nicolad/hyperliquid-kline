"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useKLineChart } from "./useKLineChart";
import type { KLineData } from "klinecharts";

interface KLineChartComponentProps {
  symbol: string;
  interval?: string;
  initialData?: KLineData[];
  onDataUpdate?: (data: KLineData) => void;
  height?: number | string;
}

export default function KLineChartComponent({
  symbol,
  interval = "1m",
  initialData = [],
  onDataUpdate,
  height = 600,
}: KLineChartComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isChartReady, setIsChartReady] = useState(false);
  const prevDataRef = useRef<KLineData[]>([]);
  const { initChart, updateData, setData, resize } = useKLineChart({
    symbol,
    interval,
  });

  useEffect(() => {
    if (containerRef.current && !isChartReady) {
      initChart(containerRef.current);
      setIsChartReady(true);
    }
  }, [initChart, isChartReady]);

  useEffect(() => {
    if (!isChartReady || initialData.length === 0) return;

    const prevData = prevDataRef.current;

    if (prevData.length === 0) {
      setData(initialData);
      prevDataRef.current = initialData;
      return;
    }

    if (initialData.length !== prevData.length) {
      setData(initialData);
      prevDataRef.current = initialData;
      return;
    }

    const lastCandle = initialData[initialData.length - 1];
    const prevLastCandle = prevData[prevData.length - 1];

    if (
      lastCandle &&
      prevLastCandle &&
      (lastCandle.close !== prevLastCandle.close ||
        lastCandle.high !== prevLastCandle.high ||
        lastCandle.low !== prevLastCandle.low ||
        lastCandle.volume !== prevLastCandle.volume)
    ) {
      updateData(lastCandle);
      prevDataRef.current = initialData;
    }
  }, [isChartReady, initialData, setData, updateData, symbol]);

  useEffect(() => {
    const handleResize = () => {
      resize();
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [resize]);

  const handleUpdateData = useCallback(
    (data: KLineData) => {
      updateData(data);
      if (onDataUpdate) {
        onDataUpdate(data);
      }
    },
    [updateData, onDataUpdate]
  );

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: typeof height === "number" ? `${height}px` : height,
      }}
    />
  );
}

export { KLineChartComponent };
export type { KLineData };
