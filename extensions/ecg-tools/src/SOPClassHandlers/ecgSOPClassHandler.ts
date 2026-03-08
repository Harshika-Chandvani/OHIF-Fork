import { utils } from '@ohif/core';

// ECG SOP Class UIDs per DICOM standard
const ECG_SOP_CLASS_UIDS = [
  '1.2.840.10008.5.1.4.1.1.9.1.1', // 12-Lead ECG Waveform Storage
  '1.2.840.10008.5.1.4.1.1.9.1.2', // General ECG Waveform Storage
  '1.2.840.10008.5.1.4.1.1.9.1.3', // Ambulatory ECG Waveform Storage
  '1.2.840.10008.5.1.4.1.1.9.2.1', // Hemodynamic Waveform Storage
  '1.2.840.10008.5.1.4.1.1.9.3.1', // Cardiac Electrophysiology Waveform Storage
];

const ECG_HANDLER_NAME = 'ecg-waveform';

function makeECGDisplaySet(instance, sopClassUids) {
  const {
    StudyInstanceUID,
    SeriesInstanceUID,
    SOPInstanceUID,
    SeriesDescription,
    SeriesNumber,
    SeriesDate,
    SOPClassUID,
    Modality,
  } = instance;

  return {
    Modality: Modality || 'ECG',
    loading: false,
    isReconstructable: false,
    displaySetInstanceUID: utils.guid(),
    SeriesDescription: SeriesDescription || 'ECG Waveform',
    SeriesNumber,
    SeriesDate,
    SOPInstanceUID,
    SeriesInstanceUID,
    StudyInstanceUID,
    SOPClassHandlerId: `extension-ecg-tools.sopClassHandlerModule.${ECG_HANDLER_NAME}`,
    SOPClassUID,
    isDerivedDisplaySet: false,
    isLoaded: false,
    isECGWaveform: true,
    sopClassUids,
    instance,
    instances: [instance],
    addInstances: function (instances) {
      this.instances.push(...instances);
      this.instance = this.instances[this.instances.length - 1];
      return this;
    },
  };
}

function getSopClassUids(instances) {
  const uniqueSet = new Set();
  instances.forEach(instance => uniqueSet.add(instance.SOPClassUID));
  return Array.from(uniqueSet);
}

function getDisplaySetsFromSeries(instances) {
  if (!instances || !instances.length) {
    throw new Error('No instances were provided');
  }

  const sopClassUids = getSopClassUids(instances);
  return instances.map(instance => makeECGDisplaySet(instance, sopClassUids));
}

export const ecgSOPClassHandler = {
  name: ECG_HANDLER_NAME,
  sopClassUids: ECG_SOP_CLASS_UIDS,
  getDisplaySetsFromSeries,
};

export { ECG_SOP_CLASS_UIDS, ECG_HANDLER_NAME };
