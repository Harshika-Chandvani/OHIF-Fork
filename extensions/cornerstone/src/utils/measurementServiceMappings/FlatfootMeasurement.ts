import SUPPORTED_TOOLS from './constants/supportedTools';
import { getIsLocked } from './utils/getIsLocked';
import { getIsVisible } from './utils/getIsVisible';
import getSOPInstanceAttributes from './utils/getSOPInstanceAttributes';
import { utils } from '@ohif/core';

// ---------------------------------------------------------------------------
// Helpers — compute flatfoot stats directly from handle points (world coords)
// The tool does NOT populate cachedStats, so we compute on demand here.
// ---------------------------------------------------------------------------

function _vec3Sub(a: number[], b: number[]) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function _vec3Length(v: number[]) {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
}

function _vec3Cross(a: number[], b: number[]) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function _vec3Dot(a: number[], b: number[]) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/** Distance from point C to line AB (returns mm in world units) */
function _calculateArchHeight(A: number[], B: number[], C: number[]) {
  const ab = _vec3Sub(B, A);
  const ac = _vec3Sub(C, A);
  const abLen = _vec3Length(ab);
  if (abLen === 0) return 0;
  const cross = _vec3Cross(ab, ac);
  return _vec3Length(cross) / abLen;
}

/** Angle at vertex C between rays CA and CB (degrees) */
function _calculateArchAngle(A: number[], B: number[], C: number[]) {
  const ca = _vec3Sub(A, C);
  const cb = _vec3Sub(B, C);
  const magCA = _vec3Length(ca);
  const magCB = _vec3Length(cb);
  if (magCA === 0 || magCB === 0) return 0;
  const cosAngle = Math.max(-1, Math.min(1, _vec3Dot(ca, cb) / (magCA * magCB)));
  return Math.acos(cosAngle) * (180 / Math.PI);
}

// ---------------------------------------------------------------------------

const FlatfootMeasurement = {
  toAnnotation: (_measurement: any) => {
    // Not needed for display-only; return empty
    return {};
  },

  toMeasurement: (
    csToolsEventDetail: any,
    displaySetService: any,
    cornerstoneViewportService: any,
    getValueTypeFromToolType: (toolType: string) => any,
    customizationService: any
  ) => {
    const { annotation } = csToolsEventDetail;
    const { metadata, data, annotationUID } = annotation;

    if (!metadata || !data) {
      console.warn('FlatfootMeasurement: Missing metadata or data');
      return null;
    }

    const isLocked = getIsLocked(annotationUID);
    const isVisible = getIsVisible(annotationUID);

    const { toolName, referencedImageId, FrameOfReferenceUID } = metadata;

    if (!SUPPORTED_TOOLS.includes(toolName)) {
      throw new Error('Tool not supported: ' + toolName);
    }

    const { SOPInstanceUID, SeriesInstanceUID, StudyInstanceUID } = getSOPInstanceAttributes(
      referencedImageId,
      displaySetService,
      annotation
    );

    let displaySet;
    if (SOPInstanceUID) {
      displaySet = displaySetService.getDisplaySetForSOPInstanceUID(SOPInstanceUID, SeriesInstanceUID);
    } else {
      displaySet = displaySetService.getDisplaySetsForSeries(SeriesInstanceUID)[0];
    }

    const { points, textBox } = data.handles;

    // Compute stats from handle points
    const hasThreePoints = points && points.length === 3;
    const archAngle = hasThreePoints ? _calculateArchAngle(points[0], points[1], points[2]) : null;
    const archHeight = hasThreePoints ? _calculateArchHeight(points[0], points[1], points[2]) : null;

    // Build display text for the measurements panel
    const displayText = _getDisplayText(
      archAngle,
      archHeight,
      displaySet,
      referencedImageId,
      displaySetService,
      annotation
    );

    const getReport = () =>
      _getReport(archAngle, archHeight, points, FrameOfReferenceUID);

    return {
      uid: annotationUID,
      SOPInstanceUID,
      FrameOfReferenceUID,
      points,
      textBox,
      isLocked,
      isVisible,
      metadata,
      referenceSeriesUID: SeriesInstanceUID,
      referenceStudyUID: StudyInstanceUID,
      referencedImageId,
      frameNumber: 1,
      toolName,
      displaySetInstanceUID: displaySet?.displaySetInstanceUID,
      label: data.label,
      displayText,
      data: { archAngle, archHeight },
      type: getValueTypeFromToolType(toolName),
      getReport,
    };
  },
};

function _getDisplayText(
  archAngle: number | null,
  archHeight: number | null,
  displaySet: any,
  referencedImageId: string,
  displaySetService: any,
  annotation: any
) {
  const displayText: { primary: string[]; secondary: string[] } = {
    primary: [],
    secondary: [],
  };

  if (archAngle !== null && archAngle !== undefined) {
    displayText.primary.push(`Angle: ${utils.roundNumber(archAngle, 2)} °`);
  }
  if (archHeight !== null && archHeight !== undefined) {
    displayText.primary.push(`Height: ${utils.roundNumber(archHeight, 2)} mm`);
  }

  if (displaySet) {
    const { SOPInstanceUID, SeriesInstanceUID, frameNumber } = getSOPInstanceAttributes(
      referencedImageId,
      displaySetService,
      annotation
    );
    const { SeriesNumber } = displaySet;
    const instance = displaySet?.instances?.find(
      (img: any) => img.SOPInstanceUID === SOPInstanceUID
    );
    const instanceText = instance?.InstanceNumber ? ` I: ${instance.InstanceNumber}` : '';
    const frameText = displaySet.isMultiFrame ? ` F: ${frameNumber}` : '';
    displayText.secondary.push(`S: ${SeriesNumber}${instanceText}${frameText}`);
  }

  return displayText;
}

function _getReport(
  archAngle: number | null,
  archHeight: number | null,
  points: any[],
  FrameOfReferenceUID: string
) {
  const columns: string[] = [];
  const values: any[] = [];

  columns.push('AnnotationType');
  values.push('FlatfootMeasurement');

  if (archAngle !== null && archAngle !== undefined) {
    columns.push('Arch Angle (°)');
    values.push(archAngle);
  }
  if (archHeight !== null && archHeight !== undefined) {
    columns.push('Arch Height (mm)');
    values.push(archHeight);
  }

  if (FrameOfReferenceUID) {
    columns.push('FrameOfReferenceUID');
    values.push(FrameOfReferenceUID);
  }

  if (points) {
    columns.push('points');
    values.push(points.map((p: any) => p.join(' ')).join(';'));
  }

  return { columns, values };
}

export default FlatfootMeasurement;
