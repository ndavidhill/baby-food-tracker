import { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

export function SunriseIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3v3" />
      <path d="M5.6 8.6 7 10" />
      <path d="M18.4 8.6 17 10" />
      <path d="M3 15h3.5a5.5 5.5 0 0 1 11 0H21" />
      <path d="M3 19h18" />
    </svg>
  );
}

export function LeafIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 19c0-8 5-13 14-13 0 9-5 14-13 14-2 0-3-1-3-3 0-1 .3-2 1-3" />
      <path d="M9 15c2-3 4-4.5 7-5.5" />
    </svg>
  );
}

export function JournalIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 4h10a2 2 0 0 1 2 2v14H8a2 2 0 0 1-2-2V4Z" />
      <path d="M6 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2" />
      <path d="M9.5 9h5" />
      <path d="M9.5 12.5h5" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 7h16" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 4.5 21 19H3L12 4.5Z" />
      <path d="M12 10v4" />
      <path d="M12 16.8h.01" />
    </svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5 5 6v5.5c0 4 3 7 7 9 4-2 7-5 7-9V6l-7-2.5Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function SparkIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 4c.6 3.5 1.9 4.8 5.4 5.4-3.5.6-4.8 1.9-5.4 5.4-.6-3.5-1.9-4.8-5.4-5.4C10.1 8.8 11.4 7.5 12 4Z" />
      <path d="M18.5 15c.3 1.6.9 2.2 2.5 2.5-1.6.3-2.2.9-2.5 2.5-.3-1.6-.9-2.2-2.5-2.5 1.6-.3 2.2-.9 2.5-2.5Z" />
    </svg>
  );
}

export function InsightsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 17a8 8 0 1 1 14 0" />
      <path d="M12 13.5 15.5 9.5" />
      <circle cx="12" cy="13.5" r="1" />
    </svg>
  );
}

export function SproutIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 21V10.5" />
      <path d="M12 12C9.4 12 7.8 10.4 7.8 7.8c2.6 0 4.2 1.6 4.2 4.2Z" />
      <path d="M12 10.5c0-2.8 1.7-4.5 4.5-4.5C16.5 8.8 14.8 10.5 12 10.5Z" />
    </svg>
  );
}

export function AppleIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 8.2C10.5 6.7 8 6.7 6.7 8.3c-1.3 1.6-1 4.3.3 6.4 1 1.6 2.3 3 3.5 3.6.9.4 2 .4 3 0 1.2-.6 2.5-2 3.5-3.6 1.3-2.1 1.6-4.8.3-6.4C16 6.7 13.5 6.7 12 8.2Z" />
      <path d="M12 8.2V4.6" />
      <path d="M12.3 5.7C13.1 4.5 14.4 4.1 15.7 4.3 15.7 5.6 14.7 6.7 13.3 6.9" />
    </svg>
  );
}

export function WheatIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 21v-9.5" />
      <path d="M12 11.5c1.7-.4 2.7-1.8 2.9-3.7C13.1 8.2 12 9.5 12 11.5Z" />
      <path d="M12 11.5c-1.7-.4-2.7-1.8-2.9-3.7C10.9 8.2 12 9.5 12 11.5Z" />
      <path d="M12 8c1.7-.4 2.7-1.8 2.9-3.7C13.1 4.7 12 6 12 8Z" />
      <path d="M12 8c-1.7-.4-2.7-1.8-2.9-3.7C10.9 4.7 12 6 12 8Z" />
    </svg>
  );
}

export function EggIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5c-3.2 0-5.8 4.6-5.8 9a5.8 5.8 0 0 0 11.6 0c0-4.4-2.6-9-5.8-9Z" />
    </svg>
  );
}

export function DropIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5s5.8 6.3 5.8 10.5a5.8 5.8 0 0 1-11.6 0C6.2 9.8 12 3.5 12 3.5Z" />
    </svg>
  );
}
