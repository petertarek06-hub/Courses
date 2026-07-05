// src/components/ui/BrandIcons.tsx
//
// lucide-react removed brand/logo icons (trademark reasons), so Facebook,
// Instagram, and Youtube are no longer exported from it. These are drop-in
// replacements built with the exact same stroke style lucide uses (24x24
// viewBox, round caps/joins, currentColor), so they render identically to
// every other lucide icon in the app and accept the same props (size,
// className, etc.) — you can swap `import { Facebook } from 'lucide-react'`
// for `import { Facebook } from '@/components/ui/BrandIcons'` with no other
// changes needed.

import React from 'react';

type IconProps = React.SVGProps<SVGSVGElement> & {
  size?: number | string;
};

function createIcon(path: React.ReactNode) {
  return function Icon({ size = 24, ...props }: IconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        {path}
      </svg>
    );
  };
}

export const Facebook = createIcon(
  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
);

export const Instagram = createIcon(
  <>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.5" y1="6.5" y2="6.5" />
  </>
);

export const Youtube = createIcon(
  <>
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <path d="m10 15 5-3-5-3z" />
  </>
);
