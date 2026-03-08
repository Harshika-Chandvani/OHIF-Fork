/**
 * ECG Measurement Event Handler Module
 *
 * Handles drawing events from measurement tools and triggers calculations
 * Integrates with Cornerstone.js tools to capture measurement data
 * Supports real-time updates and measurement result formatting
 */

import { ECGMeasurement, RRIntervalMeasurement, QTMeasurement } from './ecgCalculations';
import {
  calculateHeartRate,
  calculateQTc_Bazett,
  calculateQRSAxis,
  calculateQRSArea,
  calculateIntervalMeasurement,
  formatMeasurement,
  interpretQTc,
  interpretQRSAxis,
  validateMeasurement,
} from './ecgCalculations';

/**
 * Measurement Handler Interfaces
 */
export interface MeasurementResult {
  tool: string;
  measurements: ECGMeasurement[];
  interpretations?: string[];
  clinicalSignificance?: string[];
  timestamp: number;
}

export interface MeasurementEventData {
  toolName: string;
  toolData: Record<string, any>;
  viewportId: string;
  seriesInstanceUID?: string;
  imageId?: string;
}

/**
 * Measurement Event Handler
 *
 * Processes tool measurements and calculates diagnostic values
 */
export class ECGMeasurementHandler {
  private measurements: Map<string, ECGMeasurement[]> = new Map();
  private results: Map<string, MeasurementResult> = new Map();
  private calibration: {
    timePixelsPerSecond: number;
    amplitudePixelsPerMV: number;
    pixelsPerMM: number;
  } = {
    timePixelsPerSecond: 150, // 25 mm/s at 6 pixels/mm = 150 pixels/second
    amplitudePixelsPerMV: 60, // Standard 10 mm/mV = 60 pixels/mV
    pixelsPerMM: 6, // Standard display calibration
  };

  /**
   * Handle Length Tool Measurement (Time/Amplitude Intervals)
   *
   * Supports:
   * - RR interval (for HR calculation)
   * - PR interval
   * - QRS duration
   * - QT interval
   * - ST segment duration
   *
   * @param event - Measurement event from tool
   * @returns Array of calculated measurements
   */
  handleLengthMeasurement(event: MeasurementEventData): MeasurementResult {
    const { toolData, toolName } = event;
    const measurements: ECGMeasurement[] = [];

    // Extract measurement data
    const startHandle = toolData.handles?.start;
    const endHandle = toolData.handles?.end;

    if (!startHandle || !endHandle) {
      console.warn('Invalid length measurement - missing handles');
      return { tool: toolName, measurements, timestamp: Date.now() };
    }

    // Calculate pixel distances
    const xDistance = Math.abs(endHandle.x - startHandle.x);
    const yDistance = Math.abs(endHandle.y - startHandle.y);
    const totalDistance = Math.sqrt(xDistance * xDistance + yDistance * yDistance);

    // Determine measurement type based on context (you can enhance this)
    // For now, assume horizontal distance = time, vertical = amplitude

    // Time measurement
    if (xDistance > yDistance) {
      const timeMeasurement = calculateIntervalMeasurement(
        xDistance,
        {
          timePixelsPerSecond: this.calibration.timePixelsPerSecond,
        },
        'time'
      );
      measurements.push(timeMeasurement);

      // If this is RR interval, calculate heart rate
      if (toolData.label?.includes('RR') || toolData.description?.includes('RR')) {
        const hrValue = calculateHeartRate(timeMeasurement.value);
        measurements.push({
          id: `hr-${Date.now()}`,
          type: 'rate',
          value: hrValue,
          unit: 'bpm',
          timestamp: Date.now(),
          reference: {
            min: 60,
            max: 100,
            normal: 'Normal heart rate: 60-100 bpm',
          },
        });
      }
    } else {
      // Amplitude measurement
      const ampMeasurement = calculateIntervalMeasurement(
        yDistance,
        {
          amplitudePixelsPerMV: this.calibration.amplitudePixelsPerMV,
        },
        'amplitude'
      );
      measurements.push(ampMeasurement);
    }

    const result: MeasurementResult = {
      tool: toolName,
      measurements,
      timestamp: Date.now(),
    };

    this.results.set(`${toolName}-${Date.now()}`, result);
    return result;
  }

  /**
   * Handle Bidirectional Tool (RR Interval / Heart Rate)
   *
   * Bidirectional is perfect for measuring RR intervals and calculating HR
   *
   * @param event - Measurement event from tool
   * @returns Measurement result with RR interval and HR
   */
  handleBidirectionalMeasurement(event: MeasurementEventData): MeasurementResult {
    const { toolData, toolName } = event;
    const measurements: ECGMeasurement[] = [];

    const handles = toolData.handles;
    if (!handles || !Array.isArray(handles) || handles.length < 2) {
      console.warn('Invalid bidirectional measurement');
      return { tool: toolName, measurements, timestamp: Date.now() };
    }

    // Get horizontal distance (time)
    const xDistance = Math.abs(handles[1].x - handles[0].x);

    // Calculate RR interval in milliseconds
    const rrInternal = calculateIntervalMeasurement(
      xDistance,
      { timePixelsPerSecond: this.calibration.timePixelsPerSecond },
      'time'
    );

    const rrValue = rrInternal.value; // in milliseconds
    const hrValue = calculateHeartRate(rrValue);

    const rrMeasurement: RRIntervalMeasurement = {
      id: `rr-${Date.now()}`,
      type: 'interval',
      value: rrValue,
      unit: 'ms',
      timestamp: Date.now(),
      rrInterval: rrValue,
      heartRate: hrValue,
      reference: {
        min: 600,
        max: 1000,
        normal: 'Normal RR interval: 600-1000 ms (60-100 bpm)',
      },
    };

    measurements.push(rrMeasurement);
    measurements.push({
      id: `hr-${Date.now()}`,
      type: 'rate',
      value: hrValue,
      unit: 'bpm',
      timestamp: Date.now(),
      reference: {
        min: 60,
        max: 100,
        normal: 'Normal heart rate: 60-100 bpm',
      },
    });

    const result: MeasurementResult = {
      tool: toolName,
      measurements,
      timestamp: Date.now(),
      interpretations: [hrValue < 60 ? 'Bradycardia' : hrValue > 100 ? 'Tachycardia' : 'Normal HR'],
    };

    this.results.set(`${toolName}-${Date.now()}`, result);
    return result;
  }

  /**
   * Handle Angle Tool (QRS Axis Calculation)
   *
   * Used to measure the angle between lead I and lead aVF
   * for calculating the QRS electrical axis
   *
   * @param event - Measurement event from tool
   * @returns QRS axis measurement and interpretation
   */
  handleAngleMeasurement(event: MeasurementEventData): MeasurementResult {
    const { toolData, toolName } = event;
    const measurements: ECGMeasurement[] = [];

    // Get angle value directly from tool
    const angle = toolData.angle || toolData.value;

    if (angle === undefined) {
      console.warn('Invalid angle measurement');
      return { tool: toolName, measurements, timestamp: Date.now() };
    }

    // Create axis measurement
    const axisMeasurement = calculateQRSAxis(Math.cos(angle), Math.sin(angle));
    measurements.push(axisMeasurement);

    // Get interpretation
    const { interpretation, clinicalSignificance } = interpretQRSAxis(axisMeasurement.axis);

    const result: MeasurementResult = {
      tool: toolName,
      measurements,
      timestamp: Date.now(),
      interpretations: [interpretation],
      clinicalSignificance,
    };

    this.results.set(`${toolName}-${Date.now()}`, result);
    return result;
  }

  /**
   * Handle Arrow Annotate Tool (QT Interval with QTc)
   *
   * Measures QT interval and automatically calculates QTc
   * Requires additional RR interval input for correction
   *
   * @param event - Measurement event from tool
   * @param rrInterval - RR interval in milliseconds (from separate measurement)
   * @returns QT and QTc measurements
   */
  handleArrowAnnotateMeasurement(
    event: MeasurementEventData,
    rrInterval?: number
  ): MeasurementResult {
    const { toolData, toolName } = event;
    const measurements: ECGMeasurement[] = [];

    // Get text/annotation data
    const handles = toolData.handles;
    if (!handles || !Array.isArray(handles) || handles.length < 2) {
      console.warn('Invalid arrow annotation measurement');
      return { tool: toolName, measurements, timestamp: Date.now() };
    }

    // Calculate QT interval duration (vertical distance)
    const xDistance = Math.abs(handles[1].x - handles[0].x);
    const qtInternal = calculateIntervalMeasurement(
      xDistance,
      { timePixelsPerSecond: this.calibration.timePixelsPerSecond },
      'time'
    );

    const qtValue = qtInternal.value; // in milliseconds
    measurements.push({
      id: `qt-${Date.now()}`,
      type: 'interval',
      value: qtValue,
      unit: 'ms',
      timestamp: Date.now(),
      reference: {
        max: 440,
        normal: 'Normal QT: Male < 440 ms, Female < 460 ms',
      },
    });

    // Calculate QTc if RR interval provided
    if (rrInterval && rrInterval > 0) {
      const qtcValue = calculateQTc_Bazett(qtValue, rrInterval);
      const interpretation = interpretQTc(qtcValue);

      const qtcMeasurement: QTMeasurement = {
        id: `qtc-${Date.now()}`,
        type: 'qtc',
        value: qtcValue,
        unit: 'ms',
        timestamp: Date.now(),
        qtInterval: qtValue,
        rrInterval,
        qtc: qtcValue,
        formulaUsed: 'bazett',
        reference: {
          max: 440,
          normal: 'QTc < 440 ms (male), < 460 ms (female)',
        },
      };

      measurements.push(qtcMeasurement);

      const result: MeasurementResult = {
        tool: toolName,
        measurements,
        timestamp: Date.now(),
        interpretations: [interpretation],
      };

      this.results.set(`${toolName}-${Date.now()}`, result);
      return result;
    }

    const result: MeasurementResult = {
      tool: toolName,
      measurements,
      timestamp: Date.now(),
      interpretations: ['QT interval measured. RR interval needed for QTc calculation.'],
    };

    this.results.set(`${toolName}-${Date.now()}`, result);
    return result;
  }

  /**
   * Handle Elliptical ROI (QRS Area for LVH Assessment)
   *
   * Measures area of QRS complex
   * Area > 120 mm² suggests LVH
   *
   * @param event - Measurement event from tool
   * @returns QRS area measurement
   */
  handleEllipticalROIMeasurement(event: MeasurementEventData): MeasurementResult {
    const { toolData, toolName } = event;
    const measurements: ECGMeasurement[] = [];

    // Get dimensions from ellipse handles
    const handles = toolData.handles;
    if (!handles || !Array.isArray(handles) || handles.length < 2) {
      console.warn('Invalid elliptical ROI measurement');
      return { tool: toolName, measurements, timestamp: Date.now() };
    }

    // Calculate width and height
    const width = Math.abs(handles[1].x - handles[0].x);
    const height = Math.abs(handles[1].y - handles[0].y);

    const areaMeasurement = calculateQRSArea(width, height, this.calibration.pixelsPerMM);

    measurements.push(areaMeasurement);

    const result: MeasurementResult = {
      tool: toolName,
      measurements,
      timestamp: Date.now(),
      interpretations: [
        areaMeasurement.value > 120
          ? 'QRS area > 120 mm² - Suggests Left Ventricular Hypertrophy (LVH)'
          : 'QRS area normal',
      ],
    };

    this.results.set(`${toolName}-${Date.now()}`, result);
    return result;
  }

  /**
   * Handle Rectangle ROI (P Wave Analysis)
   *
   * Measures P wave duration and amplitude
   * Duration: normal < 120 ms
   * Amplitude: normal < 2.5 mm (0.25 mV)
   *
   * @param event - Measurement event from tool
   * @returns P wave duration and amplitude measurements
   */
  handleRectangleROIMeasurement(event: MeasurementEventData): MeasurementResult {
    const { toolData, toolName } = event;
    const measurements: ECGMeasurement[] = [];

    const handles = toolData.handles;
    if (!handles || !Array.isArray(handles) || handles.length < 2) {
      console.warn('Invalid rectangle ROI measurement');
      return { tool: toolName, measurements, timestamp: Date.now() };
    }

    // Width = duration
    const width = Math.abs(handles[1].x - handles[0].x);
    const durationMeasurement = calculateIntervalMeasurement(
      width,
      { timePixelsPerSecond: this.calibration.timePixelsPerSecond },
      'time'
    );
    measurements.push(durationMeasurement);

    // Height = amplitude
    const height = Math.abs(handles[1].y - handles[0].y);
    const amplitudeMeasurement = calculateIntervalMeasurement(
      height,
      { amplitudePixelsPerMV: this.calibration.amplitudePixelsPerMV },
      'amplitude'
    );
    measurements.push(amplitudeMeasurement);

    const result: MeasurementResult = {
      tool: toolName,
      measurements,
      timestamp: Date.now(),
      interpretations: [
        durationMeasurement.value > 120 ? 'P wave prolonged (> 120 ms)' : 'P wave duration normal',
        amplitudeMeasurement.value > 0.25
          ? 'P wave amplitude increased'
          : 'P wave amplitude normal',
      ],
    };

    this.results.set(`${toolName}-${Date.now()}`, result);
    return result;
  }

  /**
   * Handle Circle ROI (ST Segment Analysis)
   *
   * Measures ST segment elevation or depression
   * ST elevation > 1 mm in 2+ contiguous leads = STEMI
   * ST depression suggests ischemia
   *
   * @param event - Measurement event from tool
   * @returns ST segment measurement
   */
  handleCircleROIMeasurement(event: MeasurementEventData): MeasurementResult {
    const { toolData, toolName } = event;
    const measurements: ECGMeasurement[] = [];

    const handles = toolData.handles;
    if (!handles || !Array.isArray(handles)) {
      console.warn('Invalid circle ROI measurement');
      return { tool: toolName, measurements, timestamp: Date.now() };
    }

    // Get radius as amplitude
    const radius = Math.abs(handles[1].y - handles[0].y);
    const stMeasurement = calculateIntervalMeasurement(
      radius,
      { amplitudePixelsPerMV: this.calibration.amplitudePixelsPerMV },
      'amplitude'
    );

    measurements.push(stMeasurement);

    let interpretation = '';
    if (stMeasurement.value > 1) {
      interpretation = `ST elevation: ${stMeasurement.value.toFixed(2)} mV`;
    } else if (stMeasurement.value < -1) {
      interpretation = `ST depression: ${Math.abs(stMeasurement.value).toFixed(2)} mV`;
    } else {
      interpretation = 'ST segment normal';
    }

    const result: MeasurementResult = {
      tool: toolName,
      measurements,
      timestamp: Date.now(),
      interpretations: [interpretation],
    };

    this.results.set(`${toolName}-${Date.now()}`, result);
    return result;
  }

  /**
   * Set Calibration Values
   *
   * @param calibration - Calibration object with conversion factors
   */
  setCalibration(calibration: Partial<typeof this.calibration>): void {
    this.calibration = { ...this.calibration, ...calibration };
  }

  /**
   * Get All Measurements
   *
   * @returns Map of all measurements
   */
  getAllMeasurements(): Map<string, ECGMeasurement[]> {
    return this.measurements;
  }

  /**
   * Get All Results
   *
   * @returns Map of all measurement results with interpretations
   */
  getAllResults(): Map<string, MeasurementResult> {
    return this.results;
  }

  /**
   * Clear Measurements
   *
   * Useful when switching modes or clearing the workspace
   */
  clearMeasurements(): void {
    this.measurements.clear();
    this.results.clear();
  }

  /**
   * Format Measurement Result for Display
   *
   * @param result - Measurement result to format
   * @returns Formatted string for UI display
   */
  formatResult(result: MeasurementResult): string {
    let output = `${result.tool}:\n`;

    result.measurements.forEach(m => {
      output += `  ${formatMeasurement(m)}\n`;
    });

    if (result.interpretations?.length) {
      output += `  Interpretation: ${result.interpretations.join(', ')}\n`;
    }

    if (result.clinicalSignificance?.length) {
      output += `  Clinical: ${result.clinicalSignificance.join(', ')}\n`;
    }

    return output;
  }
}

/**
 * Create Measurement Handler Instance
 *
 * @returns ECGMeasurementHandler instance
 */
export function createMeasurementHandler(): ECGMeasurementHandler {
  return new ECGMeasurementHandler();
}
