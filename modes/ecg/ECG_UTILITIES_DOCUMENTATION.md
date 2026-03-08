# ECG Measurement Utilities Documentation

## Overview

The ECG mode includes three comprehensive utility modules for electrocardiogram measurements, calculations, and comparative analysis:

1. **ecgCalculations.ts** - Core ECG formulas and calculations
2. **measurementHandler.ts** - Measurement tool event handlers and result processing
3. **studiesComparison.ts** - Multi-study comparison and trending analysis

## Module: ecgCalculations.ts

Core calculations following standard ECG interpretation guidelines.

### Heart Rate Calculation

```typescript
const heartRate = calculateHeartRate(rrInterval); // ms → bpm
// Formula: HR = 60,000 / RR(ms)
// Normal: 60-100 bpm
```

**Example:**
```typescript
const rrInterval = 1000; // 1 second
const hr = calculateHeartRate(rrInterval); // Returns 60 bpm
```

---

### QTc (Corrected QT Interval)

Three correction formulas available:

#### Bazett's Formula (Most Common)
```typescript
const qtc = calculateQTc_Bazett(qtInterval, rrInterval);
// Formula: QTc = QT / √(RR in seconds)
// Normal: Male < 440 ms, Female < 460 ms
```

**Use Case:** Primary formula for clinical use, standard in ECG analysis.

#### Fridericia's Formula (Better for Slow Rates)
```typescript
const qtc = calculateQTc_Fridericia(qtInterval, rrInterval);
// Formula: QTc = QT / ∛(RR in seconds)
```

**Use Case:** More accurate at heart rates < 60 bpm (bradycardia).

#### Framingham Formula (Research)
```typescript
const qtc = calculateQTc_Framingham(qtInterval, rrInterval);
// Formula: QTc = QT + 0.154 × (1 - RR in seconds)
```

**Use Case:** Linear correction for research and specialized applications.

**Interpretation:**
```typescript
const interpretation = interpretQTc(qtc, 'male'); // or 'female'
// Returns: "Normal QTc" | "Prolonged QTc" | "Significant prolongation"
```

**Clinical Significance:**
- **Prolonged QTc** → Risk of Torsades de Pointes arrhythmia
- **Shortened QTc** → Increased risk of arrhythmia, hypercalcemia
- **Normal QTc** → Low arrhythmia risk from prolongation

---

### QRS Electrical Axis

Calculate cardiac electrical axis from lead I and aVF:

```typescript
const axisMeasurement = calculateQRSAxis(lead1_deflection, leadAVF_deflection);
// Returns: QRSAxisMeasurement {
//   axis: number (degrees),
//   axisCategory: 'normal' | 'lad' | 'rad' | 'extreme'
// }
```

**Axis Categories:**

| Category | Range | Clinical Significance |
|----------|-------|----------------------|
| **Normal** | -30° to +90° | Normal conduction |
| **LAD** | < -30° | LVH, Inferior MI, Obesity, Pregnancy |
| **RAD** | > +90° | RVH, COPD, Lateral MI |
| **Extreme** | < -90° or > 180° | Lead reversal, Emphysema, CHD |

**Example:**
```typescript
const measurement = calculateQRSAxis(5, 3); // Lead I = 5mV, aVF = 3mV
console.log(measurement.axis); // e.g., 31°
console.log(measurement.axisCategory); // "normal"

const interpretation = interpretQRSAxis(measurement.axis);
// { interpretation: "Normal QRS Axis", clinicalSignificance: [...] }
```

---

### Interval Measurements (mV/s)

Convert pixel measurements to clinical values:

```typescript
const measurement = calculateIntervalMeasurement(
  pixelDistance,
  { timePixelsPerSecond: 150, amplitudePixelsPerMV: 60 },
  'time' // or 'amplitude'
);
```

**Calibration Standards:**
- **Time:** 25 mm/s paper speed = 150 pixels/second
- **Amplitude:** 10 mm/mV = 60 pixels/mV (standard)

**Measurement Types:**

| Interval | Duration (ms) | Amplitude (mV) | Clinical Use |
|----------|---------------|----------------|--------------|
| **PR** | 120-200 | — | AV conduction |
| **QRS** | 80-120 | — | Ventricular conduction |
| **QT** | 320-440 | — | Repolarization |
| **ST** | — | 0 ± 1 | MI, Ischemia detection |
| **RR** | 600-1000 | — | Heart rate calculation |

---

### QRS Area (LVH Assessment)

Calculate area of QRS complex for Left Ventricular Hypertrophy (LVH):

```typescript
const areaMeasurement = calculateQRSArea(
  width,  // pixels
  height, // pixels
  6       // calibration (pixels per mm)
);

// Returns: { value: 145, unit: 'mm²', ... }
// Normal: < 120 mm²
// LVH: > 120 mm²
```

---

### Measurement Validation

Ensure measurements are within physiological limits:

```typescript
const validation = validateMeasurement(measurement);

if (validation.isValid) {
  // Measurement acceptable
} else {
  console.warn(validation.reason);
  // "Interval measurement out of physiological range (0-2000 ms)"
}
```

---

### Display Formatting

Format measurements for UI display:

```typescript
const displayText = formatMeasurement(measurement);
// "150 ms" | "2.5 mV" | "45 degrees"
```

---

## Module: measurementHandler.ts

Process measurement tool events and calculate diagnostic values.

### ECGMeasurementHandler Class

**Initialization:**
```typescript
import { ECGMeasurementHandler, createMeasurementHandler } from './utils';

const handler = createMeasurementHandler();
```

**Setting Calibration:**
```typescript
handler.setCalibration({
  timePixelsPerSecond: 150,   // 25 mm/s paper speed
  amplitudePixelsPerMV: 60,   // Standard 10 mm/mV
  pixelsPerMM: 6
});
```

---

### Handling Tool Measurements

#### 1. Length Tool (Intervals: mV/s)

**Supports:**
- RR interval → Heart Rate calculation
- PR interval → AV conduction assessment
- QRS duration → Ventricular conduction
- QT interval → Repolarization assessment

**Handler:**
```typescript
const result = handler.handleLengthMeasurement(event);

// Returns: {
//   tool: 'Length',
//   measurements: [
//     { type: 'interval', value: 850, unit: 'ms', ... },
//     { type: 'rate', value: 71, unit: 'bpm', ... } // if RR interval
//   ],
//   interpretations: ["Normal HR"]
// }
```

---

#### 2. Bidirectional Tool (RR Interval / Heart Rate)

**Specialized for:**
- RR interval measurement
- Automatic heart rate calculation
- HR variability assessment

**Handler:**
```typescript
const result = handler.handleBidirectionalMeasurement(event);

// Returns: {
//   measurements: [
//     { type: 'interval', value: 850, unit: 'ms', rrInterval: 850, heartRate: 71, ... },
//     { type: 'rate', value: 71, unit: 'bpm', ... }
//   ],
//   interpretations: ["Normal HR"]
// }
```

---

#### 3. Angle Tool (QRS Axis)

**Measures:**
- Electrical axis angle
- Axis deviation classification

**Handler:**
```typescript
const result = handler.handleAngleMeasurement(event);

// Returns: {
//   measurements: [axisMeasurement],
//   interpretations: ["Normal QRS Axis"],
//   clinicalSignificance: ["Normal cardiac conduction"]
// }
```

---

#### 4. Arrow Annotate Tool (QT Interval with QTc)

**Measures:**
- QT interval
- Calculates QTc (requires RR interval)

**Handler:**
```typescript
const result = handler.handleArrowAnnotateMeasurement(
  event,
  rrInterval  // milliseconds (from previous RR measurement)
);

// Returns: {
//   measurements: [
//     { type: 'interval', value: 360, unit: 'ms', ... }, // QT
//     { type: 'qtc', value: 385, unit: 'ms', formulaUsed: 'bazett', ... } // QTc
//   ],
//   interpretations: ["Normal QTc"]
// }
```

---

#### 5. Elliptical ROI Tool (QRS Area)

**Measures:**
- QRS complex area for LVH assessment
- Voltage and duration combined metric

**Handler:**
```typescript
const result = handler.handleEllipticalROIMeasurement(event);

// Returns: {
//   measurements: [
//     { type: 'area', value: 145, unit: 'mm²', ... }
//   ],
//   interpretations: ["QRS area > 120 mm² - Suggests LVH"]
// }
```

---

#### 6. Rectangle ROI Tool (P Wave Analysis)

**Measures:**
- P wave duration (normal < 120 ms)
- P wave amplitude (normal < 0.25 mV)
- P wave morphology assessment

**Handler:**
```typescript
const result = handler.handleRectangleROIMeasurement(event);

// Returns: {
//   measurements: [
//     { type: 'interval', value: 100, unit: 'ms', ... }, // Duration
//     { type: 'interval', value: 0.18, unit: 'mV', ... } // Amplitude
//   ],
//   interpretations: [
//     "P wave duration normal",
//     "P wave amplitude normal"
//   ]
// }
```

---

#### 7. Circle ROI Tool (ST Segment Analysis)

**Measures:**
- ST elevation (> 1 mm = significant, suggests STEMI in 2+ leads)
- ST depression (suggests ischemia)
- ST segment slope changes

**Handler:**
```typescript
const result = handler.handleCircleROIMeasurement(event);

// Returns: {
//   measurements: [
//     { type: 'interval', value: 1.2, unit: 'mV', ... }
//   ],
//   interpretations: ["ST elevation: 1.20 mV"]
// }
```

---

### Accessing Measurements

```typescript
// Get all measurements
const allMeasurements = handler.getAllMeasurements(); // Map

// Get all results
const allResults = handler.getAllResults(); // Map

// Format result for display
const displayText = handler.formatResult(result);

// Clear all measurements
handler.clearMeasurements();
```

---

## Module: studiesComparison.ts

Compare multiple ECG studies over time, track changes, and assess clinical significance.

### StudiesComparison Class

**Initialization:**
```typescript
import { StudiesComparison, createStudiesComparison } from './utils';

const comparison = createStudiesComparison();
```

---

### Adding Studies

```typescript
const study1: ECGStudy = {
  id: 'ecg-001',
  seriesInstanceUID: '1.2.3.4.5',
  timestamp: new Date('2024-01-15'),
  patientName: 'John Doe',
  description: 'Baseline ECG',
  measurements: measurementMap
};

const study2: ECGStudy = {
  id: 'ecg-002',
  seriesInstanceUID: '1.2.3.4.6',
  timestamp: new Date('2024-01-22'),
  patientName: 'John Doe',
  description: 'Follow-up ECG - Post-treatment',
  measurements: measurementMap
};

comparison.addStudy(study1);
comparison.addStudy(study2);
comparison.setBaselineStudy('ecg-001');
```

---

### Comparing Studies

```typescript
// Enable side-by-side comparison mode
comparison.enableComparisonMode();

// Compare current study with baseline
const result = comparison.compareStudies('ecg-002');

// Result includes:
// - Measurement differences (value, % change, significance)
// - Clinical change assessments
// - Recommended actions based on changes
```

**Comparison Result Structure:**
```typescript
{
  baseline: ECGStudy,
  current: ECGStudy,
  differences: [
    {
      measurementType: 'HR',
      baselineValue: 72,
      currentValue: 88,
      difference: 16,
      percentChange: 22.2,
      significance: 'moderate'
    },
    // ... more measurements
  ],
  clinicalChangesSuggested: [
    "HR moderately ↑ (+16 or 22.2%)",
    "⚠️ New tachycardia detected"
  ]
}
```

---

### Significance Assessment

Automatic detection of clinically significant changes:

| Measurement | Normal (<) | Mild | Moderate | Significant |
|------------|----------|------|----------|------------|
| **HR** | 5% | 15% | 25% | >25% |
| **QTc** | 3% | 8% | 15% | >15% |
| **Axis** | 5° | 15° | 30° | >30° |

**Clinical Flags:**
- ⚠️ New bradycardia (HR < 60, was ≥ 60)
- ⚠️ New tachycardia (HR > 100, was ≤ 100)
- ⚠️ QTc prolongation (> 440 ms, was ≤ 440 ms)
- ⚠️ New Left Axis Deviation (< -30°)
- ⚠️ New Right Axis Deviation (> +90°)

---

### Time Series Comparison

Track changes over multiple studies:

```typescript
// Create chronologically sorted study list
const timeSeries = comparison.createTimeSeriesComparison();

// Analyze progression
timeSeries.forEach((study, index) => {
  if (index > 0) {
    const result = comparison.compareStudies(study.id);
    // Process trending data
  }
});
```

---

### Generating Reports

```typescript
const report = comparison.generateComparisonReport(comparisonResult);
console.log(report);

// Output example:
// === ECG COMPARISON REPORT ===
//
// BASELINE:
//   Study: Baseline ECG
//   Date: 1/15/2024
//   Patient: John Doe
//
// CURRENT:
//   Study: Follow-up ECG - Post-treatment
//   Date: 1/22/2024
//   Patient: John Doe
//
// MEASUREMENTS COMPARISON:
//   HR: 72.00 → 88.00 (+16.00, 22.2%) [moderate]
//   QTc: 410.00 → 425.00 (+15.00, 3.7%) [normal]
//
// CLINICAL OBSERVATIONS:
//   • HR moderately ↑ (+16 or 22.2%)
//   • ⚠️ New tachycardia detected
```

---

### Study Management

```typescript
// Get all studies
const allStudies = comparison.getAllStudies();

// Get specific study
const study = comparison.getStudy('ecg-001');

// Get baseline study
const baseline = comparison.getBaselineStudy();

// Disable comparison mode
comparison.disableComparisonMode();

// Clear all studies
comparison.clearStudies();
```

---

## Practical Examples

### Example 1: Complete Measurement Workflow

```typescript
import {
  ECGMeasurementHandler,
  calculateHeartRate,
  calculateQTc_Bazett
} from './utils';

// Initialize handler
const handler = new ECGMeasurementHandler();

// User draws RR interval with Length tool
const rrEvent = {
  toolName: 'Length',
  toolData: {
    handles: { start: { x: 100, y: 200 }, end: { x: 250, y: 200 } },
    label: 'RR Interval'
  },
  viewportId: 'ecg-viewport'
};

const rrResult = handler.handleLengthMeasurement(rrEvent);
const rrInterval = rrResult.measurements[0].value; // e.g., 850 ms
const hr = rrResult.measurements[1].value; // e.g., 71 bpm

// User draws QT interval with Arrow tool
const qtEvent = {
  toolName: 'ArrowAnnotate',
  toolData: {
    handles: { start: { x: 300, y: 100 }, end: { x: 450, y: 100 } }
  },
  viewportId: 'ecg-viewport'
};

const qtResult = handler.handleArrowAnnotateMeasurement(qtEvent, rrInterval);
// Now has both QT (360 ms) and QTc (385 ms) calculated

console.log(handler.formatResult(rrResult));
// "Length:
//    850 ms
//    71 bpm
//    Interpretation: Normal HR"

console.log(handler.formatResult(qtResult));
// "ArrowAnnotate:
//    360 ms
//    385 ms
//    Interpretation: Normal QTc"
```

---

### Example 2: Multi-Study Comparison

```typescript
import { StudiesComparison } from './utils';

const comparison = new StudiesComparison();

// Add baseline (old) study
comparison.addStudy({
  id: 'baseline',
  seriesInstanceUID: '1.2.3',
  timestamp: new Date('2023-12-01'),
  patientName: 'Patient A',
  description: '2023 Baseline',
  measurements: new Map([
    ['HR', [{ type: 'rate', value: 72, unit: 'bpm' }]],
    ['QTc', [{ type: 'qtc', value: 410, unit: 'ms', qtc: 410 }]]
  ])
});

// Add current (new) study
comparison.addStudy({
  id: 'current',
  seriesInstanceUID: '1.2.4',
  timestamp: new Date('2024-01-15'),
  patientName: 'Patient A',
  description: '2024 Follow-up',
  measurements: new Map([
    ['HR', [{ type: 'rate', value: 88, unit: 'bpm' }]],
    ['QTc', [{ type: 'qtc', value: 435, unit: 'ms', qtc: 435 }]]
  ])
});

// Set baseline and enable comparison
comparison.setBaselineStudy('baseline');
comparison.enableComparisonMode();

// Compare
const result = comparison.compareStudies('current');

// Check for clinical significance
result.clinicalChangesSuggested.forEach(change => {
  console.log(change);
  // "HR moderately ↑ (+16 or 22.2%)"
  // "⚠️ New tachycardia detected"
  // "QTc mildly ↑ (+25 or 6.1%)"
});
```

---

## Integration with ECG Mode

These utilities are integrated into the ECG mode's lifecycle:

### Initialization (index.tsx)
```typescript
import { createMeasurementHandler } from './utils';

const handler = createMeasurementHandler();
// Used in measurement event handlers
```

### Toolbar Buttons (toolbarButtons.tsx)
```typescript
// All measurement tools trigger handler functions
// Tool measurements → handler.handleXMeasurement() → Results
```

### Workflow Management (getWorkflowSettings.ts)
```typescript
// Workflow steps control which tools are available
// Tool results populate measurement panel
```

---

## Code Standards Compliance

All utilities follow OHIF code standards:

✅ **TypeScript:** Full type safety with interfaces
✅ **Documentation:** Comprehensive JSDoc comments
✅ **Modularity:** Separate concerns in three modules
✅ **Testability:** Pure functions and class methods
✅ **Performance:** Efficient calculations, no unnecessary iterations
✅ **Accessibility:** Formulas follow clinical ECG guidelines
✅ **Maintainability:** Clear naming and structured code

---

## References

- **ECG Interpretation:** Standard 12-lead ECG analysis guidelines
- **QTc Formulas:** Bazett (1920), Fridericia (1920), Framingham (1998)
- **QRS Axis:** Cleveland Clinic Foundation guidelines
- **Normal Ranges:** American Heart Association standards

---

## Version History

- **v1.0.0** - Initial ECG utilities implementation
  - Core calculations module (Heart Rate, QTc, QRS Axis, Intervals, Area)
  - Measurement handler for all ECG tools
  - Studies comparison with trending analysis
