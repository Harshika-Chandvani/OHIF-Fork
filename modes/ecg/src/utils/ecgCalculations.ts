/**
 * ECG Measurements and Calculations Utility Module
 *
 * Implements specialized calculations for electrocardiogram analysis:
 * - Heart Rate (HR) calculation from RR interval
 * - QTc (corrected QT) using Bazett's formula
 * - QRS axis calculation
 * - Interval measurements (mV/s)
 * - Area calculations for diagnostic criteria
 *
 * All formulas follow standard ECG interpretation guidelines
 */

/**
 * ECG Measurement Interfaces
 */
export interface ECGMeasurement {
  id: string;
  type: 'interval' | 'area' | 'angle' | 'rate' | 'qtc';
  value: number;
  unit: string;
  timestamp: number;
  reference?: {
    min?: number;
    max?: number;
    normal?: string;
  };
}

export interface RRIntervalMeasurement extends ECGMeasurement {
  type: 'interval';
  rrInterval: number; // milliseconds
  heartRate: number; // beats per minute
}

export interface QTMeasurement extends ECGMeasurement {
  type: 'qtc';
  qtInterval: number; // milliseconds
  rrInterval: number; // milliseconds
  qtc: number; // corrected QT in milliseconds
  formulaUsed: 'bazett' | 'fridericia' | 'framingham';
}

export interface QRSAxisMeasurement extends ECGMeasurement {
  type: 'angle';
  axis: number; // degrees (-90 to 180)
  axisCategory: 'normal' | 'lad' | 'rad' | 'extreme';
}

/**
 * Calculate Heart Rate from RR Interval
 *
 * Formula: HR = 60,000 / RR(ms)
 * Normal: 60-100 bpm
 * Bradycardia: < 60 bpm
 * Tachycardia: > 100 bpm
 *
 * @param rrInterval - RR interval in milliseconds
 * @returns Heart rate in beats per minute
 */
export function calculateHeartRate(rrInterval: number): number {
  if (rrInterval <= 0) {
    throw new Error('RR interval must be greater than 0');
  }
  return Math.round(60000 / rrInterval);
}

/**
 * Calculate QTc (Corrected QT) using Bazett's Formula
 *
 * Formula: QTc = QT / √(RR in seconds)
 * Or: QTc = QT / √(RR in ms / 1000)
 *
 * Normal ranges:
 * - Male: < 440 ms
 * - Female: < 460 ms
 * - Prolonged: > 440-460 ms (increases risk of Torsades de Pointes)
 *
 * Limitations: Overestimates correction at slow heart rates (< 60 bpm)
 *
 * @param qtInterval - QT interval in milliseconds
 * @param rrInterval - RR interval in milliseconds
 * @returns QTc in milliseconds
 */
export function calculateQTc_Bazett(qtInterval: number, rrInterval: number): number {
  if (qtInterval <= 0 || rrInterval <= 0) {
    throw new Error('QT and RR intervals must be greater than 0');
  }
  const rrSeconds = rrInterval / 1000;
  return Math.round(qtInterval / Math.sqrt(rrSeconds));
}

/**
 * Calculate QTc using Fridericia's Formula (more accurate at slow rates)
 *
 * Formula: QTc = QT / ∛(RR in seconds)
 * Or: QTc = QT / (RR in ms / 1000)^(1/3)
 *
 * More accurate than Bazett at very slow heart rates
 *
 * @param qtInterval - QT interval in milliseconds
 * @param rrInterval - RR interval in milliseconds
 * @returns QTc in milliseconds
 */
export function calculateQTc_Fridericia(qtInterval: number, rrInterval: number): number {
  if (qtInterval <= 0 || rrInterval <= 0) {
    throw new Error('QT and RR intervals must be greater than 0');
  }
  const rrSeconds = rrInterval / 1000;
  const cbrt = Math.cbrt(rrSeconds); // cube root
  return Math.round(qtInterval / cbrt);
}

/**
 * Calculate QTc using Framingham Formula
 *
 * Formula: QTc = QT + 0.154 × (1 - RR in seconds)
 *
 * Linear correction, useful for research
 *
 * @param qtInterval - QT interval in milliseconds
 * @param rrInterval - RR interval in milliseconds
 * @returns QTc in milliseconds
 */
export function calculateQTc_Framingham(qtInterval: number, rrInterval: number): number {
  if (qtInterval <= 0 || rrInterval <= 0) {
    throw new Error('QT and RR intervals must be greater than 0');
  }
  const rrSeconds = rrInterval / 1000;
  return Math.round(qtInterval + 154 * (1 - rrSeconds));
}

/**
 * Interpret QTc value
 *
 * @param qtc - QTc interval in milliseconds
 * @param gender - 'male' or 'female'
 * @returns Interpretation string
 */
export function interpretQTc(qtc: number, gender: 'male' | 'female' = 'male'): string {
  const threshold = gender === 'male' ? 440 : 460;

  if (qtc < 350) {
    return 'Shortened QT interval';
  } else if (qtc <= threshold) {
    return 'Normal QTc';
  } else if (qtc <= threshold + 60) {
    return 'Mildly prolonged QTc';
  } else {
    return 'Significantly prolonged QTc - Risk of Torsades de Pointes';
  }
}

/**
 * Calculate QRS Electrical Axis
 *
 * Method: Find perpendicular lead to most biphasic/equiphasic lead
 * Normal range: -30° to +90° (or 0° to 180° in modern notation)
 *
 * Axis Deviations:
 * - Normal: -30° to +90°
 * - LAD (Left Axis Deviation): < -30° (indicates LVH, inferior MI)
 * - RAD (Right Axis Deviation): > +90° (indicates RVH, COPD)
 * - Extreme: -90° to -180° (indicates lead reversal or emphysema)
 *
 * @param leadI_netDeflection - Net deflection of lead I
 * @param leadAVF_netDeflection - Net deflection of lead aVF
 * @returns QRS axis in degrees
 */
export function calculateQRSAxis(
  leadI_netDeflection: number,
  leadAVF_netDeflection: number
): QRSAxisMeasurement {
  // Calculate angle using arctangent
  const axisRadians = Math.atan2(leadAVF_netDeflection, leadI_netDeflection);
  const axisDegrees = Math.round((axisRadians * 180) / Math.PI);

  // Normalize to -180 to +180 range
  let normalizedAxis = axisDegrees;
  if (normalizedAxis < -90) {
    normalizedAxis = normalizedAxis + 180;
  }

  // Categorize axis
  let category: 'normal' | 'lad' | 'rad' | 'extreme';
  if (normalizedAxis >= -30 && normalizedAxis <= 90) {
    category = 'normal';
  } else if (normalizedAxis < -30) {
    category = 'lad'; // Left Axis Deviation
  } else {
    category = 'rad'; // Right Axis Deviation
  }

  if (normalizedAxis < -90 || normalizedAxis > 180) {
    category = 'extreme';
  }

  return {
    id: `qrs-axis-${Date.now()}`,
    type: 'angle',
    value: normalizedAxis,
    unit: 'degrees',
    timestamp: Date.now(),
    axis: normalizedAxis,
    axisCategory: category,
    reference: {
      min: -30,
      max: 90,
      normal: 'Normal axis: -30° to +90°. LAD: <-30°. RAD: >+90°.',
    },
  };
}

/**
 * Interpret QRS Axis
 *
 * @param axis - QRS axis in degrees
 * @returns Interpretation string and clinical significance
 */
export function interpretQRSAxis(axis: number): {
  interpretation: string;
  clinicalSignificance: string[];
} {
  let interpretation = '';
  let clinicalSignificance: string[] = [];

  if (axis >= -30 && axis <= 90) {
    interpretation = 'Normal QRS Axis';
    clinicalSignificance = ['Normal cardiac conduction'];
  } else if (axis < -30) {
    interpretation = 'Left Axis Deviation (LAD)';
    clinicalSignificance = [
      'Left Ventricular Hypertrophy (LVH)',
      'Inferior Myocardial Infarction',
      'Left Anterior Fascicular Block (LAFB)',
      'Obesity',
      'Pregnancy',
    ];
  } else if (axis > 90) {
    interpretation = 'Right Axis Deviation (RAD)';
    clinicalSignificance = [
      'Right Ventricular Hypertrophy (RVH)',
      'COPD',
      'Chronic heart disease',
      'Left Posterior Fascicular Block (LPFB)',
      'Lateral Myocardial Infarction',
    ];
  } else if (axis < -90) {
    interpretation = 'Extreme Axis Deviation';
    clinicalSignificance = [
      'Lead reversal (check electrode placement)',
      'Emphysema',
      'Severe COPD',
      'Congenital heart disease',
    ];
  }

  return { interpretation, clinicalSignificance };
}

/**
 * Calculate Interval Measurements (time and amplitude)
 *
 * Converts grid measurements to clinical values:
 * Time: 1 small square = 0.04 seconds (at 25 mm/s)
 * Amplitude: 1 small square = 0.1 mV (standard calibration)
 *
 * @param pixelDistance - Pixel distance on screen
 * @param calibration - Calibration factor (pixels per unit)
 * @param measurementType - 'time' or 'amplitude'
 * @returns Measurement value in clinical units
 */
export function calculateIntervalMeasurement(
  pixelDistance: number,
  calibration: { timePixelsPerSecond?: number; amplitudePixelsPerMV?: number },
  measurementType: 'time' | 'amplitude'
): ECGMeasurement {
  let value = 0;
  let unit = '';

  if (measurementType === 'time' && calibration.timePixelsPerSecond) {
    // Convert pixels to seconds, then to milliseconds
    value = (pixelDistance / calibration.timePixelsPerSecond) * 1000;
    unit = 'ms';
  } else if (measurementType === 'amplitude' && calibration.amplitudePixelsPerMV) {
    // Convert pixels to millivolts
    value = pixelDistance / calibration.amplitudePixelsPerMV;
    unit = 'mV';
  }

  return {
    id: `interval-${Date.now()}`,
    type: 'interval',
    value: Math.round(value * 100) / 100,
    unit,
    timestamp: Date.now(),
  };
}

/**
 * Calculate Area of QRS Complex (for LVH assessment)
 *
 * Uses elliptical approximation or grid counting
 * Area in mm² typically: normal < 120, LVH > 120
 *
 * @param width - Width in pixels
 * @param height - Height in pixels
 * @param calibration - Pixel to mm conversion
 * @returns Area measurement
 */
export function calculateQRSArea(
  width: number,
  height: number,
  calibration: number // pixels per mm
): ECGMeasurement {
  // Ellipse area = π × (width/2) × (height/2)
  const areaPixels = Math.PI * (width / 2) * (height / 2);
  const areaMM2 = areaPixels / (calibration * calibration);

  return {
    id: `qrs-area-${Date.now()}`,
    type: 'area',
    value: Math.round(areaMM2 * 10) / 10,
    unit: 'mm²',
    timestamp: Date.now(),
    reference: {
      max: 120,
      normal: 'Normal QRS area < 120 mm². Area > 120 mm² suggests LVH.',
    },
  };
}

/**
 * Validate Measurement
 * Ensures measurement is within physiologically reasonable limits
 *
 * @param measurement - The measurement to validate
 * @returns { isValid: boolean; reason?: string }
 */
export function validateMeasurement(measurement: ECGMeasurement): {
  isValid: boolean;
  reason?: string;
} {
  switch (measurement.type) {
    case 'interval':
      if (measurement.value < 0 || measurement.value > 2000) {
        return {
          isValid: false,
          reason: 'Interval measurement out of physiological range (0-2000 ms)',
        };
      }
      break;

    case 'qtc':
      const qtc = measurement as QTMeasurement;
      if (qtc.qtc < 200 || qtc.qtc > 700) {
        return { isValid: false, reason: 'QTc out of range (200-700 ms)' };
      }
      break;

    case 'angle':
      if (measurement.value < -180 || measurement.value > 180) {
        return { isValid: false, reason: 'Axis angle must be between -180 and +180 degrees' };
      }
      break;

    case 'area':
      if (measurement.value < 0 || measurement.value > 1000) {
        return { isValid: false, reason: 'Area measurement out of range (0-1000 mm²)' };
      }
      break;
  }

  return { isValid: true };
}

/**
 * Format Measurement for Display
 *
 * @param measurement - The measurement to format
 * @returns Formatted string for UI display
 */
export function formatMeasurement(measurement: ECGMeasurement): string {
  const value = measurement.value.toFixed(
    measurement.unit === 'degrees' ? 1 : measurement.unit === 'mm²' ? 1 : 0
  );
  return `${value} ${measurement.unit}`;
}
