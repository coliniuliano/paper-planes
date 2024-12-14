import { Clone, useGLTF } from '@react-three/drei';
import { FoliageMaterial } from './FoliageMaterial';

export function Tree({ position, rotation, scale, color }) {
  const tree = useGLTF('./tree.glb');

  return (
    <group name="tree" rotation={rotation} position={position} scale={scale}>
      <Clone
        receiveShadow
        castShadow
        object={tree.nodes.trunk}
        inject={<meshBasicMaterial color="black" />}
      />
      <Clone receiveShadow castShadow object={tree.nodes.foliage} inject={
        <FoliageMaterial color={color} />
      } />
    </group>
  );
}
