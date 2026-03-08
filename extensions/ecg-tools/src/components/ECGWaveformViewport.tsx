import React, { useEffect, useState, useRef, useCallback } from 'react';
import { DicomMetadataStore } from '@ohif/core';

const LEAD_NAMES = ['I', 'II', 'III', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6'];

// ─── DICOM Waveform Parser ─────────────────────────────────────────────────────

function parseWaveformData(instance) {
  try {
    const waveformSequence =
      instance['54000100'] || instance.WaveformSequence || instance['x54000100'];
    if (!waveformSequence) return null;

    const sequences = Array.isArray(waveformSequence)
      ? waveformSequence
      : waveformSequence.Value || [];

    const leads: any[] = [];

    for (const seq of sequences) {
      const channelDef =
        seq['003a0200'] || seq.WaveformChannelDefinitionSequence || seq['x003a0200'];
      const waveformData = seq['54001010'] || seq.WaveformData || seq['x54001010'];
      const samplesPerChannel = seq['003a0010']?.Value?.[0] || seq.NumberOfWaveformSamples || 5000;
      const samplingFreq = seq['003a001a']?.Value?.[0] || seq.SamplingFrequency || 500;
      const numChannels = seq['003a0005']?.Value?.[0] || seq.NumberOfWaveformChannels || 12;

      if (!waveformData) continue;

      let rawData: Int16Array;
      if (waveformData.InlineBinary) {
        const binaryStr = atob(waveformData.InlineBinary);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
        rawData = new Int16Array(bytes.buffer);
      } else if (waveformData.Value) {
        rawData = new Int16Array(waveformData.Value);
      } else {
        continue;
      }

      const channels = Array.isArray(channelDef) ? channelDef : channelDef?.Value || [];

      for (let ch = 0; ch < numChannels; ch++) {
        const channelData: number[] = [];
        for (let s = 0; s < samplesPerChannel; s++)
          channelData.push(rawData[s * numChannels + ch] || 0);

        const chDef = channels[ch] || {};
        const sensitivity = chDef['003a0210']?.Value?.[0] || chDef.ChannelSensitivity || 1;
        const units = chDef['003a0211']?.Value?.[0] || 'uV';
        const scaleFactor =
          typeof units === 'string' && units.includes('uV') ? sensitivity / 1000 : sensitivity;

        leads.push({
          name: LEAD_NAMES[ch] || `Lead ${ch + 1}`,
          data: channelData.map(v => v * scaleFactor),
          samplingFreq,
          samplesPerChannel,
        });
      }
    }
    return leads.length > 0 ? leads : null;
  } catch (e) {
    console.warn('[ECGViewport] Parse error:', e);
    return null;
  }
}

// ─── Demo ECG Generator ────────────────────────────────────────────────────────

function generateDemoECG() {
  const samplingFreq = 500;
  const durationSec = 10;
  const samples = samplingFreq * durationSec;
  const heartRate = 72;
  const rrSamples = Math.round((60 / heartRate) * samplingFreq);

  function singleBeat(amp = 1) {
    const beat = new Array(rrSamples).fill(0);
    const t = rrSamples;
    const pS = Math.round(0.05 * t),
      pE = Math.round(0.15 * t);
    for (let i = pS; i < pE; i++) beat[i] = amp * 0.15 * Math.sin((Math.PI * (i - pS)) / (pE - pS));
    const q = Math.round(0.22 * t);
    beat[q] = -amp * 0.1;
    beat[q + 1] = amp * 0.1;
    beat[q + 2] = amp * 1.2;
    beat[q + 3] = -amp * 0.25;
    beat[q + 4] = -amp * 0.05;
    const tS = Math.round(0.35 * t),
      tE = Math.round(0.55 * t);
    for (let i = tS; i < tE; i++) beat[i] = amp * 0.35 * Math.sin((Math.PI * (i - tS)) / (tE - tS));
    return beat;
  }

  return LEAD_NAMES.map((name, li) => {
    const amps = [1, 0.8, -0.3, -0.8, 0.5, 0.6, 0.3, 0.6, 0.9, 1.1, 1.0, 0.9];
    const data: number[] = [];
    for (let b = 0; b < Math.ceil(samples / rrSamples); b++)
      data.push(...singleBeat(amps[li] || 1));
    return {
      name,
      data: data.slice(0, samples).map(v => v + (Math.random() - 0.5) * 0.01),
      samplingFreq,
      samplesPerChannel: samples,
    };
  });
}

// ─── SVG Waveform Path ────────────────────────────────────────────────────────

function getWaveformPath(data: number[], width: number, height: number) {
  if (!data?.length) return '';
  const maxPts = 2000;
  const step = Math.max(1, Math.floor(data.length / maxPts));
  const pts: number[] = [];
  for (let i = 0; i < data.length; i += step) pts.push(data[i]);
  const min = Math.min(...pts),
    max = Math.max(...pts);
  const range = max - min || 1;
  const scale = (height * 0.72) / range;
  const stepX = width / pts.length;
  return pts
    .map((v, i) => {
      const x = (i * stepX).toFixed(1);
      const y = (height / 2 - (v - (min + max) / 2) * scale).toFixed(1);
      return (i === 0 ? 'M' : 'L') + `${x},${y}`;
    })
    .join(' ');
}

// ─── ECG Grid ─────────────────────────────────────────────────────────────────

function ECGGrid({ width, height }: { width: number; height: number }) {
  const cell = 20;
  return (
    <g>
      {Array.from({ length: Math.floor(height / cell) }, (_, i) => (
        <line
          key={`h${i}`}
          x1={0}
          y1={(i + 1) * cell}
          x2={width}
          y2={(i + 1) * cell}
          stroke={i % 5 === 4 ? '#ff000055' : '#ff000022'}
          strokeWidth={i % 5 === 4 ? 0.8 : 0.3}
        />
      ))}
      {Array.from({ length: Math.floor(width / cell) }, (_, i) => (
        <line
          key={`v${i}`}
          x1={(i + 1) * cell}
          y1={0}
          x2={(i + 1) * cell}
          y2={height}
          stroke={i % 5 === 4 ? '#ff000055' : '#ff000022'}
          strokeWidth={i % 5 === 4 ? 0.8 : 0.3}
        />
      ))}
    </g>
  );
}

// ─── Point Marker (Q / T label box) ───────────────────────────────────────────

function PointMarker({
  x,
  y,
  label,
  color,
}: {
  x: number;
  y: number;
  label: string;
  color: string;
}) {
  return (
    <g>
      {/* Vertical tick line */}
      <line
        x1={x}
        y1={y - 40}
        x2={x}
        y2={y + 5}
        stroke={color}
        strokeWidth={1.5}
      />
      {/* Label box */}
      <rect
        x={x - 8}
        y={y - 55}
        width={16}
        height={14}
        rx={2}
        fill={color + 'cc'}
      />
      <text
        x={x}
        y={y - 44}
        textAnchor="middle"
        fill="#fff"
        fontSize={9}
        fontFamily="monospace"
        fontWeight="bold"
      >
        {label}
      </text>
    </g>
  );
}

// ─── Completed QT Measurement Shape ───────────────────────────────────────────

interface QTMeasurement {
  id: number;
  q1: { x: number; y: number };
  t: { x: number; y: number };
  q2: { x: number; y: number };
  rrSec: number;
  qtSec: number;
  qtcSec: number;
}

function QTMeasurementShape({ m }: { m: QTMeasurement }) {
  const { q1, t, q2, rrSec, qtSec, qtcSec } = m;
  const midY = Math.max(q1.y, t.y, q2.y) + 28;
  const labelX = (q1.x + q2.x) / 2;
  const label = `RR=${rrSec.toFixed(2)} s    QT=${qtSec.toFixed(3)} s    QTc=${qtcSec.toFixed(3)} s`;

  return (
    <g>
      {/* Q1 vertical line */}
      <line
        x1={q1.x}
        y1={q1.y - 40}
        x2={q1.x}
        y2={midY - 5}
        stroke="#5bc8f5"
        strokeWidth={1.5}
      />
      {/* T vertical line */}
      <line
        x1={t.x}
        y1={t.y - 40}
        x2={t.x}
        y2={midY - 5}
        stroke="#5bc8f5"
        strokeWidth={1.5}
      />
      {/* Q2 vertical line */}
      <line
        x1={q2.x}
        y1={q2.y - 40}
        x2={q2.x}
        y2={midY - 5}
        stroke="#5bc8f5"
        strokeWidth={1.5}
      />
      {/* Diagonal line T → Q2 */}
      <line
        x1={t.x}
        y1={t.y - 10}
        x2={q2.x}
        y2={q2.y - 10}
        stroke="#5bc8f5"
        strokeWidth={1.5}
      />
      {/* Q1 → T horizontal (QT span) */}
      <line
        x1={q1.x}
        y1={q1.y - 10}
        x2={t.x}
        y2={t.y - 10}
        stroke="#5bc8f5"
        strokeWidth={1.5}
      />
      {/* Bottom baseline connecting q1 → q2 */}
      <line
        x1={q1.x}
        y1={midY - 5}
        x2={q2.x}
        y2={midY - 5}
        stroke="#5bc8f5"
        strokeWidth={1}
        strokeDasharray="4 2"
      />
      {/* Q1 label */}
      <PointMarker
        x={q1.x}
        y={q1.y}
        label="Q"
        color="#5bc8f5"
      />
      {/* T label */}
      <PointMarker
        x={t.x}
        y={t.y}
        label="T"
        color="#5bc8f5"
      />
      {/* Q2 label */}
      <PointMarker
        x={q2.x}
        y={q2.y}
        label="Q"
        color="#5bc8f5"
      />
      {/* Measurement label */}
      <rect
        x={labelX - label.length * 3.1}
        y={midY + 2}
        width={label.length * 6.2}
        height={15}
        rx={3}
        fill="#0a0e1acc"
      />
      <text
        x={labelX}
        y={midY + 13}
        textAnchor="middle"
        fill="#5bc8f5"
        fontSize={11}
        fontFamily="monospace"
        fontWeight="bold"
      >
        {label}
      </text>
    </g>
  );
}

// ─── In-progress QT Tool Preview ──────────────────────────────────────────────

interface ActiveQTState {
  step: 1 | 2 | 3; // 1=placed Q1, 2=placed T, drawing Q2
  q1?: { x: number; y: number };
  t?: { x: number; y: number };
  cursor?: { x: number; y: number };
}

function ActiveQTPreview({ state }: { state: ActiveQTState }) {
  const { step, q1, t, cursor } = state;
  return (
    <g opacity={0.75}>
      {q1 && (
        <PointMarker
          x={q1.x}
          y={q1.y}
          label="Q"
          color="#5bc8f5"
        />
      )}
      {t && (
        <>
          <PointMarker
            x={t.x}
            y={t.y}
            label="T"
            color="#5bc8f5"
          />
          {/* Q1→T line */}
          <line
            x1={q1!.x}
            y1={q1!.y - 10}
            x2={t.x}
            y2={t.y - 10}
            stroke="#5bc8f5"
            strokeWidth={1.5}
            strokeDasharray="4 2"
          />
        </>
      )}
      {/* Live preview line following cursor */}
      {step === 2 && cursor && q1 && (
        <line
          x1={q1.x}
          y1={q1.y}
          x2={cursor.x}
          y2={cursor.y}
          stroke="#5bc8f5"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
      )}
      {step === 3 && cursor && t && (
        <>
          <PointMarker
            x={cursor.x}
            y={cursor.y}
            label="Q"
            color="#5bc8f5cc"
          />
          <line
            x1={t.x}
            y1={t.y - 10}
            x2={cursor.x}
            y2={cursor.y - 10}
            stroke="#5bc8f5"
            strokeWidth={1.5}
            strokeDasharray="4 2"
          />
        </>
      )}
    </g>
  );
}

// ─── Main ECG Waveform Viewport ────────────────────────────────────────────────

let measureId = 0;

export default function ECGWaveformViewport({ displaySets, servicesManager }: any) {
  const displaySet = displaySets?.[0];
  const [leads, setLeads] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [measurements, setMeasurements] = useState<QTMeasurement[]>([]);
  const [activeQT, setActiveQT] = useState<ActiveQTState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });

  // Resize observer
  useEffect(() => {
    const obs = new ResizeObserver(entries => {
      for (const e of entries)
        setDimensions({
          width: Math.max(e.contentRect.width, 200),
          height: Math.max(e.contentRect.height, 200),
        });
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Load ECG data
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const instance = displaySet?.instance;
        if (!instance) {
          setLeads(generateDemoECG());
          setError('Demo mode: Showing synthetic 12-Lead ECG.');
          setLoading(false);
          return;
        }
        const meta = DicomMetadataStore.getInstance(
          instance.StudyInstanceUID,
          instance.SeriesInstanceUID,
          instance.SOPInstanceUID
        );
        const parsed = parseWaveformData(meta || instance);
        if (parsed?.length) {
          setLeads(parsed);
          setError(null);
        } else {
          setLeads(generateDemoECG());
          setError('Demo mode: Binary waveform not available. Showing synthetic ECG.');
        }
      } catch (e: any) {
        setLeads(generateDemoECG());
        setError('Demo: ' + e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [displaySet]);

  // Convert pixel x to time in seconds
  const pixelToSec = useCallback(
    (px: number) => {
      const totalSec = (leads?.[0]?.samplesPerChannel || 5000) / (leads?.[0]?.samplingFreq || 500);
      return (px / dimensions.width) * totalSec;
    },
    [leads, dimensions.width]
  );

  // Get SVG coords from mouse event
  const getCoords = useCallback((e: React.MouseEvent) => {
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  // 3-click state machine — always active (no toolbar gate needed)
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      const pt = getCoords(e);

      if (!activeQT) {
        // Step 1: place Q1
        setActiveQT({ step: 2, q1: pt, cursor: pt });
      } else if (activeQT.step === 2) {
        // Step 2: place T
        setActiveQT({ step: 3, q1: activeQT.q1, t: pt, cursor: pt });
      } else if (activeQT.step === 3) {
        // Step 3: place Q2 → complete measurement
        const q1 = activeQT.q1!;
        const t = activeQT.t!;
        const q2 = pt;
        const rrSec = pixelToSec(Math.abs(q2.x - q1.x));
        const qtSec = pixelToSec(Math.abs(t.x - q1.x));
        const qtcSec = Math.sqrt(rrSec) > 0 ? qtSec / Math.sqrt(rrSec) : 0;

        setMeasurements(prev => [
          ...prev,
          {
            id: ++measureId,
            q1,
            t,
            q2,
            rrSec,
            qtSec,
            qtcSec,
          },
        ]);
        setActiveQT(null);
      }
    },
    [activeQT, getCoords, pixelToSec]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!activeQT) return;
      setActiveQT(prev => (prev ? { ...prev, cursor: getCoords(e) } : null));
    },
    [activeQT, getCoords]
  );

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setActiveQT(null);
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (loading) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0a0e1a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            border: '3px solid #1e2a4a',
            borderTop: '3px solid #4facfe',
            borderRadius: '50%',
          }}
        />
        <p style={{ color: '#4facfe', marginTop: 12, fontFamily: 'monospace' }}>
          Loading ECG Waveform…
        </p>
      </div>
    );
  }

  const numLeads = leads?.length || 12;
  const cols = numLeads >= 12 ? 4 : numLeads >= 6 ? 2 : 1;
  const rows = Math.ceil(numLeads / cols);
  const { width, height } = dimensions;
  const headerH = error ? 54 : 34;
  const svgH = Math.max(height - headerH, 100);
  const leadW = width / cols;
  const leadH = svgH / rows;

  // Step hint based on measurement progress
  const stepHint = !activeQT
    ? '🎯 Click Q onset (QRS start) → T end → next Q onset  ·  RR / QT / QTc'
    : activeQT.step === 2
      ? '2/3 — Click T point (end of T wave)'
      : '3/3 — Click next Q onset (next beat)';

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        background: '#0a0e1a',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: 'monospace',
        userSelect: 'none',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '5px 12px',
          background: '#151a2f',
          borderBottom: '1px solid #1e2a4a',
          flexShrink: 0,
          gap: 12,
        }}
      >
        <span style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>
          ECG Waveform — {displaySet?.SeriesDescription || '12-Lead ECG'}
        </span>
        <span style={{ color: '#5bc8f5', fontSize: 11, flex: 1, textAlign: 'center' }}>
          🎯 {stepHint}
        </span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ color: '#4facfe', fontSize: 11 }}>
            {leads?.[0]?.samplingFreq || 500} Hz | 25 mm/s | 10 mm/mV
          </span>
          {activeQT && (
            <button
              onClick={() => setActiveQT(null)}
              style={{
                background: '#555',
                color: '#fff',
                border: 'none',
                padding: '2px 8px',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 11,
              }}
            >
              Cancel (Esc)
            </button>
          )}
          {measurements.length > 0 && (
            <button
              onClick={() => setMeasurements([])}
              style={{
                background: '#e53935',
                color: '#fff',
                border: 'none',
                padding: '2px 8px',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 11,
              }}
            >
              Clear All
            </button>
          )}
        </div>
      </div>
      {error && (
        <div
          style={{
            background: '#2a1a00',
            borderLeft: '3px solid #ff9800',
            color: '#ff9800',
            padding: '4px 12px',
            fontSize: 11,
            flexShrink: 0,
          }}
        >
          {error}
        </div>
      )}

      {/* Viewport */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        {/* Background waveform (no pointer events) */}
        <svg
          width={width}
          height={svgH}
          style={{ background: '#0a0e1a', display: 'block', position: 'absolute', top: 0, left: 0 }}
        >
          <ECGGrid
            width={width}
            height={svgH}
          />
          {leads?.map((lead, idx) => {
            const col = idx % cols;
            const row = Math.floor(idx / cols);
            return (
              <g
                key={lead.name}
                transform={`translate(${col * leadW},${row * leadH})`}
              >
                <text
                  x={6}
                  y={16}
                  fill="#4facfe"
                  fontSize={11}
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {lead.name}
                </text>
                <line
                  x1={0}
                  y1={leadH}
                  x2={leadW}
                  y2={leadH}
                  stroke="#1e2a4a"
                  strokeWidth={1}
                />
                <path
                  d={getWaveformPath(lead.data, leadW, leadH)}
                  fill="none"
                  stroke="#00e676"
                  strokeWidth={1.3}
                  strokeLinejoin="round"
                />
              </g>
            );
          })}
        </svg>

        {/* Interactive overlay — captures clicks */}
        <svg
          ref={overlayRef}
          width={width}
          height={svgH}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            cursor: 'crosshair',
            pointerEvents: 'all',
          }}
          onClick={handleClick}
          onMouseMove={handleMouseMove}
        >
          {/* Completed measurements */}
          {measurements.map(m => (
            <QTMeasurementShape
              key={m.id}
              m={m}
            />
          ))}
          {/* Active in-progress measurement */}
          {activeQT && <ActiveQTPreview state={activeQT} />}
        </svg>
      </div>
    </div>
  );
}
