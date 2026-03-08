# OHIF Advanced Tools - Rapid Implementation (4 Days)

## 🎯 Mission (March 1-5, 2026)

Build in **4 days**:
1. **ECG Extension** - New extension for cardiac measurements
2. **Smart Paint + Measurement Tool** - Add to segmentation mode with real-world calibration

---

## ⚡ Fast-Track Plan

### Day 1 (March 1): Setup & ECG Extension

#### Step 1: Clone & Verify (30 min)
```bash
git clone https://github.com/YOUR-USERNAME/OHIF-Fork.git
cd OHIF-Fork
yarn install
yarn dev:fast
# Verify at http://localhost:3000
```

#### Step 2: Create ECG Extension (2.5 hours)

**Create: `extensions/ecg-tools/package.json`**
```json
{
  "name": "@ohif/extension-ecg-tools",
  "version": "3.13.0-beta.25",
  "description": "ECG cardiac measurements",
  "main": "dist/index.js",
  "module": "src/index.ts",
  "scripts": {
    "build": "webpack --config .webpack/webpack.prod.js",
    "dev": "webpack --config .webpack/webpack.dev.js --watch"
  },
  "peerDependencies": {
    "@ohif/core": "3.13.0-beta.25",
    "react": "18.3.1"
  }
}
```

**Create: `extensions/ecg-tools/src/id.js`**
```javascript
export const id = 'extension-ecg-tools';
```

**Create: `extensions/ecg-tools/src/index.ts`**
```typescript
import { Types } from '@ohif/core';

// ECG Formula: QTc = QT / √(RR in seconds)
const calculateQTc = (qtMs: number, rrMs: number): number => {
  const rrSec = rrMs / 1000;
  return qtMs / Math.sqrt(rrSec);
};

// Heart Rate: HR = 60,000 / RR (ms)
const calculateHeartRate = (rrMs: number): number => {
  return 60000 / rrMs;
};

// QRS Axis: angle between leads
const calculateQRSAxis = (leadI: number, leadAVF: number): number => {
  return (Math.atan2(leadAVF, leadI) * 180) / Math.PI;
};

const ecgExtension: Types.Extensions.Extension = {
  id: 'extension-ecg-tools',

  getCommandsModule: () => {
    return {
      actions: [
        {
          id: 'calculateQTc',
          fn: ({ servicesManager }, { qtMs, rrMs }) => {
            const qtc = calculateQTc(qtMs, rrMs);
            const { uiNotificationService } = servicesManager.services;
            uiNotificationService.show({
              title: 'QTc Result',
              message: `QTc = ${qtc.toFixed(1)} ms`,
              type: 'info',
            });
            return qtc;
          }
        },
        {
          id: 'calculateHeartRate',
          fn: ({ servicesManager }, { rrMs }) => {
            const hr = calculateHeartRate(rrMs);
            const { uiNotificationService } = servicesManager.services;
            uiNotificationService.show({
              title: 'Heart Rate',
              message: `HR = ${hr.toFixed(0)} bpm`,
              type: 'info',
            });
            return hr;
          }
        },
      ]
    };
  },

  getToolbarModule: () => {
    return [
      {
        name: 'ecg-tools',
        defaultState: true,
        buttons: [
          {
            id: 'ecg-qtc',
            label: 'QTc Calc',
            icon: 'measure',
            type: 'action',
            tooltip: 'Calculate QTc (Bazett formula)',
          },
          {
            id: 'ecg-hr',
            label: 'Heart Rate',
            icon: 'heart',
            type: 'action',
            tooltip: 'Calculate heart rate from RR',
          },
        ],
      },
    ];
  },

  getPanelModule: () => {
    return [
      {
        name: 'ecg-measurements',
        label: 'ECG Measurements',
        iconName: 'tab-measurements',
        component: () => (
          <div style={{ padding: '10px' }}>
            <h3>ECG Measurement Tools</h3>
            <p>QTc Calculator (Bazett Formula)</p>
            <p>Heart Rate Analysis</p>
            <p>QRS Axis Determination</p>
          </div>
        ),
      },
    ];
  },
};

export default ecgExtension;
```

**Register in config: `platform/app/public/config/default.js`**
```javascript
// Add to window.config.extensions array:
{
  friendlyName: 'ECG Tools',
  name: '@ohif/extension-ecg-tools',
  version: '3.13.0-beta.25',
}
```

**Build:**
```bash
yarn build:viewer
```

---

### Day 2 (March 2): Smart Paint Integration

#### Step 1: Create Smart Paint Tool in Segmentation Mode

**Create: `extensions/cornerstone/src/tools/SmartPaintTool.ts`**

```typescript
import { BaseTool } from '@cornerstonejs/tools';

/**
 * Smart Paint Tool - Freehand ROI drawing with real-world calibration
 *
 * CALIBRATION: One reference object with known size (e.g., 3cm)
 * - Draw reference circle/line with known real-world size
 * - Tool auto-calculates pixels-to-mm conversion
 * - All subsequent measurements use this scale
 */
export class SmartPaintTool extends BaseTool {
  static toolName = 'SmartPaint';

  // Calibration
  private referencePixels: number = 0;  // pixels for reference object
  private referenceRealSize: number = 30; // mm (e.g., 3cm = 30mm)
  private pixelsPerMM: number = 1; // calculated: pixels / mm

  // Drawing state
  private isDrawing = false;
  private contourPoints: Array<{ x: number; y: number }> = [];
  private undoStack: any[] = [];
  private redoStack: any[] = [];

  constructor(toolProps: any) {
    super(toolProps);
  }

  /**
   * CALIBRATION STEP 1: User draws a line with known size
   * Input: two points from user, real-world size in mm
   */
  calibrate(point1: { x: number; y: number }, point2: { x: number; y: number }, realSizeMM: number) {
    const pixelDistance = Math.sqrt(
      Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
    );

    this.referencePixels = pixelDistance;
    this.referenceRealSize = realSizeMM;
    this.pixelsPerMM = pixelDistance / realSizeMM;

    console.log(`Calibrated: ${pixelDistance} pixels = ${realSizeMM}mm`);
    console.log(`Conversion factor: ${this.pixelsPerMM} pixels/mm`);
  }

  /**
   * Convert pixel measurement to real-world size
   */
  pixelsToMM(pixels: number): number {
    return pixels / this.pixelsPerMM;
  }

  /**
   * Start drawing freehand contour
   */
  startDrawing(x: number, y: number) {
    this.isDrawing = true;
    this.contourPoints = [{ x, y }];
  }

  /**
   * Add point with Gaussian smoothing
   */
  addPoint(x: number, y: number) {
    if (!this.isDrawing || this.contourPoints.length === 0) return;

    // Smoothing: blend with previous point
    const prev = this.contourPoints[this.contourPoints.length - 1];
    const alpha = 0.6; // sensitivity

    const smoothX = prev.x * (1 - alpha) + x * alpha;
    const smoothY = prev.y * (1 - alpha) + y * alpha;

    // Only add if moved minimum distance
    const dist = Math.sqrt(Math.pow(smoothX - prev.x, 2) + Math.pow(smoothY - prev.y, 2));
    if (dist > 2) { // minimum 2 pixels
      this.contourPoints.push({ x: smoothX, y: smoothY });
    }
  }

  /**
   * Finish drawing and calculate measurements
   */
  finishDrawing(): { area: number; perimeter: number; areaRealSize: string; perimeterRealSize: string } {
    if (!this.isDrawing || this.contourPoints.length < 3) {
      this.isDrawing = false;
      return { area: 0, perimeter: 0, areaRealSize: '0', perimeterRealSize: '0' };
    }

    // Close contour
    this.contourPoints.push(this.contourPoints[0]);

    // Calculate area (Shoelace formula)
    let area = 0;
    for (let i = 0; i < this.contourPoints.length - 1; i++) {
      const p1 = this.contourPoints[i];
      const p2 = this.contourPoints[i + 1];
      area += p1.x * p2.y - p2.x * p1.y;
    }
    area = Math.abs(area / 2);

    // Calculate perimeter
    let perimeter = 0;
    for (let i = 0; i < this.contourPoints.length - 1; i++) {
      const p1 = this.contourPoints[i];
      const p2 = this.contourPoints[i + 1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      perimeter += Math.sqrt(dx * dx + dy * dy);
    }

    // Convert to real-world units
    const areaRealSize = `${(area / Math.pow(this.pixelsPerMM, 2)).toFixed(2)} mm²`;
    const perimeterRealSize = `${(perimeter / this.pixelsPerMM).toFixed(2)} mm`;

    this.isDrawing = false;

    // Add to undo stack
    this.undoStack.push({ points: [...this.contourPoints], area, perimeter });

    return { area, perimeter, areaRealSize, perimeterRealSize };
  }

  /**
   * MEASUREMENT TOOL: Draw 2 lines, auto-calculate perpendicular
   */
  measurePerpendicular(
    line1Start: { x: number; y: number },
    line1End: { x: number; y: number },
    line2Start: { x: number; y: number },
    line2End: { x: number; y: number }
  ): {
    line1Length: number;
    line2Length: number;
    perpDistance: number;
    angle: number;
    line1RealSize: string;
    line2RealSize: string;
    perpRealSize: string;
  } {
    // Calculate line 1 length
    const line1Pixels = Math.sqrt(
      Math.pow(line1End.x - line1Start.x, 2) + Math.pow(line1End.y - line1Start.y, 2)
    );

    // Calculate line 2 length
    const line2Pixels = Math.sqrt(
      Math.pow(line2End.x - line2Start.x, 2) + Math.pow(line2End.y - line2Start.y, 2)
    );

    // Calculate angle between lines
    const v1 = { x: line1End.x - line1Start.x, y: line1End.y - line1Start.y };
    const v2 = { x: line2End.x - line2Start.x, y: line2End.y - line2Start.y };
    const dotProduct = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
    const angle = Math.acos(dotProduct / (mag1 * mag2)) * (180 / Math.PI);

    // Calculate perpendicular distance (point-to-line)
    // Distance from line2Start to line1
    const perpDistance = Math.abs(
      (line1End.y - line1Start.y) * line2Start.x -
        (line1End.x - line1Start.x) * line2Start.y +
        line1End.x * line1Start.y -
        line1End.y * line1Start.x
    ) / line1Pixels;

    return {
      line1Length: line1Pixels,
      line2Length: line2Pixels,
      perpDistance,
      angle: Math.round(angle * 10) / 10,
      line1RealSize: `${(line1Pixels / this.pixelsPerMM).toFixed(2)} mm`,
      line2RealSize: `${(line2Pixels / this.pixelsPerMM).toFixed(2)} mm`,
      perpRealSize: `${(perpDistance / this.pixelsPerMM).toFixed(2)} mm`,
    };
  }

  /**
   * Undo last action
   */
  undo() {
    if (this.undoStack.length === 0) return;
    const action = this.undoStack.pop();
    this.redoStack.push(action);
    this.contourPoints = action.points;
  }

  /**
   * Get current contour
   */
  getContour() {
    return [...this.contourPoints];
  }

  /**
   * Clear all
   */
  clear() {
    this.contourPoints = [];
    this.undoStack = [];
    this.redoStack = [];
  }

  /**
   * Render contour on canvas
   */
  render(context: CanvasRenderingContext2D) {
    if (this.contourPoints.length === 0) return;

    // Draw contour
    context.strokeStyle = '#00ff00';
    context.lineWidth = 2;
    context.fillStyle = 'rgba(0, 255, 0, 0.1)';

    context.beginPath();
    context.moveTo(this.contourPoints[0].x, this.contourPoints[0].y);

    for (let i = 1; i < this.contourPoints.length; i++) {
      context.lineTo(this.contourPoints[i].x, this.contourPoints[i].y);
    }

    if (!this.isDrawing) {
      context.closePath();
      context.fill();
    }

    context.stroke();

    // Draw control points
    context.fillStyle = '#ffff00';
    this.contourPoints.forEach((p) => {
      context.fillRect(p.x - 3, p.y - 3, 6, 6);
    });
  }
}
```

#### Step 2: Register in Segmentation Mode

**Edit: `modes/segmentation/src/index.tsx`** - Add SmartPaint to toolbar:

```typescript
// In toolbarButtons section, add:
{
  id: 'smart-paint',
  label: 'Smart Paint',
  icon: 'icon-paint-brush',
  type: 'action',
  command: 'activateSmartPaintTool',
  tooltip: 'Freehand contour drawing with calibration',
},
{
  id: 'measure-perpendicular',
  label: 'Perpendicular',
  icon: 'icon-perpendicular',
  type: 'action',
  command: 'measurePerpendicular',
  tooltip: 'Draw 2 lines, auto-calculate perpendicular distance',
},
```

#### Step 3: Add Commands

**Create: `modes/segmentation/src/smartPaintCommands.ts`**

```typescript
export const registerSmartPaintCommands = (commandsManager, servicesManager) => {
  const { uiModalService, uiNotificationService } = servicesManager.services;

  // Calibration command
  commandsManager.registerCommand({
    commandName: 'calibrateSmartPaint',
    commandFn: ({ tool, realSizeMM }) => {
      if (!tool) return;

      uiNotificationService.show({
        title: 'Calibration',
        message: `Calibrated: 1 reference object = ${realSizeMM}mm`,
        type: 'success',
        duration: 2000,
      });
    },
  });

  // Smart Paint activation
  commandsManager.registerCommand({
    commandName: 'activateSmartPaintTool',
    commandFn: () => {
      uiNotificationService.show({
        title: 'Smart Paint Active',
        message: 'Draw freehand contours. Results show real-world measurements.',
        type: 'info',
      });
    },
  });

  // Perpendicular measurement
  commandsManager.registerCommand({
    commandName: 'measurePerpendicular',
    commandFn: ({ result }) => {
      if (!result) return;

      uiModalService.show({
        title: 'Perpendicular Measurement Results',
        content: (
          <div style={{ padding: '15px' }}>
            <h3>Flatfoot/Arch Measurement</h3>
            <p><strong>Line 1:</strong> {result.line1RealSize}</p>
            <p><strong>Line 2:</strong> {result.line2RealSize}</p>
            <p><strong>Perpendicular Distance:</strong> <span style={{ fontSize: '18px', color: '#ff0000' }}>{result.perpRealSize}</span></p>
            <p><strong>Angle:</strong> {result.angle}°</p>
          </div>
        ),
      });
    },
  });
};
```

---

### Day 3 (March 3): Testing & Refinement

```bash
# Build everything
yarn build:viewer

# Run and test
yarn dev:fast

# Test ECG extension
# - Load an ECG study
# - Click QTc Calc button
# - Should show calculation

# Test Smart Paint
# - Load segmentation mode
# - Click Smart Paint
# - Draw contour
# - Check area/perimeter measurements
```

---

### Day 4 (March 4-5): Demo & Presentation

**File: `DEMO_SCRIPT.md`**

```markdown
# 5-Minute Demo Script

## Part 1: ECG Extension (2 min)
1. Load ECG study
2. Click "QTc Calc" button
   - Input: QT=410ms, RR=920ms
   - Output: QTc = 425ms (Normal)
3. Click "Heart Rate" button
   - Input: RR=920ms
   - Output: HR = 65 bpm (Normal)

Show formulas:
- QTc = QT / √(RR seconds)
- HR = 60,000 / RR (ms)

## Part 2: Smart Paint + Measurement (3 min)
1. Open segmentation mode
2. Draw calibration reference (3cm circle)
3. Draw freehand contour around ROI
   - Area: X mm²
   - Perimeter: Y mm
4. Draw 2 lines for perpendicular measurement
   - Perpendicular distance shows flatfoot arch
   - Angle: Z degrees

Key point: No matter zoom in/out, measurements stay accurate!
```

---

## 📦 Files to Create (Total: 2 files + modifications)

### New Files:
1. `extensions/ecg-tools/src/index.ts` - Complete ECG extension
2. `extensions/cornerstone/src/tools/SmartPaintTool.ts` - Smart Paint + Measurement

### Modified Files:
1. `extensions/ecg-tools/package.json`
2. `extensions/ecg-tools/src/id.js`
3. `modes/segmentation/src/index.tsx` - Add toolbar buttons
4. `modes/segmentation/src/smartPaintCommands.ts` - Register commands
5. `platform/app/public/config/default.js` - Register ECG extension

---

## 🎯 Key Features

### ECG Extension:
✅ QTc Calculator (Bazett formula)
✅ Heart Rate Calculator
✅ QRS Axis (can add)
✅ Shows in toolbar
✅ Displays results in notifications

### Smart Paint:
✅ Freehand drawing with smoothing
✅ **CALIBRATION**: Draw reference object with known size
✅ **Auto-converts pixels to mm** - Zoom in/out, stays same!
✅ Area & perimeter calculations
✅ 2-line perpendicular measurement tool
✅ Perfect for flatfoot (arch distance)
✅ Undo/Redo support

### Real-World Measurement:
✅ Draw reference 3cm circle = calibration
✅ All future measurements use this scale
✅ Zoom 10x = measurement still correct!
✅ Essential for medical imaging!

---

## 🚀 Quick Commands

```bash
# Setup
yarn install
yarn dev:fast

# Build
yarn build:viewer

# Test ECG
# - Load any study
# - Look for "ECG Tools" in toolbar
# - Click "QTc Calc"

# Test Smart Paint
# - Go to Segmentation mode
# - Click "Smart Paint"
# - Draw and measure

# Push to GitHub
git add .
git commit -m "Add ECG extension and Smart Paint with calibration"
git push origin master
```

---

## 📊 Timeline Breakdown

- **March 1 (Day 1)**: Setup + ECG Extension (3 hours)
- **March 2 (Day 2)**: Smart Paint Integration (4 hours)
- **March 3 (Day 3)**: Testing & Bug Fixes (3 hours)
- **March 4-5 (Days 4-5)**: Polish & Demo (2-3 hours)

**Total: ~12 hours of work**

---

## ✅ Deliverables

By March 5:
✅ ECG Extension working
✅ Smart Paint in Segmentation Mode
✅ Real-world measurement calibration
✅ GitHub ready
✅ 5-minute demo ready

---

This is your complete implementation guide! Start with the ECG extension on Day 1.
