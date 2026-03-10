import update from 'immutability-helper';
import { ToolbarService, utils } from '@ohif/core';
import { id } from './id';
import initWorkflowSteps from './initWorkflowSteps';
import initToolGroups from './initToolGroups';
import toolbarButtons from './toolbarButtons';

const { TOOLBAR_SECTIONS } = ToolbarService;
const { structuredCloneWithFunctions } = utils;

export const extensionDependencies = {
  '@ohif/extension-default': '^3.0.0',
  '@ohif/extension-cornerstone': '^3.0.0',
  '@ohif/extension-ecg-tools': '^3.0.0',
};

export const ohif = {
  layout: '@ohif/extension-default.layoutTemplateModule.viewerLayout',
  sopClassHandler: '@ohif/extension-default.sopClassHandlerModule.stack',
  thumbnailList: '@ohif/extension-default.panelModule.seriesList',
  hangingProtocol: '@ohif/extension-default.hangingProtocolModule.default',
};

export const cornerstone = {
  measurements: '@ohif/extension-cornerstone.panelModule.panelMeasurement',
  viewport: '@ohif/extension-cornerstone.viewportModule.cornerstone',
};

export const ecgTools = {
  ecgPanel: 'extension-ecg-tools.panelModule.ecg-measurements',
  ecgViewport: 'extension-ecg-tools.viewportModule.ecg-waveform',
  ecgSopHandler: 'extension-ecg-tools.sopClassHandlerModule.ecg-waveform',
};

export const NON_IMAGE_MODALITIES = ['SEG', 'RTSTRUCT', 'RTPLAN', 'PR', 'SR'];

export const toolbarSections = {
  [TOOLBAR_SECTIONS.primary]: ['ECGMeasurementDropdown', 'ecg-zoom-in', 'ecg-zoom-out'],
  [TOOLBAR_SECTIONS.viewportActionMenu.topLeft]: ['orientationMenu', 'dataOverlayMenu'],
  [TOOLBAR_SECTIONS.viewportActionMenu.bottomMiddle]: ['windowLevelMenuEmbedded'],
  ECGMeasurementDropdown: ['ecg-measurement', 'ecg-qt-points', 'ecg-hr', 'ecg-qrs-axis'],
};

export const ecgLayout = {
  id: ohif.layout,
  props: {
    leftPanels: [ohif.thumbnailList, ecgTools.ecgPanel],
    leftPanelResizable: true,
    rightPanels: [cornerstone.measurements],
    rightPanelClosed: true,
    rightPanelResizable: true,
    viewports: [
      {
        // ECG waveform viewport — renders DICOM waveform data
        namespace: ecgTools.ecgViewport,
        displaySetsToDisplay: [ecgTools.ecgSopHandler],
      },
      {
        // Fallback: standard image viewport for non-ECG series
        namespace: cornerstone.viewport,
        displaySetsToDisplay: [ohif.sopClassHandler],
      },
    ],
  },
};

export function layoutTemplate() {
  return structuredCloneWithFunctions(this.layoutInstance);
}

export const ecgRoute = {
  path: 'ecg',
  layoutTemplate,
  layoutInstance: ecgLayout,
};

export function isValidMode({ modalities }) {
  const modalities_list = typeof modalities === 'string' ? modalities.split('\\') : modalities;

  if (modalities_list.includes('ECG')) {
    return {
      valid: true,
      description: 'ECG Mode',
    };
  }

  return {
    valid: false,
    description: 'ECG mode only supports studies with the ECG modality',
  };
}

export function onModeEnter({ servicesManager, extensionManager, commandsManager }: withAppTypes) {
  const {
    measurementService,
    toolbarService,
    toolGroupService,
    customizationService,
    cornerstoneViewportService,
  } = servicesManager.services;

  const utilityModule: any = extensionManager.getModuleEntry(
    '@ohif/extension-cornerstone.utilityModule.tools'
  );

  const { toolNames, Enums } = utilityModule.exports;

  measurementService.clearMeasurements();
  initToolGroups(toolNames, Enums, toolGroupService, commandsManager, servicesManager);

  // Register the ECG-specific toolbar buttons (including the dropdown list)
  toolbarService.register(toolbarButtons as any);

  // Set the primary toolbar and the nested ECGMeasurementDropdown contents
  toolbarService.updateSection(TOOLBAR_SECTIONS.primary, [
    'ECGMeasurementDropdown',
    'ecg-zoom-in',
    'ecg-zoom-out',
  ]);
  toolbarService.updateSection('ECGMeasurementDropdown', [
    'ecg-measurement',
    'ecg-qt-points',
    'ecg-hr',
    'ecg-qrs-axis',
  ]);
}

export function onSetupRouteComplete({ servicesManager }: withAppTypes) {
  // Initialize workflow steps after route setup
  initWorkflowSteps({ servicesManager });
}

export function onModeExit({ servicesManager }: withAppTypes) {
  const { toolGroupService, cornerstoneViewportService } = servicesManager.services;

  toolGroupService.destroy();
  cornerstoneViewportService.destroy();
}

export const modeInstance = {
  id,
  routeName: 'ecg',
  displayName: 'ECG',
  hide: false,
  _activatePanelTriggersSubscriptions: [],
  toolbarSections,

  onModeEnter,
  onSetupRouteComplete,
  onModeExit,
  isValidMode,
  validationTags: {
    study: [],
    series: [],
  },

  routes: [ecgRoute],
  extensions: extensionDependencies,
  hangingProtocol: 'default',
  sopClassHandlers: [ecgTools.ecgSopHandler, ohif.sopClassHandler],
  toolbarButtons,
  nonModeModalities: NON_IMAGE_MODALITIES,
};

/**
 * Creates a mode on this object, using immutability-helper to apply changes
 * from modeConfiguration into the modeInstance.
 */
export function modeFactory({ modeConfiguration }) {
  let instance = modeInstance;
  if (modeConfiguration) {
    instance = update(instance, modeConfiguration);
  }
  return instance;
}

export const mode = {
  id,
  modeFactory,
  modeInstance: { ...modeInstance, hide: false },
  extensionDependencies,
};

export default mode;
