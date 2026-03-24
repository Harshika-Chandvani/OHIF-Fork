import React from 'react';
import { Types } from '@ohif/core';
import { addTool, state } from '@cornerstonejs/tools';
import { SmartPaintTool } from './tools/SmartPaintTool';

const smartPaintExtension: Types.Extensions.Extension = {
  id: 'extension-smart-paint',

  preRegistration: ({ servicesManager, extensionManager }) => {
    try {
      addTool(SmartPaintTool);
      console.log('SmartPaintTool registered to cornerstoneTools');
    } catch (error) {
      console.error('Failed to register SmartPaintTool', error);
    }
  },

  getCommandsModule: ({ servicesManager, commandsManager }) => {
    return {
      definitions: {
        activateSmartPaintTool: {
          commandFn: async (commandOptions) => {
            const { segmentationService, viewportGridService } = servicesManager.services;

            const viewportId = viewportGridService.getActiveViewportId();

            // SmartPaintTool extends BrushTool which MUST write into a Labelmap pixel buffer.
            // A Contour-only setup has no pixel buffer, so painting silently does nothing.
            // Strategy:
            //   1. Check if there is already a Labelmap segmentation in this viewport.
            //   2. If yes, activate it.
            //   3. If no, create a brand-new Labelmap for this viewport (same as clicking +New in Labelmap panel).
            const allRepresentations = segmentationService.getSegmentationRepresentations(viewportId);
            const existingLabelmap = allRepresentations.find((r) => r.type === 'Labelmap');

            if (existingLabelmap) {
              // A Labelmap already exists — activate it
              segmentationService.setActiveSegmentation(viewportId, existingLabelmap.segmentationId);
            } else {
              // No Labelmap exists — create a standalone Labelmap segmentation for this viewport.
              // This uses the same official path as the + New Segmentation button in Labelmap mode.
              try {
                const newSegmentationId = await commandsManager.runCommand('createLabelmapForViewport', {
                  viewportId,
                  options: {
                    label: 'Smart Paint',
                    createInitialSegment: true,
                  },
                });

                if (newSegmentationId) {
                  segmentationService.setActiveSegmentation(viewportId, newSegmentationId);
                }
              } catch (err) {
                console.warn('SmartPaint: Could not create Labelmap for painting:', err);
              }
            }

            // Activate SmartPaint as the left-mouse-button tool
            commandsManager.runCommand('setToolActiveToolbar', { toolName: 'SmartPaint' });
          },
        },
        setSmartPaintMode: {
          commandFn: ({ value }) => {
            // Mode toggle between 2D and 3D Brush (Circular vs Sphere)
            // Set strategy on the SmartPaint tool config
            commandsManager.runCommand('setToolConfiguration', {
              toolName: 'SmartPaint',
              configuration: {
                activeStrategy: value === '2D' ? 'FILL_INSIDE_CIRCLE' : 'FILL_INSIDE_SPHERE'
              }
            });
          },
        },
        setSmartPaintRadius: {
          commandFn: ({ value }) => {
            // Use built-in brush size setter
            commandsManager.runCommand('setBrushSize', {
              toolNames: ['SmartPaint'],
              value,
            });
          },
        },
        setSmartPaintSensitivity: {
          commandFn: ({ value }) => {
            commandsManager.runCommand('setToolConfiguration', {
              toolName: 'SmartPaint',
              configuration: {
                sensitivity: value,
              }
            });
          },
        },
        setSmartPaintTransparency: {
          commandFn: ({ value }) => {
            // Transparency normally targets segmentation rendering, but we'll apply it to the tool
            commandsManager.runCommand('setToolConfiguration', {
              toolName: 'SmartPaint',
              configuration: {
                transparency: value,
              }
            });
            // Update global segmentation alpha mapping for visible effect
            commandsManager.runCommand('setFillAlpha', { type: 'Labelmap', value: 1 - value });
          },
        },
      },
      actions: {},
    };
  },

  getToolbarModule: () => {
    return [
      {
        name: 'smart-paint',
        defaultState: false,
        evaluate: () => ({ isActive: false }),
      },
    ];
  },
};

export default smartPaintExtension;
