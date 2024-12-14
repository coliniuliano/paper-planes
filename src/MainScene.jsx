import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import {Perf} from 'r3f-perf'
import Lights from './Lights.jsx'
import { Tree } from './tree.jsx'
import { useControls } from 'leva'
import { useMemo, useRef } from 'react'

function generateTrees (tilesW = 10, tilesH = 10, step = 2) {
    const trees = [];
    for (let z = 0; z < tilesH; z+=step) {
        for (let x = 0; x < tilesW; x+=step) {
            const xRan = (Math.random() - 0.5) * step / 2 + x;
            const zRan = (Math.random() - 0.5) * step + z;
            const position = [ -xRan, 0, -zRan];
            const rotation = [ 0, Math.random() * Math.PI * 2, 0 ];


            const scale = Math.random() / 2 + 0.5;

            // Pick a number from 3 to 9 to be used in hex code as green
            const randomGreen = 3 + Math.floor(Math.random() * 7);
            const color = `#3f${randomGreen}${randomGreen}21`;

            trees.push(
                <Tree key={`${z}_${x}`} position={position} rotation={rotation} scale={scale} color={color} />
            );
        }
    }

    return trees;
}

export default function MainScene()
{
    return <Canvas
        shadows
        camera={{
            fov: 45,
            near: 0.1,
            far: 200,
            position: [11, 12, 0],
        }}
    >
        <Scene />
    </Canvas>
}

function Scene() {
    // Want to see every time this has to re-render, that's bad
    //const trees = useMemo(() => generateTrees(), []);
    const trees = generateTrees(25, 25);

    const treesRef = useRef();

    // Infinite scrolling
    useFrame((_state, delta) => {
        treesRef.current.position.x += delta;
    });

    const orbitRef = useRef();

    // Log the camera changes so I can capture the coordinates
    const onChange = () => {
        console.log(orbitRef.current.object.position);
    }
    return (
    <>
        <Perf position='top-left' minimal />
            
        <OrbitControls maxPolarAngle={Math.PI / 2 - 0.1} ref={orbitRef} makeDefault onChange={onChange} />

        <Lights />

        <group ref={treesRef} name="trees" position={[10, 0, 10]}>
            {trees}
        </group>

        <mesh name="ground" receiveShadow rotation-x={ - Math.PI * 0.5 } scale={ 25 }>
            <planeGeometry />
            <meshStandardMaterial color="greenyellow" />
        </mesh>
    </>
    );
}