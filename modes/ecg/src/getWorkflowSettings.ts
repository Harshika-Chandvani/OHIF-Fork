const cornerstone = {
  measurements: '@ohif/extension-cornerstone.panelModule.panelMeasurement',
};

const defaultLayout = {
  panels: {
    left: [],
    right: [[cornerstone.measurements]],
  },
};

const defaultToolbarButtons = [
  {
    buttonSection: 'primary',
    buttons: ['MeasurementTools', 'Zoom', 'WindowLevel'],
  },
  {
    buttonSection: 'MeasurementTools',
    buttons: [
      'Length',
      'Bidirectional',
      'ArrowAnnotate',
      'EllipticalROI',
      'RectangleROI',
      'CircleROI',
      'Angle',
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
