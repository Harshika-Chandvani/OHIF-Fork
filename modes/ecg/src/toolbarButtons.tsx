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
  {
    id: 'ecg-zoom-in',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-magnify',
      label: 'Zoom In',
      tooltip: 'Zoom In ECG Waveform',
      commands: {
        commandName: 'zoomInECG',
        context: 'VIEWER',
      },
      evaluate: 'evaluate.action',
    },
  },
  {
    id: 'ecg-zoom-out',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-zoom',
      label: 'Zoom Out',
      tooltip: 'Zoom Out ECG Waveform',
      commands: {
        commandName: 'zoomOutECG',
        context: 'VIEWER',
      },
      evaluate: 'evaluate.action',
    },
  },
  {
    id: 'ECGLayoutDropdown',
    uiType: 'ohif.toolButtonList',
    props: {
      buttonSection: true,
      label: 'Panels',
    },
  },
  {
    id: 'ecg-layout-1x1',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-layout',
      label: '1x1 Panel',
      tooltip: 'Single viewport layout',
      commands: {
        commandName: 'setECGLayout',
        commandOptions: { numRows: 1, numCols: 1 },
        context: 'VIEWER',
      },
      evaluate: 'evaluate.action',
    },
  },
  {
    id: 'ecg-layout-1x2',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-layout',
      label: '1x2 Panel',
      tooltip: '1 row, 2 columns layout',
      commands: {
        commandName: 'setECGLayout',
        commandOptions: { numRows: 1, numCols: 2 },
        context: 'VIEWER',
      },
      evaluate: 'evaluate.action',
    },
  },
  {
    id: 'ecg-layout-1x3',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-layout',
      label: '1x3 Panel',
      tooltip: '1 row, 3 columns layout',
      commands: {
        commandName: 'setECGLayout',
        commandOptions: { numRows: 1, numCols: 3 },
        context: 'VIEWER',
      },
      evaluate: 'evaluate.action',
    },
  },
  {
    id: 'ecg-layout-2x1',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-layout',
      label: '2x1 Panel',
      tooltip: '2 rows, 1 column layout',
      commands: {
        commandName: 'setECGLayout',
        commandOptions: { numRows: 2, numCols: 1 },
        context: 'VIEWER',
      },
      evaluate: 'evaluate.action',
    },
  },
  {
    id: 'ecg-layout-2x2',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-layout',
      label: '2x2 Panel',
      tooltip: '2 rows, 2 columns layout',
      commands: {
        commandName: 'setECGLayout',
        commandOptions: { numRows: 2, numCols: 2 },
        context: 'VIEWER',
      },
      evaluate: 'evaluate.action',
    },
  },
  {
    id: 'ecg-layout-2x3',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-layout',
      label: '2x3 Panel',
      tooltip: '2 rows, 3 columns layout',
      commands: {
        commandName: 'setECGLayout',
        commandOptions: { numRows: 2, numCols: 3 },
        context: 'VIEWER',
      },
      evaluate: 'evaluate.action',
    },
  },
  {
    id: 'ecg-import',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'Upload',
      label: 'Import',
      tooltip: 'Import local ECG DICOM file for comparison',
      commands: {
        commandName: 'importECG',
        context: 'VIEWER',
      },
      evaluate: 'evaluate.action',
    },
  },
  {
    id: 'ecg-delete',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'Trash',
      label: 'Delete',
      tooltip: 'Delete the active local ECG study',
      commands: {
        commandName: 'deleteActiveECG',
        context: 'VIEWER',
      },
      evaluate: 'evaluate.action',
    },
  },
];

export default toolbarButtons;
