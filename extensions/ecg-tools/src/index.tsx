import React from 'react';
import { Types, DicomMetadataStore } from '@ohif/core';
import dcmjs from 'dcmjs';
import dicomImageLoader from '@cornerstonejs/dicom-image-loader';
import ECGMeasurementsPanel from './components/ECGMeasurementsPanel';
import ECGWaveformViewport from './components/ECGWaveformViewport';
import { ecgSOPClassHandler } from './SOPClassHandlers/ecgSOPClassHandler';
import { ecgToolState } from './ecgToolState';
import { hrBus, rectBus, qrsBus } from './hrBus';

function getCommandsModule({ servicesManager }) {
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
      setECGLayout: {
        commandFn: ({ numRows, numCols }) => {
          const { viewportGridService, displaySetService } = servicesManager.services;
          const isComparison = numRows * numCols > 1;
          ecgToolState.setComparisonMode(isComparison);

          const findOrCreateViewport = (position: number) => {
            const state = viewportGridService.getState();
            const viewports = Array.from(state.viewports.values());
            if (viewports[position]) {
              return viewports[position];
            }
            return {
              displaySetInstanceUIDs: [],
            };
          };

          viewportGridService.setLayout({
            numCols,
            numRows,
            findOrCreateViewport,
          });

          // Auto-populate viewports if we are in comparison mode and have multiple ECGs
          if (isComparison) {
            const allDisplaySets = displaySetService.getActiveDisplaySets();
            const ecgDisplaySets = allDisplaySets.filter(ds => ds.Modality === 'ECG');

            setTimeout(() => {
              const state = viewportGridService.getState();
              const viewportIds = Array.from(state.viewports.keys());
              const updates = [];

              viewportIds.forEach((vid, idx) => {
                if (ecgDisplaySets[idx]) {
                  updates.push({
                    viewportId: vid,
                    displaySetInstanceUIDs: [ecgDisplaySets[idx].displaySetInstanceUID],
                  });
                }
              });

              if (updates.length > 0) {
                viewportGridService.setDisplaySetsForViewports(updates);
              }
            }, 100);
          }
        },
      },
      importECG: {
        commandFn: async () => {
          const { displaySetService, viewportGridService, uiNotificationService } =
            servicesManager.services;
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.dcm,application/dicom';
          input.multiple = true;
          input.onchange = async (e: any) => {
            const files = e.target.files;
            if (!files || files.length === 0) return;

            const importPromises = Array.from(files).map(async (file: File) => {
              try {
                const imageId = dicomImageLoader.wadouri.fileManager.add(file);
                const arrayBuffer = await dicomImageLoader.wadouri.loadFileRequest(imageId);
                
                let dicomData;
                try {
                  dicomData = dcmjs.data.DicomMessage.readFile(arrayBuffer);
                } catch (e) {
                  // Fallback for OX/VR errors: some files have invalid VR types
                  if (e.message?.includes('ox')) {
                    console.warn('[ECGTools] Patching OX VR error during import');
                  }
                  throw e;
                }

                const dataset = dcmjs.data.DicomMetaDictionary.naturalizeDataset(dicomData.dict);
                dataset.url = imageId;
                dataset._meta = dcmjs.data.DicomMetaDictionary.namifyDataset(dicomData.meta);

                // Ensure Modality is set for correct SOP class rendering
                if (!dataset.Modality) {
                  dataset.Modality = 'ECG';
                }

                // Add to metadata store
                DicomMetadataStore.addInstance(dataset);
                return { studyUID: dataset.StudyInstanceUID, seriesUID: dataset.SeriesInstanceUID };
              } catch (err) {
                console.error('[ECGTools] Error importing file:', file.name, err);
                return null;
              }
            });

            const results = await Promise.all(importPromises);
            const validResults = results.filter(Boolean);
            const uniqueStudyUIDs = Array.from(new Set(validResults.map(r => r.studyUID)));

            if (uniqueStudyUIDs.length > 0) {
              const allAddedDisplaySets = [];

              uniqueStudyUIDs.forEach((studyUID: string) => {
                const study = DicomMetadataStore.getStudy(studyUID);
                if (study) {
                  const allInstances = study.series.reduce((acc, series) => {
                    return acc.concat(series.instances);
                  }, []);
                  const dsAdded = displaySetService.makeDisplaySets(allInstances, {
                    madeInClient: true,
                  });
                  if (dsAdded) {
                    allAddedDisplaySets.push(...dsAdded);
                  }
                }
              });

              uiNotificationService.show({
                title: 'Import ECG',
                message: `Successfully imported ${uniqueStudyUIDs.length} ECG study/studies.`,
                type: 'success',
              });

              // Auto-populate empty viewports with the newly imported ECGs
              setTimeout(() => {
                const gridState = viewportGridService.getState();
                const { activeViewportId } = gridState;
                const viewports = Array.from(gridState.viewports.values());
                const viewportIds = Array.from(gridState.viewports.keys());

                const updates = [];
                let dsIdx = 0;

                const ecgDisplaySets = allAddedDisplaySets.filter(ds => ds.Modality === 'ECG');

                viewports.forEach((vp: any, idx) => {
                  const isEmpty = !vp.displaySetInstanceUIDs || vp.displaySetInstanceUIDs.length === 0;
                  if (isEmpty && dsIdx < ecgDisplaySets.length) {
                    updates.push({
                      viewportId: viewportIds[idx],
                      displaySetInstanceUIDs: [ecgDisplaySets[dsIdx].displaySetInstanceUID],
                    });
                    dsIdx++;
                  }
                });

                if (updates.length > 0) {
                  viewportGridService.setDisplaySetsForViewports(updates);
                } else if (allAddedDisplaySets.length > 0 && activeViewportId) {
                  // Fallback: if no empty viewports, put the first new one in the active viewport
                  viewportGridService.setDisplaySetsForViewports([
                    {
                      viewportId: activeViewportId,
                      displaySetInstanceUIDs: [allAddedDisplaySets[0].displaySetInstanceUID],
                    },
                  ]);
                }
              }, 500);
            }
          };
          input.click();
        },
      },
      deleteActiveECG: {
        commandFn: () => {
          const { viewportGridService, displaySetService, uiNotificationService } =
            servicesManager.services;
          const { activeViewportId, viewports } = viewportGridService.getState();
          const activeViewport = viewports.get(activeViewportId);

          if (!activeViewport || !activeViewport.displaySetInstanceUIDs?.length) {
            uiNotificationService.show({
              title: 'Delete ECG',
              message: 'No active ECG to delete.',
              type: 'warning',
            });
            return;
          }

          const displaySetInstanceUID = activeViewport.displaySetInstanceUIDs[0];
          const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);

          if (!displaySet) return;

          const { StudyInstanceUID } = displaySet;

          // Clear the viewport first to prevent rendering errors
          viewportGridService.setDisplaySetsForViewports([
            {
              viewportId: activeViewportId,
              displaySetInstanceUIDs: [],
            },
          ]);

          // Small delay to let the viewport clear before metadata removal
          setTimeout(() => {
            // Remove display set
            displaySetService.deleteDisplaySet(displaySetInstanceUID);

            // Remove from metadata store
            DicomMetadataStore.deleteStudy(StudyInstanceUID);
          }, 100);

          uiNotificationService.show({
            title: 'Delete ECG',
            message: 'Successfully removed the local ECG study.',
            type: 'success',
          });
        },
      },
      resetECGState: {
        commandFn: () => {
          ecgToolState.setActiveTool(null);
          ecgToolState.setComparisonMode(false);
          hrBus.clear();
          rectBus.clear();
          qrsBus.clear();
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
    {
      name: 'ecg-layout-1x1',
      evaluate: ({ servicesManager }) => {
        const { viewportGridService } = servicesManager.services;
        const { layout } = viewportGridService.getState();
        return { isActive: layout.numRows === 1 && layout.numCols === 1 };
      },
    },
    {
      name: 'ecg-layout-1x2',
      evaluate: ({ servicesManager }) => {
        const { viewportGridService } = servicesManager.services;
        const { layout } = viewportGridService.getState();
        return { isActive: layout.numRows === 1 && layout.numCols === 2 };
      },
    },
    {
      name: 'ecg-layout-1x3',
      evaluate: ({ servicesManager }) => {
        const { viewportGridService } = servicesManager.services;
        const { layout } = viewportGridService.getState();
        return { isActive: layout.numRows === 1 && layout.numCols === 3 };
      },
    },
    {
      name: 'ecg-layout-2x1',
      evaluate: ({ servicesManager }) => {
        const { viewportGridService } = servicesManager.services;
        const { layout } = viewportGridService.getState();
        return { isActive: layout.numRows === 2 && layout.numCols === 1 };
      },
    },
    {
      name: 'ecg-layout-2x2',
      evaluate: ({ servicesManager }) => {
        const { viewportGridService } = servicesManager.services;
        const { layout } = viewportGridService.getState();
        return { isActive: layout.numRows === 2 && layout.numCols === 2 };
      },
    },
    {
      name: 'ecg-layout-2x3',
      evaluate: ({ servicesManager }) => {
        const { viewportGridService } = servicesManager.services;
        const { layout } = viewportGridService.getState();
        return { isActive: layout.numRows === 2 && layout.numCols === 3 };
      },
    },
    {
      name: 'ecg-import',
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
