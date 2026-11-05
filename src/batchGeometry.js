import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Bake only static island scenery. Animated obstacles and characters stay separate.
export function bakeIsland(root) {
  root.updateWorldMatrix(true, true);
  const inverse = root.matrixWorld.clone().invert();
  const parts = [], originals = [], instance = new THREE.Matrix4();
  root.traverse(object => {
    const material = object.material;
    if (!object.isMesh || !object.visible || !material?.isMeshStandardMaterial || material.transparent || Array.isArray(material)) return;
    const add = matrix => {
      const geometry = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
      geometry.applyMatrix4(matrix);
      const position = geometry.getAttribute('position'), colors = geometry.getAttribute('color');
      const values = new Float32Array(position.count * 3);
      for (let i = 0; i < position.count; i++) {
        values[i * 3] = material.color.r * (material.vertexColors && colors ? colors.getX(i) : 1);
        values[i * 3 + 1] = material.color.g * (material.vertexColors && colors ? colors.getY(i) : 1);
        values[i * 3 + 2] = material.color.b * (material.vertexColors && colors ? colors.getZ(i) : 1);
      }
      for (const name of Object.keys(geometry.attributes)) if (!['position', 'normal'].includes(name)) geometry.deleteAttribute(name);
      geometry.setAttribute('color', new THREE.BufferAttribute(values, 3));
      parts.push(geometry);
    };
    const local = new THREE.Matrix4().multiplyMatrices(inverse, object.matrixWorld);
    if (object.isInstancedMesh) {
      for (let i = 0; i < object.count; i++) {
        object.getMatrixAt(i, instance);
        add(new THREE.Matrix4().multiplyMatrices(local, instance));
      }
    } else add(local);
    originals.push(object);
  });
  if (!parts.length) return null;
  const geometry = mergeGeometries(parts, false);
  parts.forEach(part => part.dispose());
  geometry.computeBoundingSphere();
  return { geometry, originals };
}
