import React from 'react';
import { Types } from '@ohif/core';
import ECGMeasurementsPanel from './components/ECGMeasurementsPanel';
import ECGWaveformViewport from './components/ECGWaveformViewport';
import { ecgSOPClassHandler } from './SOPClassHandlers/ecgSOPClassHandler';
import { ecgToolState } from './ecgToolState';

function getCommandsModule() {
  return {
    definitions: {
      setECGTool: {
        commandFn: ({ toolName }) => {
          const current = ecgToolState.getActiveTool();
          ecgToolState.setActiveTool(current === toolName ? null : toolName);
        },
      },
      zoomInECG: {
        commandFn: () => {
          const current = ecgToolState.getZoomLevel();
          ecgToolState.setZoomLevel(current + 0.25);
        },
      },
      zoomOutECG: {
        commandFn: () => {
          const current = ecgToolState.getZoomLevel();
          ecgToolState.setZoomLevel(current - 0.25);
        },
      },
    },
    actions: {},
    defaultContext: 'VIEWER',
  };
}

function getToolbarModule() {
  // We expose our own ECG toolbar buttons that use our custom command
  return [
    {
      name: 'ecg-measurement',
      defaultState: false,
      evaluate: ({ commandsManager }) => {
        const isActive = ecgToolState.getActiveTool() === 'Measurement';
        return { isActive };
      },
    },
    {
      name: 'ecg-qt-points',
      defaultState: false,
      evaluate: () => {
        const isActive = ecgToolState.getActiveTool() === 'QTPoints';
        return { isActive };
      },
    },
    {
      name: 'ecg-hr',
      defaultState: false,
      evaluate: () => {
        const isActive = ecgToolState.getActiveTool() === 'Hr';
        return { isActive };
      },
    },
    {
      name: 'ecg-qrs-axis',
      defaultState: false,
      evaluate: () => {
        const isActive = ecgToolState.getActiveTool() === 'QRSAxis';
        return { isActive };
      },
    },
    {
      name: 'ecg-zoom-in',
      defaultState: false,
      evaluate: () => {
        return { isActive: false };
      },
    },
    {
      name: 'ecg-zoom-out',
      defaultState: false,
      evaluate: () => {
        return { isActive: false };
      },
    },
  ];
}

function getPanelModule({ servicesManager, extensionManager }) {
  return [
    {
      name: 'ecg-measurements',
      iconName: 'tab-measurements',
      label: 'ECG Tools',
      component: props => (
        <ECGMeasurementsPanel
          servicesManager={servicesManager}
          extensionManager={extensionManager}
          {...props}
        />
      ),
    },
  ];
}

function getSopClassHandlerModule() {
  return [ecgSOPClassHandler];
}

function getViewportModule({ servicesManager, extensionManager }) {
  return [
    {
      name: 'ecg-waveform',
      component: props => (
        <ECGWaveformViewport
          {...props}
          servicesManager={servicesManager}
          extensionManager={extensionManager}
        />
      ),
    },
  ];
}

const ecgExtension: Types.Extensions.Extension = {
  id: 'extension-ecg-tools',
  getCommandsModule,
  getToolbarModule,
  getPanelModule,
  getSopClassHandlerModule,
  getViewportModule,
};

export default ecgExtension;
