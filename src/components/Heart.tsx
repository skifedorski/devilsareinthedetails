'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useExperienceStore } from '@/store/useExperienceStore';

export default function Heart() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const elapsedRef = useRef(0);
  const scrollCount = useExperienceStore((state) => state.scrollCount);
  
  // Target rotation based on scroll count
  const targetRotationY = scrollCount * (Math.PI / 16);

  // Deform a sphere to look slightly more like a heart
  // This is a low-fi placeholder until a real .glb is provided
  const geometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(1, 64, 64);
    const posAttribute = geo.attributes.position;
    const v = new THREE.Vector3();
    
    for (let i = 0; i < posAttribute.count; i++) {
      v.fromBufferAttribute(posAttribute, i);
      
      // Simple math deformation to make it slightly heart-like
      const x = v.x;
      const y = v.y;
      const z = v.z;
      
      // Heart equation approximation
      v.y = y + Math.abs(x) * Math.sqrt((8 - Math.abs(x)) / 50) * 1.5;
      v.z = z * (1 - Math.abs(x) / 2);
      
      posAttribute.setXYZ(i, v.x, v.y, v.z);
    }
    
    geo.computeVertexNormals();
    // Move it down slightly to center it after deformation
    geo.translate(0, -0.5, 0); 
    return geo;
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    elapsedRef.current += delta;

    // Smoothly interpolate current rotation towards target rotation
    meshRef.current.rotation.y = THREE.MathUtils.damp(
      meshRef.current.rotation.y,
      targetRotationY,
      4, // lambda/speed
      delta
    );

    // Heartbeat animation
    const t = elapsedRef.current;
    const placeholderBpm = 76 + Math.sin(t * 0.12) * 4; // restrained range: 72-80 BPM
    const beatDuration = 60 / placeholderBpm;
    
    // Create a double-beat pattern (systole/diastole)
    // We use modulo to loop every `beatDuration`
    const phase = (t % beatDuration) / beatDuration;
    
    // Math to create a sharp pump and a smaller secondary pump
    let scale = 1;
    if (phase < 0.15) {
      // First beat (sharp)
      scale = 1 + Math.sin(phase * Math.PI / 0.15) * 0.08;
    } else if (phase > 0.25 && phase < 0.4) {
      // Second beat (smaller)
      scale = 1 + Math.sin((phase - 0.25) * Math.PI / 0.15) * 0.04;
    }

    meshRef.current.scale.setScalar(scale);
    
    // Very slow continuous idle rotation on top of the scroll rotation
    // We apply it to the group or just let it be. Actually, if we damp to targetRotationY, 
    // adding a continuous rotation will fight the damp. Let's just use the scroll rotation.
  });

  return (
    <mesh 
      ref={meshRef} 
      geometry={geometry}
    >
      <meshPhysicalMaterial 
        ref={materialRef}
        color="#4a0404" // Deep crimson
        emissive="#1a0000"
        roughness={0.15} // Wet look
        metalness={0.1}
        clearcoat={0.3}
        clearcoatRoughness={0.1}
        transmission={0.2}
        thickness={0.5}
      />
    </mesh>
  );
}