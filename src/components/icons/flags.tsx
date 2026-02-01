import { type SVGProps } from 'react'

interface FlagProps extends SVGProps<SVGSVGElement> {
  className?: string
}

// United States flag (for English)
export function FlagUS({ className, ...props }: FlagProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 24"
      className={className}
      {...props}
    >
      <rect width="32" height="24" fill="#B22234" />
      <path
        d="M0 2.77h32M0 6.46h32M0 10.15h32M0 13.85h32M0 17.54h32M0 21.23h32"
        stroke="#fff"
        strokeWidth="1.85"
      />
      <rect width="12.8" height="12.92" fill="#3C3B6E" />
      <g fill="#fff">
        <circle cx="1.07" cy="1.08" r="0.6" />
        <circle cx="3.2" cy="1.08" r="0.6" />
        <circle cx="5.33" cy="1.08" r="0.6" />
        <circle cx="7.47" cy="1.08" r="0.6" />
        <circle cx="9.6" cy="1.08" r="0.6" />
        <circle cx="11.73" cy="1.08" r="0.6" />
        <circle cx="2.13" cy="2.15" r="0.6" />
        <circle cx="4.27" cy="2.15" r="0.6" />
        <circle cx="6.4" cy="2.15" r="0.6" />
        <circle cx="8.53" cy="2.15" r="0.6" />
        <circle cx="10.67" cy="2.15" r="0.6" />
        <circle cx="1.07" cy="3.23" r="0.6" />
        <circle cx="3.2" cy="3.23" r="0.6" />
        <circle cx="5.33" cy="3.23" r="0.6" />
        <circle cx="7.47" cy="3.23" r="0.6" />
        <circle cx="9.6" cy="3.23" r="0.6" />
        <circle cx="11.73" cy="3.23" r="0.6" />
        <circle cx="2.13" cy="4.31" r="0.6" />
        <circle cx="4.27" cy="4.31" r="0.6" />
        <circle cx="6.4" cy="4.31" r="0.6" />
        <circle cx="8.53" cy="4.31" r="0.6" />
        <circle cx="10.67" cy="4.31" r="0.6" />
        <circle cx="1.07" cy="5.38" r="0.6" />
        <circle cx="3.2" cy="5.38" r="0.6" />
        <circle cx="5.33" cy="5.38" r="0.6" />
        <circle cx="7.47" cy="5.38" r="0.6" />
        <circle cx="9.6" cy="5.38" r="0.6" />
        <circle cx="11.73" cy="5.38" r="0.6" />
        <circle cx="2.13" cy="6.46" r="0.6" />
        <circle cx="4.27" cy="6.46" r="0.6" />
        <circle cx="6.4" cy="6.46" r="0.6" />
        <circle cx="8.53" cy="6.46" r="0.6" />
        <circle cx="10.67" cy="6.46" r="0.6" />
        <circle cx="1.07" cy="7.54" r="0.6" />
        <circle cx="3.2" cy="7.54" r="0.6" />
        <circle cx="5.33" cy="7.54" r="0.6" />
        <circle cx="7.47" cy="7.54" r="0.6" />
        <circle cx="9.6" cy="7.54" r="0.6" />
        <circle cx="11.73" cy="7.54" r="0.6" />
        <circle cx="2.13" cy="8.62" r="0.6" />
        <circle cx="4.27" cy="8.62" r="0.6" />
        <circle cx="6.4" cy="8.62" r="0.6" />
        <circle cx="8.53" cy="8.62" r="0.6" />
        <circle cx="10.67" cy="8.62" r="0.6" />
        <circle cx="1.07" cy="9.69" r="0.6" />
        <circle cx="3.2" cy="9.69" r="0.6" />
        <circle cx="5.33" cy="9.69" r="0.6" />
        <circle cx="7.47" cy="9.69" r="0.6" />
        <circle cx="9.6" cy="9.69" r="0.6" />
        <circle cx="11.73" cy="9.69" r="0.6" />
        <circle cx="2.13" cy="10.77" r="0.6" />
        <circle cx="4.27" cy="10.77" r="0.6" />
        <circle cx="6.4" cy="10.77" r="0.6" />
        <circle cx="8.53" cy="10.77" r="0.6" />
        <circle cx="10.67" cy="10.77" r="0.6" />
        <circle cx="1.07" cy="11.85" r="0.6" />
        <circle cx="3.2" cy="11.85" r="0.6" />
        <circle cx="5.33" cy="11.85" r="0.6" />
        <circle cx="7.47" cy="11.85" r="0.6" />
        <circle cx="9.6" cy="11.85" r="0.6" />
        <circle cx="11.73" cy="11.85" r="0.6" />
      </g>
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

// Taiwan flag (for Traditional Chinese)
export function FlagTW({ className, ...props }: FlagProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 24"
      className={className}
      {...props}
    >
      <rect width="32" height="24" fill="#FE0000" />
      <rect width="16" height="12" fill="#000095" />
      <g fill="#fff">
        <circle cx="8" cy="6" r="4" />
        <circle cx="8" cy="6" r="3" fill="#000095" />
        <polygon points="8,2 8.7,5 11.5,5 9.4,6.9 10.1,9.9 8,8 5.9,9.9 6.6,6.9 4.5,5 7.3,5" fill="#fff" />
      </g>
    </svg>
  )
}

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
