# ECG Mode - Measurement Tools Guide

## Overview
The ECG mode provides specialized measurement tools for electrocardiogram analysis. Each tool is mapped to specific ECG measurements and analysis tasks.

---

## Available Measurement Tools

### 1. **Interval (mV/s)** - `tool-length` Icon 📏
**Tool:** Length
**Purpose:** Measure time intervals (seconds) and voltage (millivolts) on ECG waveforms
**Use Cases:**
- Measure PR interval (P wave onset to QRS onset)
- Measure QRS duration (start to end of QRS complex)
- Measure ST segment duration
- Measure T wave amplitude/duration
- Calculate voltage measurements for diagnostic criteria

**How to use:**
1. Click "Interval (mV/s)" button
2. Click-drag from point 1 to point 2 on the ECG waveform
3. Result shows distance in mm and time/voltage equivalents

---

### 2. **RR Interval** - `tool-bidirectional` Icon 📊
**Tool:** Bidirectional
**Purpose:** Measure RR interval for heart rate calculation and rhythm analysis
**Use Cases:**
- Calculate heart rate: HR = 60,000 / RR interval (ms)
- Assess rhythm regularity
- Detect arrhythmias
- Calculate HR variability

**How to use:**
1. Click "RR Interval" button
2. Click on R wave peak of first beat
3. Click on R wave peak of next beat
4. Bidirectional measurement shows interval and calculated HR

---

### 3. **QT Interval** - `tool-annotate` Icon 📝
**Tool:** Arrow Annotate
**Purpose:** Mark and annotate QT interval (onset Q wave to end T wave)
**Use Cases:**
- Mark QT interval for measurement
- Calculate QTc (corrected QT) using Bazett's formula: QTc = QT / √RR
- Identify prolonged QT syndrome
- Add clinical notes/observations

**How to use:**
1. Click "QT Interval" button
2. Click at Q wave onset point on waveform
3. Drag arrow to T wave end point
4. Add annotations with clinical notes

---

### 4. **QRS Area** - `tool-measure-ellipse` Icon ⭕
**Tool:** Elliptical ROI
**Purpose:** Calculate area and amplitude of QRS complex
**Use Cases:**
- Measure QRS amplitude
- Calculate QRS area for diagnostic criteria
- Assess left ventricular hypertrophy (LVH)
- Identify low voltage patterns

**How to use:**
1. Click "QRS Area" button
2. Draw ellipse around QRS complex
3. Area and dimensions are calculated automatically

---

### 5. **P Wave** - `tool-rectangle` Icon ◻️
**Tool:** Rectangle ROI
**Purpose:** Measure P wave duration and amplitude
**Use Cases:**
- Measure P wave duration (normal 0.08-0.12 seconds)
- Measure P wave amplitude
- Identify peaked P waves (pulmonary hypertension)
- Assess atrial enlargement

**How to use:**
1. Click "P Wave" button
2. Draw rectangle around P wave
3. Area, width, and height displayed

---

### 6. **ST Segment** - `tool-circle` Icon ⭕
**Tool:** Circle ROI
**Purpose:** Measure ST segment elevation/depression
**Use Cases:**
- Measure ST elevation (MI, pericarditis)
- Measure ST depression (ischemia)
- Assess ST segment slope
- Identify ST changes for acute coronary syndrome

**How to use:**
1. Click "ST Segment" button
2. Draw circle at J point and ST level
3. Elevation/depression measured in mm

---

### 7. **QRS Axis** - `tool-angle` Icon ∠
**Tool:** Angle
**Purpose:** Calculate QRS electrical axis using angle measurement
**Use Cases:**
- Calculate QRS axis (normal -30° to +90°)
- Identify axis deviation
- Left axis deviation (LAD): < -30°
- Right axis deviation (RAD): > +90°
- Detect conduction abnormalities
- Diagnose arrhythmias

**How to use:**
1. Click "QRS Axis" button
2. Click at first vector point (typically I lead)
3. Click at second vector point (typically aVF lead)
4. Angle calculated and displayed

**Formula for manual QRS Axis:**
- Find most biphasic lead (closest to 0°)
- Perpendicular lead shows the axis
- Normal range: -30° to +90°

---

### 8. **Zoom** - `tool-zoom` Icon 🔍
**Tool:** Zoom
**Purpose:** Zoom in/out for detailed waveform analysis
**Use Cases:**
- Magnify specific segments
- Better visualization of small waveforms
- Precise point identification
- Detailed ST segment analysis

**How to use:**
1. Click "Zoom" button
2. Click to zoom in, right-click to zoom out
3. Scroll wheel to adjust zoom level

---

### 9. **Brightness** - `tool-window-level` Icon 🌡️
**Tool:** Window Level
**Purpose:** Adjust brightness and contrast for better visualization
**Use Cases:**
- Improve visibility of faint waveforms
- Enhance low-amplitude signals
- Optimize display for different ECG quality levels
- Better visualization of artifact areas

**How to use:**
1. Click "Brightness" button
2. Click and drag horizontally to adjust brightness
3. Click and drag vertically to adjust contrast

---

## ECG Measurement Quick Reference

| Measurement | Normal Range | Tool | Interpretation |
|-------------|--------------|------|-----------------|
| PR Interval | 120-200 ms | Interval (mV/s) | <120ms: Short PR; >200ms: Long PR |
| QRS Duration | <120 ms | Interval (mV/s) | ≥120ms: Wide QRS/BBB |
| QT Interval | 400-450 ms (male), 400-460 ms (female) | QT Interval | Prolonged: Drug effects, Electrolyte |
| QTc (corrected) | <440 ms (male), <460 ms (female) | QT Interval | Formula: QT/√RR |
| ST Segment | 0 ± 1 mm | ST Segment | Elevation or Depression |
| Heart Rate | 60-100 bpm | RR Interval | HR = 60,000/RR(ms) |
| QRS Axis | -30° to +90° | QRS Axis | LAD: <-30°, RAD: >+90° |
| P Wave | 0.08-0.12 s | P Wave | Duration for atrial rate |
| T Wave | Variable | Interval/Area | Amplitude and morphology |

---

## ECG Analysis Workflow

1. **Initial Assessment**
   - Load ECG image
   - Use Zoom for overview
   - Adjust Brightness if needed

2. **Interval Measurements**
   - Measure PR interval (Interval tool)
   - Measure QRS duration (Interval tool)
   - Measure QT interval (QT Interval tool)

3. **Rate & Rhythm**
   - Measure RR interval (RR Interval tool)
   - Calculate heart rate
   - Assess regularity

4. **Axis Determination**
   - Use QRS Axis tool (Angle)
   - Identify axis deviation

5. **Segment Analysis**
   - Measure ST elevation/depression (ST Segment tool)
   - Assess P wave (P Wave tool)
   - Analyze QRS complex (QRS Area tool)

6. **Clinical Annotation**
   - Use QT Interval tool for notes
   - Document findings
   - Add clinical observations

---

## Common ECG Measurements Performed

- ✅ Rhythm & Rate Analysis
- ✅ Interval Measurements (PR, QRS, QT, RR)
- ✅ ST Segment Elevation/Depression
- ✅ Axis Determination
- ✅ Hypertrophy Assessment
- ✅ Ischemia Detection
- ✅ Arrhythmia Identification
- ✅ QTc Calculation (Bazett's formula)
- ✅ Clinical Annotations

---

## Tips for Accurate Measurements

1. **Calibration:** Ensure proper ECG scale (typically 10 mm = 1 mV, 25 mm/s)
2. **Baseline:** Use paper baseline for ST segment measurements
3. **Grid Lines:** Count small squares (5 mm/0.2 s)
4. **Multiple Leads:** Compare measurements across leads
5. **Zoom:** Use zoom tool for precise point identification
6. **Brightness:** Adjust for optimal visibility before measuring
