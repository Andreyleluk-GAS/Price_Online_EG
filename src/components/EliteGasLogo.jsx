export function EliteGasLogo({ className, size = 56 }) {
  return (
    <svg 
      className={className} 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer clean white background */}
      <circle cx="50" cy="50" r="49" fill="#ffffff" />
      
      {/* Inner red ring */}
      <circle cx="50" cy="50" r="32" stroke="#E02020" strokeWidth="11" />
      
      {/* Rotated text and masking rectangle */}
      <g transform="translate(50, 50) rotate(-14) translate(-50, -50)">
        {/* White rectangle to cut the red ring */}
        <rect x="5" y="36" width="90" height="28" fill="#ffffff" />
        
        {/* ELITE GAS Text */}
        <text 
          x="50" 
          y="54" 
          fontFamily="'Montserrat', 'Inter', sans-serif" 
          fontWeight="900" 
          fontSize="15.5" 
          fill="#008033" 
          textAnchor="middle" 
          dominantBaseline="middle" 
          letterSpacing="0.5"
        >
          ELITE GAS
        </text>
      </g>
    </svg>
  );
}
