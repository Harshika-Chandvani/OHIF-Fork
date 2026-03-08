/**
 * Simple module-level event bus for sharing HR measurements
 * between the ECGWaveformViewport and ECGMeasurementsPanel
 * without creating circular imports.
 */

export type HRRecord = { id: number; rrSec: number; hrBpm: number };

class HRBus {
  private _records: HRRecord[] = [];
  private _listeners: Array<(records: HRRecord[]) => void> = [];

  add(record: HRRecord) {
    this._records = [...this._records, record];
    this._listeners.forEach(fn => fn(this._records));
  }

  clear() {
    this._records = [];
    this._listeners.forEach(fn => fn([]));
  }

  subscribe(fn: (records: HRRecord[]) => void): () => void {
    this._listeners.push(fn);
    // Immediately call with current records
    fn(this._records);
    return () => {
      const idx = this._listeners.indexOf(fn);
      if (idx !== -1) this._listeners.splice(idx, 1);
    };
  }

  get records(): HRRecord[] {
    return this._records;
  }
}

export const hrBus = new HRBus();
