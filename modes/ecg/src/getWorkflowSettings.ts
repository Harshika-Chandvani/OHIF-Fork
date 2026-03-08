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
    buttons: ['ECGMeasurementDropdown'],
  },
  {
    buttonSection: 'ECGMeasurementDropdown',
    buttons: ['ecg-measurement', 'ecg-qt-points', 'ecg-hr', 'ecg-qrs-axis'],
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
