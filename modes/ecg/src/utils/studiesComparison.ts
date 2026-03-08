/**
 * ECG Studies Comparison Module
 *
 * Enables side-by-side comparison of multiple ECG studies
 * Supports synchronized cursors and measurement overlays
 * Useful for tracking changes over time, comparing baseline vs current
 */

import { ECGMeasurement } from './ecgCalculations';

/**
 * Study Comparison Interfaces
 */
export interface ECGStudy {
  id: string;
  seriesInstanceUID: string;
  timestamp: Date;
  patientName: string;
  description: string;
  measurements?: Map<string, ECGMeasurement[]>;
}

export interface ComparisonResult {
  baseline: ECGStudy;
  current: ECGStudy;
  differences: MeasurementDifference[];
  clinicalChangesSuggested: string[];
}

export interface MeasurementDifference {
  measurementType: string;
  baselineValue: number;
  currentValue: number;
  difference: number;
  percentChange: number;
  significance: 'normal' | 'mild' | 'moderate' | 'significant';
}

/**
 * Studies Comparison Manager
 *
 * Manages multiple ECG studies and enables side-by-side comparison
 */
export class StudiesComparison {
  private studies: Map<string, ECGStudy> = new Map();
  private baselineStudyId: string | null = null;
  private comparisonMode: boolean = false;

  /**
   * Add ECG Study to comparison
   *
   * @param study - ECG study to add
   */
  addStudy(study: ECGStudy): void {
    this.studies.set(study.id, study);

    // Set first study as baseline if not already set
    if (!this.baselineStudyId) {
      this.baselineStudyId = study.id;
    }
  }

  /**
   * Remove Study
   *
   * @param studyId - ID of study to remove
   */
  removeStudy(studyId: string): void {
    this.studies.delete(studyId);

    // Update baseline if removed
    if (studyId === this.baselineStudyId && this.studies.size > 0) {
      const firstKey = this.studies.keys().next().value;
      this.baselineStudyId = firstKey;
    }
  }

  /**
   * Set Baseline Study for Comparison
   *
   * @param studyId - ID of study to use as baseline
   * @returns true if successful, false if study not found
   */
  setBaselineStudy(studyId: string): boolean {
    if (!this.studies.has(studyId)) {
      console.warn(`Study ${studyId} not found`);
      return false;
    }

    this.baselineStudyId = studyId;
    return true;
  }

  /**
   * Enable Comparison Mode
   *
   * Allows viewing baseline and current study side-by-side
   */
  enableComparisonMode(): void {
    this.comparisonMode = true;
  }

  /**
   * Disable Comparison Mode
   */
  disableComparisonMode(): void {
    this.comparisonMode = false;
  }

  /**
   * Get Comparison Mode Status
   *
   * @returns true if comparison mode is active
   */
  isComparisonModeActive(): boolean {
    return this.comparisonMode;
  }

  /**
   * Compare Two Studies
   *
   * Compares current study with baseline study
   * Highlights significant changes
   *
   * @param currentStudyId - ID of current study to compare
   * @returns Comparison result with differences and clinical significance
   */
  compareStudies(currentStudyId: string): ComparisonResult | null {
    if (!this.baselineStudyId) {
      console.warn('No baseline study set for comparison');
      return null;
    }

    const baselineStudy = this.studies.get(this.baselineStudyId);
    const currentStudy = this.studies.get(currentStudyId);

    if (!baselineStudy || !currentStudy) {
      console.warn('One or both studies not found');
      return null;
    }

    const differences = this.calculateDifferences(baselineStudy, currentStudy);
    const clinicalChanges = this.assessClinicalSignificance(differences);

    return {
      baseline: baselineStudy,
      current: currentStudy,
      differences,
      clinicalChangesSuggested: clinicalChanges,
    };
  }

  /**
   * Calculate Differences Between Studies
   *
   * @param baseline - Baseline study
   * @param current - Current study to compare
   * @returns Array of measurement differences
   */
  private calculateDifferences(baseline: ECGStudy, current: ECGStudy): MeasurementDifference[] {
    const differences: MeasurementDifference[] = [];

    if (!baseline.measurements || !current.measurements) {
      return differences;
    }

    // Compare each measurement type
    baseline.measurements.forEach((baselineMeasurements, measurementType) => {
      const currentMeasurements = current.measurements?.get(measurementType);

      if (!currentMeasurements) {
        return;
      }

      // For simplicity, compare the first measurement of each type
      // In practice, you might want to compare averages or specific measurements
      const baselineMeasurement = baselineMeasurements[0];
      const currentMeasurement = currentMeasurements[0];

      if (!baselineMeasurement || !currentMeasurement) {
        return;
      }

      const difference = currentMeasurement.value - baselineMeasurement.value;
      const percentChange = (difference / baselineMeasurement.value) * 100;
      const significance = this.assessSignificance(percentChange, measurementType);

      differences.push({
        measurementType,
        baselineValue: baselineMeasurement.value,
        currentValue: currentMeasurement.value,
        difference,
        percentChange,
        significance,
      });
    });

    return differences;
  }

  /**
   * Assess Significance of Change
   *
   * Determines if a change is clinically significant based on percentage change
   *
   * @param percentChange - Percentage change in value
   * @param measurementType - Type of measurement
   * @returns Significance level
   */
  private assessSignificance(
    percentChange: number,
    measurementType: string
  ): 'normal' | 'mild' | 'moderate' | 'significant' {
    const absChange = Math.abs(percentChange);

    // Different thresholds for different measurements
    if (measurementType.includes('rate') || measurementType.includes('HR')) {
      // Heart rate changes
      if (absChange < 5) return 'normal';
      if (absChange < 15) return 'mild';
      if (absChange < 25) return 'moderate';
      return 'significant';
    } else if (measurementType.includes('QTc') || measurementType.includes('QT')) {
      // QT interval changes
      if (absChange < 3) return 'normal';
      if (absChange < 8) return 'mild';
      if (absChange < 15) return 'moderate';
      return 'significant';
    } else if (measurementType.includes('axis')) {
      // Axis changes (in degrees)
      if (absChange < 5) return 'normal';
      if (absChange < 15) return 'mild';
      if (absChange < 30) return 'moderate';
      return 'significant';
    } else {
      // General measurements
      if (absChange < 5) return 'normal';
      if (absChange < 10) return 'mild';
      if (absChange < 20) return 'moderate';
      return 'significant';
    }
  }

  /**
   * Assess Clinical Significance of Changes
   *
   * @param differences - Array of measurement differences
   * @returns Array of clinical change descriptions
   */
  private assessClinicalSignificance(differences: MeasurementDifference[]): string[] {
    const changes: string[] = [];

    differences.forEach(diff => {
      if (diff.significance === 'normal') {
        return; // Skip normal changes
      }

      const changeSymbol = diff.difference > 0 ? '↑' : '↓';
      const magnitudeWord =
        diff.significance === 'mild'
          ? 'mildly'
          : diff.significance === 'moderate'
            ? 'moderately'
            : 'significantly';

      changes.push(
        `${diff.measurementType} ${magnitudeWord} ${changeSymbol} ` +
          `(${diff.difference > 0 ? '+' : ''}${diff.difference.toFixed(2)} ` +
          `or ${diff.percentChange.toFixed(1)}%)`
      );

      // Add specific clinical interpretations
      if (diff.measurementType.includes('HR') || diff.measurementType.includes('rate')) {
        const baselineHR = diff.baselineValue;
        const currentHR = diff.currentValue;

        if (currentHR < 60 && baselineHR >= 60) {
          changes.push('⚠️ New bradycardia detected');
        } else if (currentHR > 100 && baselineHR <= 100) {
          changes.push('⚠️ New tachycardia detected');
        }
      }

      if (diff.measurementType.includes('QTc')) {
        if (diff.currentValue > 440 && diff.baselineValue <= 440) {
          changes.push('⚠️ QTc prolongation - Monitor for arrhythmia risk');
        } else if (diff.percentChange > 15) {
          changes.push('⚠️ Significant QT prolongation - Check medications');
        }
      }

      if (diff.measurementType.includes('axis')) {
        if (diff.currentValue < -30 && diff.baselineValue >= -30) {
          changes.push('⚠️ New Left Axis Deviation - Assess LVH');
        } else if (diff.currentValue > 90 && diff.baselineValue <= 90) {
          changes.push('⚠️ New Right Axis Deviation - Check RVH, COPD');
        }
      }
    });

    return changes;
  }

  /**
   * Get All Studies
   *
   * @returns Array of all studies
   */
  getAllStudies(): ECGStudy[] {
    return Array.from(this.studies.values());
  }

  /**
   * Get Study by ID
   *
   * @param studyId - ID of study to retrieve
   * @returns Study if found, null otherwise
   */
  getStudy(studyId: string): ECGStudy | null {
    return this.studies.get(studyId) || null;
  }

  /**
   * Get Baseline Study
   *
   * @returns Current baseline study or null
   */
  getBaselineStudy(): ECGStudy | null {
    return this.baselineStudyId ? this.studies.get(this.baselineStudyId) || null : null;
  }

  /**
   * Create Time Series Comparison
   *
   * Creates chronological comparison of studies over time
   * Useful for tracking progression/regression
   *
   * @returns Sorted array of studies by timestamp
   */
  createTimeSeriesComparison(): ECGStudy[] {
    const sorted = Array.from(this.studies.values());
    sorted.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    return sorted;
  }

  /**
   * Generate Comparison Report
   *
   * Creates formatted text report of comparison
   *
   * @param comparisonResult - Comparison result to format
   * @returns Formatted report string
   */
  generateComparisonReport(comparisonResult: ComparisonResult): string {
    let report = '=== ECG COMPARISON REPORT ===\n\n';

    report += `BASELINE:\n`;
    report += `  Study: ${comparisonResult.baseline.description}\n`;
    report += `  Date: ${comparisonResult.baseline.timestamp.toLocaleDateString()}\n`;
    report += `  Patient: ${comparisonResult.baseline.patientName}\n\n`;

    report += `CURRENT:\n`;
    report += `  Study: ${comparisonResult.current.description}\n`;
    report += `  Date: ${comparisonResult.current.timestamp.toLocaleDateString()}\n`;
    report += `  Patient: ${comparisonResult.current.patientName}\n\n`;

    report += `MEASUREMENTS COMPARISON:\n`;
    comparisonResult.differences.forEach(diff => {
      const sign = diff.difference > 0 ? '+' : '';
      report +=
        `  ${diff.measurementType}: ${diff.baselineValue.toFixed(2)} → ${diff.currentValue.toFixed(2)} ` +
        `(${sign}${diff.difference.toFixed(2)}, ${diff.percentChange.toFixed(1)}%) [${diff.significance}]\n`;
    });

    if (comparisonResult.clinicalChangesSuggested.length > 0) {
      report += `\nCLINICAL OBSERVATIONS:\n`;
      comparisonResult.clinicalChangesSuggested.forEach(change => {
        report += `  • ${change}\n`;
      });
    }

    return report;
  }

  /**
   * Clear All Studies
   *
   * Removes all studies from comparison
   */
  clearStudies(): void {
    this.studies.clear();
    this.baselineStudyId = null;
    this.comparisonMode = false;
  }
}

/**
 * Create Studies Comparison Manager Instance
 *
 * @returns StudiesComparison instance
 */
export function createStudiesComparison(): StudiesComparison {
  return new StudiesComparison();
}
