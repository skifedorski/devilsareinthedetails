'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { useExperienceStore } from '@/store/useExperienceStore';

function heartbeatScale(t: number, bpm = 72) {
  const beatDur = 60 / bpm;
  const phase = (t % beatDur) / beatDur;
  let s = 1;
  if (phase < 0.12) {
    s += Math.sin((phase * Math.PI) / 0.12) * 0.045;
  } else if (phase > 0.22 && phase < 0.36) {
    s += Math.sin(((phase - 0.22) * Math.PI) / 0.14) * 0.022;
  }
  return s;
}

function meshToWirePoints(root: THREE.Object3D) {
  const group = new THREE.Group();
  const lineMat = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.85,
  });
  const pointMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.012,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.95,
    depthTest: true,
  });

  root.updateWorldMatrix(true, true);
  root.traverse((child) => {
    if (!('isMesh' in child) || !(child as THREE.Mesh).isMesh) return;
    const mesh = child as THREE.Mesh;
    if (!mesh.geometry) return;
    if (mesh.name === 'Cube') return;

    let geom = mesh.geometry.clone();
    geom.applyMatrix4(mesh.matrixWorld);
    if (geom.index) {
      const ni = geom.toNonIndexed();
      geom.dispose();
      geom = ni;
    }
    const welded = mergeVertices(geom, 1e-4);
    geom.dispose();
    geom = welded;

    const wireframe = new THREE.WireframeGeometry(geom);
    const lines = new THREE.LineSegments(wireframe, lineMat.clone());
    group.add(lines);

    const pointPositions = geom.getAttribute('position');
    const pointsGeom = new THREE.BufferGeometry();
    pointsGeom.setAttribute('position', pointPositions.clone());
    const pts = new THREE.Points(pointsGeom, pointMat.clone());
    group.add(pts);

    geom.dispose();
  });

  return group;
}

function normalizeAndBuildGraph(scene: THREE.Object3D) {
  const root = scene.clone(true);
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z, 0.001);
  root.position.sub(center);
  root.scale.setScalar(1.6 / maxDim);
  root.updateMatrixWorld(true);
  return meshToWirePoints(root);
}

export default function Heart() {
  const { scene } = useGLTF('/heart.glb');
  const groupRef = useRef<THREE.Group>(null);
  const elapsedRef = useRef(0);
  const scrollCount = useExperienceStore((state) => state.scrollCount);
  const targetRotationY = scrollCount * (Math.PI / 16);

  const graph = useMemo(() => normalizeAndBuildGraph(scene), [scene]);

  useEffect(() => {
    return () => {
      graph.traverse((obj) => {
        const o = obj as THREE.Mesh;
        o.geometry?.dispose();
        const mat = o.material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else if (mat) mat.dispose();
      });
    };
  }, [graph]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    elapsedRef.current += delta;
    const t = elapsedRef.current;

    groupRef.current.rotation.y = THREE.MathUtils.damp(
      groupRef.current.rotation.y,
      targetRotationY,
      4,
      delta
    );
    groupRef.current.rotation.x = Math.sin(t * 0.35) * 0.05;
    groupRef.current.rotation.z = Math.sin(t * 0.28) * 0.03;
    groupRef.current.scale.setScalar(heartbeatScale(t, 72));
    groupRef.current.position.y = Math.sin(t * 0.5) * 0.03;
  });

  return (
    <group ref={groupRef}>
      <primitive object={graph} />
    </group>
  );
}

useGLTF.preload('/heart.glb');
