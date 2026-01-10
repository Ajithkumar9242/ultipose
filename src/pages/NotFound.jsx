import React from 'react';
import { Link } from 'react-router-dom'; // Imported from old code
import { ArrowLeft } from 'lucide-react'; 

// --- Logic from Old Code ---
const DEFAULT_STORE_CODE =
  import.meta.env.VITE_DEFAULT_STORE_CODE || "ultipos-test-store-1";
// ---------------------------

// Refined SVG Icons for floating background elements
const FoodItemIcon = ({ type, className = "" }) => {
  let pathD = "";
  let fillPrimary = "#fdba74"; // Tailwind orange-300
  
  switch (type) {
    case 'burger':
      pathD = "M22 10.5C22 14.6421 18.6421 18 14.5 18H9.5C5.35786 18 2 14.6421 2 10.5C2 6.35786 5.35786 3 9.5 3H14.5C18.6421 3 22 6.35786 22 10.5Z M2 10H22V14H2V10Z"; 
      break;
    case 'pizza':
      pathD = "M12 2L22 12C22 12 17.5 22 12 22C6.5 22 2 12 2 12L12 2Z M12 5L7 12H17L12 5Z"; 
      break;
    case 'coffee':
      pathD = "M7 10H17V17H7V10Z M19 12H21V15H19V12Z M7 10C7 8.34315 8.34315 7 10 7H14C15.6569 7 17 8.34315 17 10V10H7V10Z M9 3H15V6H9V3Z"; 
      break;
    default:
      pathD = "";
  }

  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d={pathD} fill={fillPrimary} />
    </svg>
  );
};

const DonutSVG = () => (
  <svg 
    width="140" 
    height="140" 
    viewBox="0 0 100 100" 
    className="w-32 h-32 md:w-48 md:h-48 drop-shadow-lg"
  >
    {/* Base Dough */}
    <circle cx="50" cy="50" r="40" fill="#fbd38d" />
    {/* Orange Glaze */}
    <path 
      d="M50 15 C 30 15, 15 30, 15 50 C 15 70, 30 85, 50 85 C 70 85, 85 70, 85 50 C 85 30, 70 15, 50 15 Z" 
      fill="#fb923c" 
      stroke="#ea580c" 
      strokeWidth="2" 
      strokeLinecap="round"
      className="scale-[0.9] origin-center"
    />
    {/* Donut Hole */}
    <circle cx="50" cy="50" r="12" fill="#fff7ed" />
    
    {/* Sprinkles */}
    <rect x="35" y="25" width="2" height="6" rx="1" fill="#fcd34d" transform="rotate(20 35 25)" />
    <rect x="65" y="30" width="2" height="6" rx="1" fill="#fdbf6b" transform="rotate(-15 65 30)" />
    <rect x="50" y="70" width="2" height="6" rx="1" fill="#fcd34d" transform="rotate(45 50 70)" />
    <rect x="25" y="50" width="2" height="6" rx="1" fill="#fdbf6b" transform="rotate(90 25 50)" />
    <rect x="75" y="55" width="2" height="6" rx="1" fill="#fcd34d" transform="rotate(-30 75 55)" />
  </svg>
);

const NotFound = () => {
  const foodIcons = [
    { type: 'burger', delay: '0s', size: 'w-8 h-8 md:w-10 md:h-10' },
    { type: 'pizza', delay: '2s', size: 'w-6 h-6 md:w-8 md:h-8' },
    { type: 'coffee', delay: '4s', size: 'w-7 h-7 md:w-9 md:h-9' },
    { type: 'burger', delay: '6s', size: 'w-9 h-9 md:w-11 md:h-11' },
    { type: 'pizza', delay: '8s', size: 'w-7 h-7 md:w-9 md:h-9' },
    { type: 'coffee', delay: '10s', size: 'w-8 h-8 md:w-10 md:h-10' },
  ];

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 text-stone-800 p-4 overflow-hidden">
      
      {/* Background Floating Icons */}
      {foodIcons.map((item, index) => (
        <div 
          key={index} 
          className="absolute opacity-0 animate-bg-float" 
          style={{ 
            animationDelay: item.delay, 
            left: `${Math.random() * 90}%`, 
            top: `${Math.random() * 90}%`,
            animationDuration: `${10 + Math.random() * 10}s`,
            animationIterationCount: 'infinite',
            animationDirection: index % 2 === 0 ? 'normal' : 'reverse',
          }}
        >
          <FoodItemIcon type={item.type} className={`text-orange-300/50 ${item.size}`} />
        </div>
      ))}

      {/* Main Visual Container */}
      <div className="relative flex items-center justify-center font-bold text-[10rem] md:text-[15rem] leading-none select-none text-orange-200 font-mono z-20">
        <span className="text-orange-300">4</span>
        
        {/* The Donut (Animated Zero) */}
        <div className="relative mx-2 animate-float">
           <DonutSVG />
           <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-24 h-4 bg-orange-200/50 rounded-[100%] blur-md animate-shadow-pulse"></div>
        </div>

        <span className="text-orange-300">4</span>
      </div>

      {/* Text Content */}
      <div className="text-center space-y-6 max-w-md z-20 -mt-8">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-stone-800">
          Page Not Found
        </h2>
        <p className="text-stone-600 text-lg">
          Sorry, the page you are looking for could not be found. It may have been eaten!
        </p>

        {/* CTA Button - Using Link from react-router-dom with Old Code Logic */}
        <Link 
          to={`/`}
          title="Return Home"
          className="group inline-flex items-center gap-2 px-8 py-3 bg-orange-500 text-white rounded-full font-semibold shadow-lg hover:bg-orange-600 hover:shadow-orange-500/50 transition-all duration-300 transform hover:-translate-y-1"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          Back to Menu
        </Link>
      </div>

      {/* Custom Animation Styles */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes shadow-pulse {
          0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.5; }
          50% { transform: translateX(-50%) scale(0.8); opacity: 0.3; }
        }
        @keyframes bg-float {
          0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
          10% { opacity: 0.3; }
          90% { opacity: 0.3; }
          100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-shadow-pulse {
          animation: shadow-pulse 6s ease-in-out infinite;
        }
        .animate-bg-float {
          animation-name: bg-float;
          animation-timing-function: linear;
        }
      `}</style>
    </div>
  );
};

export default NotFound;