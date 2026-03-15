'use client';

import { useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, Float, ContactShadows } from '@react-three/drei';
import Heart from './Heart';
import { useExperienceStore } from '@/store/useExperienceStore';

export default function Experience() {
  const { scene, incrementScroll, scrollCount, setScene } = useExperienceStore();
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = (e: Event) => {
      // Only track scroll if we are in the heart scene
      if (scene !== 'heart') return;

      // Throttle scroll events slightly to prevent jumping too fast
      if (scrollTimeout.current) return;
      
      incrementScroll();
      
      scrollTimeout.current = setTimeout(() => {
        scrollTimeout.current = null;
      }, 100); // 100ms throttle
    };

    window.addEventListener('wheel', handleScroll);
    window.addEventListener('touchmove', handleScroll);
    return () => {
      window.removeEventListener('wheel', handleScroll);
      window.removeEventListener('touchmove', handleScroll);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, [scene, incrementScroll]);

  // Check if we reached 33 scrolls
  useEffect(() => {
    if (scene === 'heart' && scrollCount >= 33) {
      setScene('reflection');
    }
  }, [scrollCount, scene, setScene]);

  return (
    <div className="fixed inset-0 w-full h-full z-0">
      <Canvas 
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={['#050505']} />
        
        {/* Cinematic Lighting */}
        <ambientLight intensity={0.1} />
        
        {/* Main dramatic spotlight */}
        <spotLight 
          position={[0, 5, 5]} 
          angle={0.4} 
          penumbra={1} 
          intensity={4} 
          color="#ffffff"
          castShadow
        />
        
        {/* Soft rim lighting */}
        <spotLight 
          position={[-5, 0, -5]} 
          angle={0.5} 
          penumbra={1} 
          intensity={2} 
          color="#8a1c1c" // Subtle red rim
        />
        
        <ContactShadows 
          position={[0, -2, 0]} 
          opacity={0.4} 
          scale={10} 
          blur={2.5} 
          far={4} 
        />

        <Float
          speed={1.5} // Animation speed
          rotationIntensity={0.1} // XYZ rotation intensity
          floatIntensity={0.2} // Up/down float intensity
          floatingRange={[-0.1, 0.1]} // Range of y-axis values
        >
          <Heart />
        </Float>
        
        <Environment preset="studio" environmentIntensity={0.1} />
      </Canvas>
    </div>
  );
}