interface IconProps {
  className?: string;
  size?: number;
}

export function MoonIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  );
}

export function WolfIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M4 2L6 8L2 12L6 14L8 22H16L18 14L22 12L18 8L20 2L15 6H9L4 2Z"
        fill="currentColor"
      />
      <circle cx="9" cy="10" r="1" fill="var(--gold, #b8954a)" />
      <circle cx="15" cy="10" r="1" fill="var(--gold, #b8954a)" />
    </svg>
  );
}

export function CrystalBallIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="11" r="7" fill="currentColor" opacity="0.8" />
      <ellipse cx="12" cy="11" rx="4" ry="4" fill="currentColor" opacity="0.3" />
      <path d="M8 18H16L15 20H9L8 18Z" fill="currentColor" opacity="0.6" />
      <path d="M7 20H17V21H7V20Z" fill="currentColor" />
      <circle cx="10" cy="9" r="1.5" fill="white" opacity="0.3" />
    </svg>
  );
}

export function PotionIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M10 2H14V6L18 12V20C18 21 17 22 16 22H8C7 22 6 21 6 20V12L10 6V2Z" fill="currentColor" opacity="0.8" />
      <path d="M10 2H14V4H10V2Z" fill="currentColor" />
      <circle cx="10" cy="16" r="1" fill="white" opacity="0.3" />
      <circle cx="13" cy="14" r="0.7" fill="white" opacity="0.2" />
    </svg>
  );
}

export function BowIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M4 4C4 4 8 8 12 12M12 12L20 4M12 12C8 16 4 20 4 20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M20 4L22 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 14L20 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function HeartArrowIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 21L10.55 19.7C5.4 15.1 2 12.1 2 8.5C2 5.4 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.4 22 8.5C22 12.1 18.6 15.1 13.45 19.7L12 21Z"
        fill="currentColor"
      />
      <path d="M2 12L22 6" stroke="var(--gold, #b8954a)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M22 6L20 4M22 6L20 8" stroke="var(--gold, #b8954a)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function VillageIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M3 21H21" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 21V11L9 7V21" fill="currentColor" opacity="0.6" />
      <path d="M9 21V9L12 6L15 9V21" fill="currentColor" opacity="0.8" />
      <path d="M15 21V11L19 7V21" fill="currentColor" opacity="0.6" />
      <path d="M12 6V3" stroke="currentColor" strokeWidth="1" />
      <rect x="11" y="13" width="2" height="3" fill="var(--parchment, #f4e8d0)" opacity="0.6" />
    </svg>
  );
}

export function SkullIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 2C7.58 2 4 5.58 4 10C4 13.5 6 16 8 17V20H16V17C18 16 20 13.5 20 10C20 5.58 16.42 2 12 2Z"
        fill="currentColor"
      />
      <circle cx="9" cy="10" r="2" fill="var(--parchment, #f4e8d0)" />
      <circle cx="15" cy="10" r="2" fill="var(--parchment, #f4e8d0)" />
      <path d="M10 15V20M12 15V20M14 15V20" stroke="var(--parchment, #f4e8d0)" strokeWidth="1" />
    </svg>
  );
}

export function HealIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 4V20M4 12H20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function NightSkyIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor" />
      <circle cx="18" cy="5" r="0.8" fill="currentColor" opacity="0.6" />
      <circle cx="20" cy="8" r="0.5" fill="currentColor" opacity="0.4" />
      <circle cx="16" cy="3" r="0.5" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

export function SunIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="5" fill="currentColor" />
      <path
        d="M12 2V4M12 20V22M4 12H2M22 12H20M5.64 5.64L7.05 7.05M16.95 16.95L18.36 18.36M5.64 18.36L7.05 16.95M16.95 7.05L18.36 5.64"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
