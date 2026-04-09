'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useExperienceStore } from '@/store/useExperienceStore';

// Each throttled input event rotates the heart by this fixed step.
// 198 events × 60° = 11 880° total to unlock the reflection scene.
const STEP_DEG = 60;
const STEP_RAD = STEP_DEG * (Math.PI / 180);
const THRESHOLD_DEG = 11_880;
const THROTTLE_MS = 100;

export default function Heart() {
  const groupRef = useRef<THREE.Group>(null);
  const { scene: gltfScene, animations } = useGLTF('/heart_animated.glb');
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const introReady = useExperienceStore((state) => state.introReady);
  const elapsedRef = useRef(0);

  // Accumulated target quaternion — updated on every throttled scroll event.
  const targetQuatRef = useRef(new THREE.Quaternion());
  // Running total of rotation (degrees) used to unlock the next scene.
  const totalDegreesRef = useRef(0);
  // Timestamp of the last accepted scroll event (throttle gate).
  const lastScrollRef = useRef(0);
  // Last touch position for mobile swipe tracking.
  const prevTouchRef = useRef({ x: 0, y: 0 });

  // Apply wireframe material and compute bounding box before first render.
  const { center, scale } = useMemo(() => {
    gltfScene.updateWorldMatrix(true, true);
    const box = new THREE.Box3();

    gltfScene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;

      const hasMorphs = (mesh.geometry.morphAttributes.position?.length ?? 0) > 0;

      if (hasMorphs) {
        mesh.material = new THREE.MeshBasicMaterial({
          wireframe: true,
          color: 0xffffff,
        });
        const meshBox = new THREE.Box3().setFromObject(mesh);
        box.union(meshBox);
      } else {
        mesh.visible = false;
      }
    });

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 0.001);
    return { center, scale: 1.6 / maxDim };
  }, [gltfScene]);

  // Bind mixer directly to the GLB scene so tracks resolve immediately.
  useEffect(() => {
    const mixer = new THREE.AnimationMixer(gltfScene);
    mixerRef.current = mixer;

    animations.forEach((clip) => {
      const action = mixer.clipAction(clip);
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.play();
    });

    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(gltfScene);
      mixerRef.current = null;
    };
  }, [gltfScene, animations]);

  // Scroll / touch → quaternion rotation across all axes.
  // deltaX (horizontal scroll) rotates around the X axis (tilt).
  // deltaY (vertical scroll)   rotates around the Y axis (spin).
  // Diagonal scroll rotates around the combined axis → truly free 3-D rotation.
  useEffect(() => {
    const applyRotation = (dx: number, dy: number) => {
      const { scene, introReady } = useExperienceStore.getState();
      if (scene !== 'heart' || !introReady) return;

      const now = Date.now();
      if (now - lastScrollRef.current < THROTTLE_MS) return;
      lastScrollRef.current = now;

      const len = Math.hypot(dx, dy);
      if (len < 1) return;

      // Build a unit axis from the scroll vector, then rotate by the fixed step.
      // premultiply → world-space rotation (trackball feel).
      const axis = new THREE.Vector3(dx / len, dy / len, 0);
      const q = new THREE.Quaternion().setFromAxisAngle(axis, STEP_RAD);
      targetQuatRef.current.premultiply(q);

      totalDegreesRef.current += STEP_DEG;
      if (totalDegreesRef.current >= THRESHOLD_DEG) {
        useExperienceStore.getState().setScene('reflection');
      }
    };

    const handleWheel = (e: WheelEvent) => applyRotation(e.deltaX, e.deltaY);

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        prevTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - prevTouchRef.current.x;
      const dy = e.touches[0].clientY - prevTouchRef.current.y;
      prevTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      applyRotation(dx, dy);
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  useFrame((_, delta) => {
    // Heartbeat animation plays in all scenes.
    mixerRef.current?.update(delta);

    if (!groupRef.current) return;

    // All motion gated: nothing moves while the opening text is visible.
    const { scene: currentScene, introReady: ready } = useExperienceStore.getState();
    if (currentScene !== 'heart' || !ready) return;

    elapsedRef.current += delta;

    // Smoothly slerp toward the accumulated target quaternion.
    // λ = 5 → snappy but not instant; feels physically connected to the scroll.
    const alpha = 1 - Math.exp(-5 * delta);
    groupRef.current.quaternion.slerp(targetQuatRef.current, alpha);

    // Subtle vertical float to keep the heart feeling alive while idle.
    groupRef.current.position.y = Math.sin(elapsedRef.current * 0.5) * 0.03;
  });

  return (
    <group ref={groupRef}>
      <group scale={scale}>
        <group position={[-center.x, -center.y, -center.z]}>
          <primitive object={gltfScene} />
        </group>
      </group>
    </group>
  );
}

useGLTF.preload('/heart_animated.glb');
