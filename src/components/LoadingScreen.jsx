import React from 'react';
import { motion } from 'framer-motion';
import { Pizza, Utensils, Coffee, ChefHat } from 'lucide-react';

const LoadingScreen = () => {
  const containerVariants = {
    start: { transition: { staggerChildren: 0.2 } },
    end: { transition: { staggerChildren: 0.2 } },
  };

  const bounceVariants = {
    start: { y: 0 },
    end: { y: -20 },
  };

  const bounceTransition = {
    duration: 0.6,
    repeat: Infinity,
    repeatType: "reverse",
    ease: "easeInOut",
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm">
      
      {/* --- ICON ANIMATION CONTAINER --- */}
      <motion.div 
        className="flex items-end gap-6 mb-8"
        variants={containerVariants}
        initial="start"
        animate="end"
      >
        {/* Icon 1: Pizza */}
        <motion.div variants={bounceVariants} transition={bounceTransition}>
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 shadow-lg shadow-orange-200 border border-orange-200">
            <Pizza size={32} />
          </div>
        </motion.div>

        {/* Icon 2: Chef Hat (Center, slightly larger) */}
        <motion.div 
          variants={bounceVariants} 
          transition={{ ...bounceTransition, delay: 0.1 }}
        >
          <div className="w-20 h-20 bg-orange-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-orange-400">
            <ChefHat size={40} />
          </div>
        </motion.div>

        {/* Icon 3: Coffee/Drink */}
        <motion.div 
          variants={bounceVariants} 
          transition={{ ...bounceTransition, delay: 0.2 }}
        >
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 shadow-lg shadow-orange-200 border border-orange-200">
            <Utensils size={32} />
          </div>
        </motion.div>
      </motion.div>

      {/* --- TEXT ANIMATION --- */}
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-gray-800 tracking-tight">
          Finding Restaurants
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >.</motion.span>
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
          >.</motion.span>
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
          >.</motion.span>
        </h3>
        <p className="text-gray-500 font-medium animate-pulse">Checking for the best food near you...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;