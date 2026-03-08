/**
 * Simple shared state for the active ECG tool.
 * This module is imported by both the toolbar command handlers and the viewport,
 * allowing communication without complex service wiring.
 */

type ECGTool = 'QTPoints' | 'Measurement' | 'Hr' | 'QRSAxis' | null;

let _activeTool: ECGTool = null;
const _listeners: Array<(tool: ECGTool) => void> = [];

export const ecgToolState = {
  getActiveTool(): ECGTool {
    return _activeTool;
  },

  setActiveTool(tool: ECGTool) {
    _activeTool = tool;
    _listeners.forEach(fn => fn(tool));
  },

  /** Subscribe to tool changes, returns unsubscribe function */
  subscribe(listener: (tool: ECGTool) => void) {
    _listeners.push(listener);
    return () => {
      const idx = _listeners.indexOf(listener);
      if (idx !== -1) _listeners.splice(idx, 1);
    };
  },
};

export type { ECGTool };
