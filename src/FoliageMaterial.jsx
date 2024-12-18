import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import { Color, FrontSide, MeshStandardMaterial } from 'three';
import CustomShaderMaterial from 'three-custom-shader-material';
import vert from './vertex.glsl.js';

export function FoliageMaterial({color = '#3f6d21'}) {
  const ref = useRef(null);
  const alphaMap = useTexture('https://douges.dev/static/foliage_alpha3.png');

  useFrame((_, delta) => {
    ref.current.uniforms.u_windTime.value += ref.current.uniforms.u_windSpeed.value * delta;
  });

  const uniforms = useMemo(
    () => ({
      u_effectBlend: { value: 1.0 },
      u_inflate: { value: 0.0 },
      u_scale: { value: 1.0 },
      u_windSpeed: { value: 1.0 },
      u_windTime: { value: 0.0 },
    }),
    []
  );

  return (
    <CustomShaderMaterial
      alphaMap={alphaMap}
      alphaTest={0.5}
      baseMaterial={MeshStandardMaterial}
      color={new Color(color).convertLinearToSRGB()}
      ref={ref}
      uniforms={uniforms}
      vertexShader={vert}
      shadowSide={FrontSide}
    />
  );
}
