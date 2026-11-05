import React, { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { bakeIsland } from './batchGeometry';

export default function StaticIsland({ enabled, children }) {
  const root = useRef();
  useLayoutEffect(() => {
    if (!enabled) return;
    const batch = bakeIsland(root.current);
    if (!batch) return;
    const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .9, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(batch.geometry, material);
    batch.originals.forEach(object => { object.visible = false; });
    root.current.add(mesh);
    return () => {
      mesh.removeFromParent();
      batch.originals.forEach(object => { object.visible = true; });
      batch.geometry.dispose();
      material.dispose();
    };
  }, [enabled]);
  return <group ref={root}>{children}</group>;
}
