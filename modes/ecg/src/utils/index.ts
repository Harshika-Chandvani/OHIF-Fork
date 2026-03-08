/**
 * ECG Mode Utilities
 *
 * Comprehensive ECG measurement, calculation, and comparison tools
 */

export {
  // Calculations module
  calculateHeartRate,
  calculateQTc_Bazett,
  calculateQTc_Fridericia,
  calculateQTc_Framingham,
  interpretQTc,
  calculateQRSAxis,
  interpretQRSAxis,
  calculateIntervalMeasurement,
  calculateQRSArea,
  validateMeasurement,
  formatMeasurement,
  // Types
  type ECGMeasurement,
  type RRIntervalMeasurement,
  type QTMeasurement,
  type QRSAxisMeasurement,
} from './ecgCalculations';

export {
  // Measurement handler module
  ECGMeasurementHandler,
  createMeasurementHandler,
  // Types
  type MeasurementResult,
  type MeasurementEventData,
} from './measurementHandler';

export {
  // Studies comparison module
  StudiesComparison,
  createStudiesComparison,
  // Types
  type ECGStudy,
  type ComparisonResult,
  type MeasurementDifference,
} from './studiesComparison';
