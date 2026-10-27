import React, { useState, useMemo } from 'react';
import { Observation } from '../../types';
import { TrendingUp, AlertTriangle, CheckCircle2, Sliders, Info } from 'lucide-react';

interface ObservationTrendChartProps {
  observations: Observation[];
}

export const ObservationTrendChart: React.FC<ObservationTrendChartProps> = ({ observations }) => {
  // Extract all numeric parameters available in the dataset
  const numericParameters = useMemo(() => {
    const map = new Map<string, number>();
    observations.forEach((obs) => {
      const num = Number(obs.value);
      if (!isNaN(num)) {
        map.set(obs.parameter, (map.get(obs.parameter) || 0) + 1);
      }
    });
    return Array.from(map.keys());
  }, [observations]);

  const [selectedParam, setSelectedParam] = useState<string>(() => {
    return numericParameters[0] || '';
  });

  // Keep selectedParam in sync if list changes
  React.useEffect(() => {
    if (!numericParameters.includes(selectedParam) && numericParameters.length > 0) {
      setSelectedParam(numericParameters[0]);
    }
  }, [numericParameters, selectedParam]);

  const [hoveredPoint, setHoveredPoint] = useState<{
    obs: Observation;
    x: number;
    y: number;
  } | null>(null);

  // Filter and sort matching points chronologically
  const activeSeries = useMemo(() => {
    if (!selectedParam) return [];
    return observations
      .filter((obs) => obs.parameter === selectedParam && !isNaN(Number(obs.value)))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [observations, selectedParam]);

  // Statistical calculations
  const stats = useMemo(() => {
    if (activeSeries.length === 0) return null;
    const values = activeSeries.map((d) => Number(d.value));
    const n = values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (n > 1 ? n - 1 : 1);
    const stdDev = Math.sqrt(variance);

    // Dynamic Upper & Lower Specification Limits (Mean ± 2 Standard Deviations)
    const usl = Number((mean + 2 * (stdDev || mean * 0.1)).toFixed(3));
    const lsl = Number((mean - 2 * (stdDev || mean * 0.1)).toFixed(3));
    const anomalyCount = activeSeries.filter((d) => d.status === 'anomaly').length;

    return {
      count: n,
      min: Number(min.toFixed(3)),
      max: Number(max.toFixed(3)),
      mean: Number(mean.toFixed(3)),
      stdDev: Number(stdDev.toFixed(3)),
      usl,
      lsl,
      anomalyCount,
      unit: activeSeries[0]?.unit || '',
    };
  }, [activeSeries]);

  if (numericParameters.length === 0 || activeSeries.length === 0 || !stats) {
    return null;
  }

  // Chart coordinate math
  const width = 800;
  const height = 240;
  const padding = { top: 30, right: 40, bottom: 40, left: 60 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const yMin = Math.min(stats.min, stats.lsl) * 0.95;
  const yMax = Math.max(stats.max, stats.usl) * 1.05;
  const yRange = yMax - yMin === 0 ? 1 : yMax - yMin;

  const getX = (index: number) => {
    if (activeSeries.length === 1) return padding.left + chartW / 2;
    return padding.left + (index / (activeSeries.length - 1)) * chartW;
  };

  const getY = (val: number) => {
    return padding.top + chartH - ((val - yMin) / yRange) * chartH;
  };

  // Build SVG Path
  const points = activeSeries.map((obs, idx) => ({
    x: getX(idx),
    y: getY(Number(obs.value)),
    obs,
  }));

  const linePath = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
  }, '');

  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x},${padding.top + chartH} L ${points[0].x},${padding.top + chartH} Z`
    : '';

  // Specification reference line Y-coords
  const uslY = getY(stats.usl);
  const lslY = getY(stats.lsl);
  const meanY = getY(stats.mean);

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
      {/* Header with Parameter Selector & Status Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <span>Scientific Analytical Trend Visualizer</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                Live Kinetics
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Interactive time-series regression and Out-of-Specification (OOS) statistical control.
            </p>
          </div>
        </div>

        {/* Parameter Selector Dropdown */}
        <div className="flex items-center space-x-2 text-xs">
          <Sliders className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500 dark:text-slate-400 font-medium">Metric:</span>
          <select
            value={selectedParam}
            onChange={(e) => setSelectedParam(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            {numericParameters.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Statistical Summary Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80">
          <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500">Sample Size</span>
          <p className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200">
            N = {stats.count}
          </p>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80">
          <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500">Mean (&mu;)</span>
          <p className="text-sm font-bold font-mono text-brand-600 dark:text-brand-400">
            {stats.mean} <span className="text-xs font-normal text-slate-400">{stats.unit}</span>
          </p>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80">
          <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500">Std Deviation (&sigma;)</span>
          <p className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200">
            &plusmn;{stats.stdDev}
          </p>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80">
          <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500">Range [Min - Max]</span>
          <p className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200">
            {stats.min} - {stats.max}
          </p>
        </div>
        <div className={`p-2.5 rounded-xl border ${
          stats.anomalyCount > 0
            ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800/50'
            : 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/50'
        }`}>
          <span className={`text-[10px] uppercase font-semibold ${
            stats.anomalyCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
          }`}>
            OOS Anomaly Count
          </span>
          <p className={`text-sm font-bold font-mono flex items-center space-x-1 ${
            stats.anomalyCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
          }`}>
            {stats.anomalyCount > 0 ? <AlertTriangle className="w-3.5 h-3.5 inline" /> : <CheckCircle2 className="w-3.5 h-3.5 inline" />}
            <span>{stats.anomalyCount} flags</span>
          </p>
        </div>
      </div>

      {/* SVG Chart Stage */}
      <div className="relative overflow-hidden rounded-xl bg-slate-50/60 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 p-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          style={{ maxHeight: '250px' }}
        >
          <defs>
            <linearGradient id="trendAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left + chartW}
            y2={padding.top}
            stroke="currentColor"
            strokeDasharray="3 3"
            className="text-slate-200 dark:text-slate-800/80"
          />
          <line
            x1={padding.left}
            y1={padding.top + chartH / 2}
            x2={padding.left + chartW}
            y2={padding.top + chartH / 2}
            stroke="currentColor"
            strokeDasharray="3 3"
            className="text-slate-200 dark:text-slate-800/80"
          />
          <line
            x1={padding.left}
            y1={padding.top + chartH}
            x2={padding.left + chartW}
            y2={padding.top + chartH}
            stroke="currentColor"
            className="text-slate-300 dark:text-slate-700"
          />

          {/* Upper Specification Limit (USL) Line */}
          {stats.usl <= yMax && (
            <g>
              <line
                x1={padding.left}
                y1={uslY}
                x2={padding.left + chartW}
                y2={uslY}
                stroke="#f43f5e"
                strokeWidth="1.2"
                strokeDasharray="4 3"
              />
              <text
                x={padding.left + chartW - 4}
                y={uslY - 4}
                textAnchor="end"
                className="text-[9px] fill-rose-500 font-mono font-bold"
              >
                USL ({stats.usl})
              </text>
            </g>
          )}

          {/* Lower Specification Limit (LSL) Line */}
          {stats.lsl >= yMin && (
            <g>
              <line
                x1={padding.left}
                y1={lslY}
                x2={padding.left + chartW}
                y2={lslY}
                stroke="#f43f5e"
                strokeWidth="1.2"
                strokeDasharray="4 3"
              />
              <text
                x={padding.left + chartW - 4}
                y={lslY + 11}
                textAnchor="end"
                className="text-[9px] fill-rose-500 font-mono font-bold"
              >
                LSL ({stats.lsl})
              </text>
            </g>
          )}

          {/* Mean Target Line */}
          <line
            x1={padding.left}
            y1={meanY}
            x2={padding.left + chartW}
            y2={meanY}
            stroke="#0ea5e9"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
          <text
            x={padding.left + 6}
            y={meanY - 4}
            className="text-[9px] fill-sky-600 dark:fill-sky-400 font-mono font-semibold"
          >
            &mu; Target ({stats.mean})
          </text>

          {/* Area Fill */}
          {areaPath && <path d={areaPath} fill="url(#trendAreaGradient)" />}

          {/* Trend Polyline */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data Points */}
          {points.map((pt, i) => {
            const isAnomaly = pt.obs.status === 'anomaly';
            const isHovered = hoveredPoint?.obs.id === pt.obs.id;

            return (
              <g
                key={pt.obs.id || i}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredPoint(pt)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {/* Glow ring for anomalies */}
                {isAnomaly && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 9 : 7}
                    className="fill-rose-500/30 animate-pulse"
                  />
                )}
                {/* Main Node */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : 4.5}
                  className={`transition-all duration-150 ${
                    isAnomaly
                      ? 'fill-rose-500 stroke-white dark:stroke-slate-900 stroke-2'
                      : 'fill-brand-500 stroke-white dark:stroke-slate-900 stroke-2'
                  }`}
                />
              </g>
            );
          })}

          {/* X Axis Labels */}
          {points.map((pt, i) => {
            // Show first, middle, last or limited labels
            const shouldShow =
              i === 0 ||
              i === points.length - 1 ||
              (points.length <= 6) ||
              (i === Math.floor(points.length / 2));

            if (!shouldShow) return null;

            return (
              <text
                key={`label-${i}`}
                x={pt.x}
                y={padding.top + chartH + 18}
                textAnchor="middle"
                className="text-[10px] font-mono fill-slate-400 dark:fill-slate-500"
              >
                {new Date(pt.obs.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </text>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredPoint && (
          <div
            className="absolute z-20 pointer-events-none p-3 rounded-xl bg-slate-900/95 dark:bg-slate-950 text-white text-xs border border-slate-700 shadow-xl backdrop-blur-sm -translate-x-1/2 -translate-y-full mb-2"
            style={{
              left: `${(hoveredPoint.x / width) * 100}%`,
              top: `${(hoveredPoint.y / height) * 100}%`,
            }}
          >
            <div className="font-bold text-brand-400 flex items-center justify-between gap-4">
              <span>{hoveredPoint.obs.parameter}</span>
              <span className="font-mono text-white text-sm">
                {hoveredPoint.obs.value} {hoveredPoint.obs.unit}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Time: {new Date(hoveredPoint.obs.timestamp).toLocaleString()}
            </div>
            {hoveredPoint.obs.notes && (
              <div className="text-[11px] text-slate-300 mt-1 max-w-xs border-t border-slate-800 pt-1">
                Note: {hoveredPoint.obs.notes}
              </div>
            )}
            <div className="mt-1 pt-1 flex items-center justify-between text-[10px]">
              <span className="text-slate-400">By: {hoveredPoint.obs.recordedByName}</span>
              <span
                className={`font-semibold uppercase px-1.5 py-0.2 rounded text-[9px] ${
                  hoveredPoint.obs.status === 'anomaly'
                    ? 'bg-rose-500/20 text-rose-300'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}
              >
                {hoveredPoint.obs.status}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
        <span className="flex items-center space-x-1">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>Control bands reflect &plusmn;2&sigma; limits. Red nodes represent flagged out-of-specification measurements.</span>
        </span>
        <span className="font-mono text-[10px] text-slate-400">
          Range: [{yMin.toFixed(2)} — {yMax.toFixed(2)}]
        </span>
      </div>
    </div>
  );
};
