import { type SVGProps } from 'react'

interface FlagProps extends SVGProps<SVGSVGElement> {
  className?: string
}

// US/UK combined flag with diagonal split (for English)
export function FlagEN({ className, ...props }: FlagProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 24"
      className={className}
      {...props}
    >
      <defs>
        <clipPath id="topLeft">
          <polygon points="0,0 32,0 0,24" />
        </clipPath>
        <clipPath id="bottomRight">
          <polygon points="32,0 32,24 0,24" />
        </clipPath>
      </defs>
      {/* US Flag (top-left triangle) */}
      <g clipPath="url(#topLeft)">
        <rect width="32" height="24" fill="#B22234" />
        <path
          d="M0 2.77h32M0 6.46h32M0 10.15h32M0 13.85h32M0 17.54h32M0 21.23h32"
          stroke="#fff"
          strokeWidth="1.85"
        />
        <rect width="12.8" height="12.92" fill="#3C3B6E" />
        <g fill="#fff">
          <circle cx="1.6" cy="1.6" r="0.5" />
          <circle cx="3.5" cy="1.6" r="0.5" />
          <circle cx="5.4" cy="1.6" r="0.5" />
          <circle cx="7.3" cy="1.6" r="0.5" />
          <circle cx="9.2" cy="1.6" r="0.5" />
          <circle cx="11.1" cy="1.6" r="0.5" />
          <circle cx="2.55" cy="3.2" r="0.5" />
          <circle cx="4.45" cy="3.2" r="0.5" />
          <circle cx="6.35" cy="3.2" r="0.5" />
          <circle cx="8.25" cy="3.2" r="0.5" />
          <circle cx="10.15" cy="3.2" r="0.5" />
          <circle cx="1.6" cy="4.8" r="0.5" />
          <circle cx="3.5" cy="4.8" r="0.5" />
          <circle cx="5.4" cy="4.8" r="0.5" />
          <circle cx="7.3" cy="4.8" r="0.5" />
          <circle cx="9.2" cy="4.8" r="0.5" />
          <circle cx="11.1" cy="4.8" r="0.5" />
          <circle cx="2.55" cy="6.4" r="0.5" />
          <circle cx="4.45" cy="6.4" r="0.5" />
          <circle cx="6.35" cy="6.4" r="0.5" />
          <circle cx="8.25" cy="6.4" r="0.5" />
          <circle cx="10.15" cy="6.4" r="0.5" />
          <circle cx="1.6" cy="8" r="0.5" />
          <circle cx="3.5" cy="8" r="0.5" />
          <circle cx="5.4" cy="8" r="0.5" />
          <circle cx="7.3" cy="8" r="0.5" />
          <circle cx="9.2" cy="8" r="0.5" />
          <circle cx="11.1" cy="8" r="0.5" />
          <circle cx="2.55" cy="9.6" r="0.5" />
          <circle cx="4.45" cy="9.6" r="0.5" />
          <circle cx="6.35" cy="9.6" r="0.5" />
          <circle cx="8.25" cy="9.6" r="0.5" />
          <circle cx="10.15" cy="9.6" r="0.5" />
          <circle cx="1.6" cy="11.2" r="0.5" />
          <circle cx="3.5" cy="11.2" r="0.5" />
          <circle cx="5.4" cy="11.2" r="0.5" />
          <circle cx="7.3" cy="11.2" r="0.5" />
          <circle cx="9.2" cy="11.2" r="0.5" />
          <circle cx="11.1" cy="11.2" r="0.5" />
        </g>
      </g>
      {/* UK Flag (bottom-right triangle) */}
      <g clipPath="url(#bottomRight)">
        <rect width="32" height="24" fill="#012169" />
        {/* White diagonals */}
        <path d="M0,0 L32,24 M32,0 L0,24" stroke="#fff" strokeWidth="4" />
        {/* Red diagonals */}
        <path d="M0,0 L32,24" stroke="#C8102E" strokeWidth="2" />
        <path d="M32,0 L0,24" stroke="#C8102E" strokeWidth="2" />
        {/* White cross */}
        <path d="M16,0 V24 M0,12 H32" stroke="#fff" strokeWidth="6" />
        {/* Red cross */}
        <path d="M16,0 V24 M0,12 H32" stroke="#C8102E" strokeWidth="3.5" />
      </g>
      {/* Diagonal divider line */}
      <line x1="0" y1="24" x2="32" y2="0" stroke="#fff" strokeWidth="1" />
    </svg>
  )
}

// China flag (for Simplified Chinese)
export function FlagCN({ className, ...props }: FlagProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 24"
      className={className}
      {...props}
    >
      <rect width="32" height="24" fill="#DE2910" />
      <g fill="#FFDE00">
        <polygon points="5,2 6.2,5.2 3.2,3.4 6.8,3.4 3.8,5.2" />
        <polygon points="10,1 10.4,2 9.4,1.4 10.6,1.4 9.6,2" transform="rotate(23 10 1.5)" />
        <polygon points="12,3 12.4,4 11.4,3.4 12.6,3.4 11.6,4" transform="rotate(46 12 3.5)" />
        <polygon points="12,6 12.4,7 11.4,6.4 12.6,6.4 11.6,7" transform="rotate(70 12 6.5)" />
        <polygon points="10,8 10.4,9 9.4,8.4 10.6,8.4 9.6,9" transform="rotate(20 10 8.5)" />
      </g>
    </svg>
  )
}

// Taiwan/Hong Kong combined flag with diagonal split (for Traditional Chinese)
export function FlagTC({ className, ...props }: FlagProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 24"
      className={className}
      {...props}
    >
      <defs>
        <clipPath id="tcTopLeft">
          <polygon points="0,0 32,0 0,24" />
        </clipPath>
        <clipPath id="tcBottomRight">
          <polygon points="32,0 32,24 0,24" />
        </clipPath>
      </defs>
      {/* Taiwan Flag (top-left triangle) */}
      <g clipPath="url(#tcTopLeft)">
        <rect width="32" height="24" fill="#FE0000" />
        <rect width="16" height="12" fill="#000095" />
        {/* White sun */}
        <g fill="#fff" transform="translate(8, 6)">
          <circle cx="0" cy="0" r="3" />
          {/* 12 rays */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
            <line
              key={angle}
              x1="0"
              y1="-2.5"
              x2="0"
              y2="-4.5"
              stroke="#fff"
              strokeWidth="0.8"
              transform={`rotate(${angle})`}
            />
          ))}
          <circle cx="0" cy="0" r="2" fill="#000095" />
          <circle cx="0" cy="0" r="1.5" fill="#fff" />
        </g>
      </g>
      {/* Hong Kong Flag (bottom-right triangle) */}
      <g clipPath="url(#tcBottomRight)">
        <rect width="32" height="24" fill="#DE2110" />
        {/* Bauhinia flower */}
        <g fill="#fff" transform="translate(16, 12)">
          <circle cx="0" cy="0" r="1" />
          {/* 5 petals */}
          <path d="M0,-5 C1.2,-3.5 1.2,-1.5 0,0 C-1.2,-1.5 -1.2,-3.5 0,-5" transform="rotate(0)" />
          <path d="M0,-5 C1.2,-3.5 1.2,-1.5 0,0 C-1.2,-1.5 -1.2,-3.5 0,-5" transform="rotate(72)" />
          <path d="M0,-5 C1.2,-3.5 1.2,-1.5 0,0 C-1.2,-1.5 -1.2,-3.5 0,-5" transform="rotate(144)" />
          <path d="M0,-5 C1.2,-3.5 1.2,-1.5 0,0 C-1.2,-1.5 -1.2,-3.5 0,-5" transform="rotate(216)" />
          <path d="M0,-5 C1.2,-3.5 1.2,-1.5 0,0 C-1.2,-1.5 -1.2,-3.5 0,-5" transform="rotate(288)" />
          {/* Red stars on petals */}
          <g fill="#DE2110">
            <circle cx="0" cy="-3.2" r="0.5" transform="rotate(0)" />
            <circle cx="0" cy="-3.2" r="0.5" transform="rotate(72)" />
            <circle cx="0" cy="-3.2" r="0.5" transform="rotate(144)" />
            <circle cx="0" cy="-3.2" r="0.5" transform="rotate(216)" />
            <circle cx="0" cy="-3.2" r="0.5" transform="rotate(288)" />
          </g>
        </g>
      </g>
      {/* Diagonal divider line */}
      <line x1="0" y1="24" x2="32" y2="0" stroke="#fff" strokeWidth="1" />
    </svg>
  )
}

// Keep old name as alias for backwards compatibility
export { FlagTC as FlagHK }

// Japan flag
export function FlagJP({ className, ...props }: FlagProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 24"
      className={className}
      {...props}
    >
      <rect width="32" height="24" fill="#fff" />
      <circle cx="16" cy="12" r="7.2" fill="#BC002D" />
    </svg>
  )
}

// Keep old names as aliases for backwards compatibility
export { FlagEN as FlagUS }
export { FlagTC as FlagTW }
