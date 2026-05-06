import type { SVGProps } from 'react';

const wrap = (path: React.ReactNode, size = 16): React.FC<SVGProps<SVGSVGElement>> => {
  const Comp: React.FC<SVGProps<SVGSVGElement>> = (p) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="square"
      strokeLinejoin="miter"
      shapeRendering="crispEdges"
      {...p}
    >
      {path}
    </svg>
  );
  return Comp;
};

export const IconBrush = wrap(
  <>
    <path d="M3 12.5L6 9.5L9 12.5L7 14.5H4.5L3 13V12.5Z" fill="currentColor" stroke="none" />
    <path d="M9 9.5L12.5 6L13.5 5L11.5 3L10.5 4L7 7.5" />
    <path d="M9 9.5L7 7.5" />
  </>,
);

export const IconEraser = wrap(
  <>
    <path d="M3 11.5L9.5 5L13 8.5L6.5 15H3V11.5Z" />
    <path d="M9 9L13 13" />
  </>,
);

export const IconPicker = wrap(
  <>
    <path d="M9 4L12 7" />
    <path d="M11.5 2.5L13.5 4.5" />
    <path d="M9.5 4.5L4 10L3 13L6 12L11.5 6.5" />
  </>,
);

export const IconPencil = wrap(
  <>
    <path d="M3 13L11 5L13 7L5 15H3V13Z" />
    <path d="M9 7L11 9" />
  </>,
);

export const IconRect = wrap(
  <>
    <rect x="3" y="3" width="10" height="10" />
    <path d="M3 3L13 13" strokeDasharray="1 1" />
  </>,
);

export const IconUndo = wrap(
  <>
    <path d="M5 6L2 9L5 12" />
    <path d="M2 9H10C12 9 13 10 13 12" />
  </>,
);

export const IconRedo = wrap(
  <>
    <path d="M11 6L14 9L11 12" />
    <path d="M14 9H6C4 9 3 10 3 12" />
  </>,
);

export const IconNew = wrap(
  <>
    <path d="M4 2H10L13 5V14H4V2Z" />
    <path d="M10 2V5H13" />
    <path d="M8 8V12M6 10H10" />
  </>,
);

export const IconOpen = wrap(
  <>
    <path d="M2 5L4 3H7L9 5H14V13H2V5Z" />
  </>,
);

export const IconSave = wrap(
  <>
    <path d="M3 3H11L13 5V13H3V3Z" />
    <path d="M5 3V7H10V3" />
    <rect x="6" y="9" width="4" height="3" />
  </>,
);

export const IconExport = wrap(
  <>
    <rect x="2" y="9" width="12" height="5" />
    <path d="M8 9V2" />
    <path d="M5 5L8 2L11 5" />
  </>,
);

export const IconEye = wrap(
  <>
    <path d="M2 8C4 4 6 3 8 3C10 3 12 4 14 8C12 12 10 13 8 13C6 13 4 12 2 8Z" />
    <circle cx="8" cy="8" r="2" />
  </>,
);

export const IconEyeOff = wrap(
  <>
    <path d="M2 8C4 4 6 3 8 3C10 3 12 4 14 8C12 12 10 13 8 13C6 13 4 12 2 8Z" />
    <path d="M2 2L14 14" stroke="currentColor" strokeWidth="2" />
  </>,
);

export const IconCollapseLeft = wrap(
  <>
    <path d="M10 3L5 8L10 13" />
  </>,
);

export const IconCollapseRight = wrap(
  <>
    <path d="M6 3L11 8L6 13" />
  </>,
);

export const IconClose = wrap(
  <>
    <path d="M4 4L12 12M12 4L4 12" />
  </>,
);

export const IconTrash = wrap(
  <>
    <path d="M3 5H13" />
    <path d="M5 5V14H11V5" />
    <path d="M6 5V3H10V5" />
    <path d="M7 7V12M9 7V12" />
  </>,
);

export const IconLayer = wrap(
  <>
    <path d="M8 2L14 5L8 8L2 5L8 2Z" />
    <path d="M2 8L8 11L14 8" />
    <path d="M2 11L8 14L14 11" />
  </>,
);

export const IconZoomIn = wrap(
  <>
    <circle cx="7" cy="7" r="4" />
    <path d="M10 10L14 14" />
    <path d="M5 7H9M7 5V9" />
  </>,
);

export const IconZoomOut = wrap(
  <>
    <circle cx="7" cy="7" r="4" />
    <path d="M10 10L14 14" />
    <path d="M5 7H9" />
  </>,
);

export const IconReset = wrap(
  <>
    <path d="M3 8C3 5 5 3 8 3C10 3 12 4 13 6" />
    <path d="M13 3V6H10" />
    <path d="M13 8C13 11 11 13 8 13C6 13 4 12 3 10" />
    <path d="M3 13V10H6" />
  </>,
);

export const IconRotateLeft = wrap(
  <>
    <path d="M3 8C3 5 5 3 8 3C10 3 12 4 13 6" />
    <path d="M3 3V6H6" />
    <path d="M11 9V13H7V9H11Z" />
  </>,
);

export const IconRotateRight = wrap(
  <>
    <path d="M13 8C13 5 11 3 8 3C6 3 4 4 3 6" />
    <path d="M13 3V6H10" />
    <path d="M5 9V13H9V9H5Z" />
  </>,
);
