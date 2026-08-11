// Iconos inline: evitan una dependencia externa y mantienen el bundle mínimo.
type P = { className?: string };

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

export const Layers = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="m12 3 9 5-9 5-9-5 9-5Z" />
    <path d="m3 14 9 5 9-5" />
  </svg>
);

export const Swatch = ({ className }: P) => (
  <svg {...base} className={className}>
    <circle cx="9" cy="9" r="5.5" />
    <path d="M14 6.5A5.5 5.5 0 1 1 14 17" />
  </svg>
);

export const Globe2 = ({ className }: P) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.6 2.5 15.4 0 18-2.5-2.6-2.5-15.4 0-18Z" />
  </svg>
);

export const Package = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
    <path d="m3 8 9 5 9-5M12 13v8" />
  </svg>
);

export const Sparkles = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M12 3.5 13.6 9 19 10.5 13.6 12 12 17.5 10.4 12 5 10.5 10.4 9 12 3.5Z" />
    <path d="M18.5 16.5 19.2 19l2.3.7-2.3.8-.7 2.5-.7-2.5-2.3-.8 2.3-.7.7-2.5Z" />
  </svg>
);

export const Plus = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const Trash = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
  </svg>
);

export const Download = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M12 4v11m0 0 4-4m-4 4-4-4M4 19h16" />
  </svg>
);

export const Refresh = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M20 12a8 8 0 1 1-2.6-5.9M20 4v4h-4" />
  </svg>
);

export const Check = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </svg>
);

export const ArrowLeft = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M19 12H5m0 0 6-6m-6 6 6 6" />
  </svg>
);

export const Share2 = ({ className }: P) => (
  <svg {...base} className={className}>
    <circle cx="18" cy="5" r="2.6" />
    <circle cx="6" cy="12" r="2.6" />
    <circle cx="18" cy="19" r="2.6" />
    <path d="m8.3 10.8 7.4-4.3M8.3 13.2l7.4 4.3" />
  </svg>
);

export const Shield = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M12 3l7.5 3v5.4c0 4.3-3 8.2-7.5 9.6-4.5-1.4-7.5-5.3-7.5-9.6V6L12 3Z" />
    <path d="m9 11.8 2.1 2.1L15 10" />
  </svg>
);

export const Alert = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M12 4.5 21 20H3l9-15.5Z" />
    <path d="M12 10v4M12 17h.01" />
  </svg>
);

export const Upload = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M12 15.5V4M8.2 7.8 12 4l3.8 3.8M4.5 15.5v2.6a1.9 1.9 0 0 0 1.9 1.9h11.2a1.9 1.9 0 0 0 1.9-1.9v-2.6" />
  </svg>
);

export const Scale = ({ className }: P) => (
  <svg {...base} className={className}>
    <path d="M12 4v16M7 20h10M3.5 9h17M6.5 5.5 3.5 9l3 3.5L9.5 9l-3-3.5ZM17.5 5.5 14.5 9l3 3.5L20.5 9l-3-3.5Z" />
  </svg>
);

export const Ban = ({ className }: P) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m6 6 12 12" />
  </svg>
);
