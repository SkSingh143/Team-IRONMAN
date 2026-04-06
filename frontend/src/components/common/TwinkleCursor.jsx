import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TwinkleCursor() {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    let lastTime = Date.now();
    
    const handleMouseMove = (e) => {
      const now = Date.now();
      // Adjust throttle for denser or sparser stars. 40ms is a good balance.
      if (now - lastTime > 40) {
        lastTime = now;
        const newParticle = {
          id: now + Math.random(),
          x: e.clientX,
          y: e.clientY,
          offsetX: (Math.random() - 0.5) * 30,
          offsetY: (Math.random() - 0.5) * 30,
          scale: Math.random() * 0.8 + 0.4
        };
        
        setParticles(prev => {
          // Filter out explicitly old items if we don't rely only on framer motion
          return [...prev, newParticle].slice(-30); 
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    // Cleanup loop for particles that might get stuck
    const cleanupInterval = setInterval(() => {
      const threshold = Date.now() - 1000;
      setParticles(prev => prev.filter(p => parseInt(p.id) > threshold));
    }, 1000);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(cleanupInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 1, scale: p.scale }}
            animate={{ 
              opacity: 0, 
              scale: 0,
              x: p.offsetX,
              y: p.offsetY + Math.random() * 10 // random drift direction
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="absolute rounded-full shadow-[0_0_10px_2px_rgba(255,255,255,0.8)]"
            style={{
              left: p.x - 2,
              top: p.y - 2,
              width: '5px',
              height: '5px',
              backgroundColor: '#ffffff',
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
