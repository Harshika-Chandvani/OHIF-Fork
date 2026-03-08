import React, { useEffect, useState } from 'react';

// Core calculation helpers representing typical ECG domain logic
const calculateHeartRate = (rrMs: number) => 60000 / rrMs;
const calculateQTcBazett = (qtMs: number, rrMs: number) => qtMs / Math.sqrt(rrMs / 1000);
const calculateQRSAxis = (leadI: number, leadAVF: number) =>
  (Math.atan2(leadAVF, leadI) * 180) / Math.PI;

const ECGMeasurementsPanel = ({ servicesManager }) => {
  const [measurements, setMeasurements] = useState([]);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [baselineMetrics, setBaselineMetrics] = useState(null);

  const { measurementService } = servicesManager.services;

  useEffect(() => {
    // Listen for tools drawing & real-time modification
    const addedSub = measurementService.subscribe(measurementService.EVENTS.MEASUREMENT_ADDED, () =>
      updateMeasurements()
    );
    const updatedSub = measurementService.subscribe(
      measurementService.EVENTS.MEASUREMENT_UPDATED,
      () => updateMeasurements()
    );
    const clearedSub = measurementService.subscribe(
      measurementService.EVENTS.MEASUREMENTS_CLEARED,
      () => setMeasurements([])
    );

    // Initial load
    updateMeasurements();

    return () => {
      addedSub.unsubscribe();
      updatedSub.unsubscribe();
      clearedSub.unsubscribe();
    };
  }, [measurementService]);

  const updateMeasurements = () => {
    const allMeasurements = measurementService.getMeasurements();
    setMeasurements([...allMeasurements]);
  };

  const handleSetBaseline = () => {
    setBaselineMetrics(aggregateMetrics());
    setComparisonMode(true);
  };

  const aggregateMetrics = () => {
    let rrMs = 800; // default for calculation if missing
    let qtMs = 400;

    // Sample aggregation, matching tool types to values
    // In OHIF, toolType dictates the measurement (e.g. Length, Bidirectional)
    measurements.forEach(m => {
      if (m.toolName === 'Bidirectional' || m.label?.includes('RR')) {
        rrMs = m.length || m.text || 800; // Assuming value derived from line length
      }
      if (m.toolName === 'ArrowAnnotate' || m.label?.includes('QT')) {
        qtMs = m.length || 400;
      }
    });

    const hr = Math.round(calculateHeartRate(rrMs));
    const qtc = Math.round(calculateQTcBazett(qtMs, rrMs));
    const axis = Math.round(calculateQRSAxis(1, 1)); // Replace with real Lead vectors if tracked

    return { rrMs, qtMs, hr, qtc, axis };
  };

  const currentMetrics = aggregateMetrics();

  return (
    <div
      style={{
        padding: '15px',
        color: '#fff',
        fontSize: '14px',
        background: '#090c14',
        height: '100%',
        overflowY: 'auto',
      }}
    >
      <h2
        style={{
          fontSize: '18px',
          marginBottom: '15px',
          borderBottom: '1px solid #3a3f58',
          paddingBottom: '10px',
        }}
      >
        Advanced ECG Tools
      </h2>

      {/* Real-time calculated diagnostics */}
      <div
        style={{
          marginBottom: '20px',
          background: '#151a2f',
          padding: '10px',
          borderRadius: '5px',
        }}
      >
        <h3 style={{ fontSize: '15px', color: '#4facfe' }}>Calculated Metrics</h3>
        <p>
          <strong>Heart Rate (BPM):</strong> {currentMetrics.hr} bpm
        </p>
        <p>
          <strong>QTc (Bazett's):</strong> {currentMetrics.qtc} ms{' '}
          {currentMetrics.qtc > 440 && <span style={{ color: 'red' }}>(Prolonged)</span>}
        </p>
        <p>
          <strong>QRS Axis:</strong> {currentMetrics.axis}°
        </p>
      </div>

      {/* Raw Measurements Interactive Feedback */}
      <h3 style={{ fontSize: '15px', color: '#4facfe', marginTop: '15px' }}>
        Raw Tools Data ({measurements.length})
      </h3>
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        {measurements.map((m, idx) => (
          <li
            key={m.uid || idx}
            style={{ borderBottom: '1px solid #2a2f4c', padding: '5px 0' }}
          >
            <span>{m.toolName}: </span>
            <span style={{ color: '#00e676' }}>
              {/* Display area/length variance automatically parsed by OHIF core */}
              {m.text || m.displayText || 'Updating...'}
            </span>
          </li>
        ))}
      </ul>

      {/* Studies Comparison Workflow */}
      <h3 style={{ fontSize: '15px', color: '#4facfe', marginTop: '25px' }}>Studies Comparison</h3>
      {!comparisonMode ? (
        <button
          onClick={handleSetBaseline}
          style={{
            background: '#4facfe',
            color: '#fff',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          Set Current as Baseline
        </button>
      ) : (
        <div style={{ marginTop: '10px' }}>
          <p>
            <strong>Baseline HR:</strong> {baselineMetrics.hr} bpm
          </p>
          <p>
            <strong>Current HR:</strong> {currentMetrics.hr} bpm{' '}
          </p>
          {Math.abs(currentMetrics.hr - baselineMetrics.hr) > 10 && (
            <p style={{ color: 'orange' }}>Noticeable HR Variance Detected</p>
          )}
          <button
            onClick={() => setComparisonMode(false)}
            style={{
              background: '#e53935',
              color: '#fff',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              width: '100%',
              marginTop: '10px',
            }}
          >
            Clear Baseline
          </button>
        </div>
      )}
    </div>
  );
};

export default ECGMeasurementsPanel;
