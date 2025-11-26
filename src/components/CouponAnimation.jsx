import React from 'react';
import { motion } from 'framer-motion';
import { Scissors, Percent, Tag, Gift } from 'lucide-react';

const CouponAnimation = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-6 w-full h-full min-h-[300px]">
      <div className="relative">
        {/* --- ANIMATED SCISSORS --- */}
        {/* Moves left to right while snipping */}
        <motion.div 
          animate={{ 
            x: [-30, 30, -30], 
            rotate: [0, 15, 0, 15, 0] // Snip action
          }}
          transition={{ 
            duration: 2.5, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute -top-8 left-0 right-0 mx-auto w-fit text-gray-400 z-10"
        >
          <Scissors size={32} />
        </motion.div>
        
        {/* --- BOUNCING OFFERS ICONS --- */}
        <div className="flex gap-4 mt-4">
          <motion.div 
            animate={{ y: [0, -15, 0] }} 
            transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.1 }} 
            className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center shadow-sm border border-green-200"
          >
            <Percent size={24} />
          </motion.div>

          <motion.div 
            animate={{ y: [0, -15, 0] }} 
            transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.1, delay: 0.1 }} 
            className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shadow-sm border border-blue-200"
          >
            <Tag size={24} />
          </motion.div>

          <motion.div 
            animate={{ y: [0, -15, 0] }} 
            transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.1, delay: 0.2 }} 
            className="w-14 h-14 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center shadow-sm border border-purple-200"
          >
            <Gift size={24} />
          </motion.div>
        </div>
      </div>
      
      {/* --- PULSING TEXT --- */}
      <div className="text-center space-y-1">
        <h4 className="font-bold text-gray-700 text-lg tracking-tight">Slicing Prices...</h4>
        <p className="text-sm text-gray-400 font-medium animate-pulse">Hunting for the best deals for you</p>
      </div>
    </div>
  );
};

export default CouponAnimation;