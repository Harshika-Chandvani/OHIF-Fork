/**
 * ECG Mode Toolbar Buttons
 * Uses unique ecg-* IDs and evaluate.action (always enabled, no Cornerstone dependency).
 */

const toolbarButtons = [
  {
    id: 'ECGMeasurementDropdown',
    uiType: 'ohif.toolButtonList',
    props: {
      buttonSection: true,
    },
  },
  {
    id: 'ecg-measurement',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-length',
      label: 'Measurement (mV, s)',
      tooltip: 'Measure time intervals and voltage amplitudes on the ECG waveform',
      commands: {
        commandName: 'setECGTool',
        commandOptions: { toolName: 'Measurement' },
        context: 'VIEWER',
      },
      evaluate: 'evaluate.action',
    },
  },
  {
    id: 'ecg-qt-points',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-bidirectional',
      label: 'QT points (RR, QT, QTc)',
      tooltip: '3-click: Q onset → T end → next Q onset — measures RR, QT and QTc',
      commands: {
        commandName: 'setECGTool',
        commandOptions: { toolName: 'QTPoints' },
        context: 'VIEWER',
      },
      evaluate: 'evaluate.action',
    },
  },
  {
    id: 'ecg-hr',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-annotate',
      label: 'Hr',
      tooltip: 'Mark two R-peaks to calculate Heart Rate',
      commands: {
        commandName: 'setECGTool',
        commandOptions: { toolName: 'Hr' },
        context: 'VIEWER',
      },
      evaluate: 'evaluate.action',
    },
  },
  {
    id: 'ecg-qrs-axis',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-angle',
      label: 'QRS Axis',
      tooltip: 'Calculate the electrical QRS axis',
      commands: {
        commandName: 'setECGTool',
        commandOptions: { toolName: 'QRSAxis' },
        context: 'VIEWER',
      },
      evaluate: 'evaluate.action',
    },
  },
];

export default toolbarButtons;
