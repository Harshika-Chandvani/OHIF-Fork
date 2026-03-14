const cornerstone = {
  measurements: '@ohif/extension-cornerstone.panelModule.panelMeasurement',
};

const defaultLayout = {
  panels: {
    left: [],
    right: [[cornerstone.measurements]],
  },
};

/**
 * The workflow step toolbar buttons for ECG mode.
 * Must match what onModeEnter registers — using ECGMeasurementDropdown
 * in the primary section so the ECG-specific tools remain visible.
 */
const defaultToolbarButtons = [
  {
    buttonSection: 'primary',
    buttons: ['ECGMeasurementDropdown', 'ECGLayoutDropdown', 'ecg-zoom-in', 'ecg-zoom-out', 'ecg-import', 'ecg-delete'],
  },
  {
    buttonSection: 'ECGMeasurementDropdown',
    buttons: ['ecg-measurement', 'ecg-qt-points', 'ecg-hr', 'ecg-qrs-axis'],
  },
  {
    buttonSection: 'ECGLayoutDropdown',
    buttons: [
      'ecg-layout-1x1',
      'ecg-layout-1x2',
      'ecg-layout-1x3',
      'ecg-layout-2x1',
      'ecg-layout-2x2',
      'ecg-layout-2x3',
    ],
  },
];

function getWorkflowSettings({ servicesManager }) {
  return {
    steps: [
      {
        id: 'ecg-visualization',
        name: 'ECG Visualization',
        layout: defaultLayout,
        toolbarButtons: defaultToolbarButtons,
        hangingProtocol: {
          protocolId: 'default',
        },
      },
      {
        id: 'ecg-analysis',
        name: 'ECG Analysis',
        layout: defaultLayout,
        toolbarButtons: defaultToolbarButtons,
        hangingProtocol: {
          protocolId: 'default',
        },
      },
      {
        id: 'ecg-report',
        name: 'ECG Report',
        layout: defaultLayout,
        toolbarButtons: defaultToolbarButtons,
        hangingProtocol: {
          protocolId: 'default',
        },
      },
    ],
  };
}

export { getWorkflowSettings as default };
