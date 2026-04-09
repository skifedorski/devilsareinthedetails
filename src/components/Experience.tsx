'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, ContactShadows } from '@react-three/drei';
import Heart from './Heart';

export default function Experience() {
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

        <Suspense fallback={null}>
          <Heart />
        </Suspense>
        
        <Environment preset="studio" environmentIntensity={0.1} />
      </Canvas>
    </div>
  );
}