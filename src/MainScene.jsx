import { Float, Html, Merged, OrbitControls, useGLTF } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import {Perf} from 'r3f-perf'
import Lights from './Lights.jsx'
import { Tree } from './tree.jsx'
import { useRef } from 'react'
import { Color, MeshBasicMaterial, Vector3, DoubleSide, MeshStandardMaterial } from 'three'
import gsap from 'gsap'
import { button, useControls } from 'leva'

// Returns a grid of trees as a 2d array where each row is a <group>
// Note that it will not reutrn an array of length gridSize if step != 1
// eg: gridSize = 25, step=2 yields 13 rows
function generateInitialTreeRows(gridSize = 10, step = 2, radiusFromCenter = step) {
    const treeRows = [];

    const numTreesPerCol = Math.ceil(gridSize / step);
    const numTreesPerRow = numTreesPerCol;

    for (let row = 0; row < numTreesPerRow; row++) {
        // Columns are along the Z axis and Z decreases as it goes right on the screen
        const numTreesPerRow = Math.ceil(gridSize / step);
        const treeRow = [...Array(numTreesPerRow)].map((_, col) => 
            <Tree key={col} {...randomizeTreeProperties(col, step, radiusFromCenter)} />
        );


        // Each row is offset in the X axis so it can be animated
        // x=0 is the bottom row and x decreases as it goes up on the screen
        const xPos = row * step;
        treeRows.push(
            <group key={row} position={[-xPos, 0, 0]}>
                {treeRow}
            </group>
        );
    }

    return treeRows;
}

const treeColors = ['#606c38', '#283618', '#4a6741', '#3f5a36', '#374f2f', '#304529', '#22311d', '#3f6621'];

function randomizeTreeProperties(col, step, radiusFromCenter) {
    const xRan = (step / 2) + ((Math.random() - 0.5) * radiusFromCenter);
    const zRan = (step / 2) + ((Math.random() - 0.5) * radiusFromCenter);
    const colZ = col * step;
    const position = [ -xRan, 0, -(zRan + colZ)];

    const rotRandom = Math.random() * Math.PI * 2;
    const rotation = [ 0, rotRandom, 0 ];

    // Scale from 0.5 to 1.0
    const scale = Math.random() / 2 + 0.5;

    // Pick a number from 3 to 9 to be used in hex code as green
    // const randomGreen = 3 + Math.floor(Math.random() * 7);
    // const color = `#3f${randomGreen}${randomGreen}21`;

    const color = treeColors[Math.floor(Math.random() * treeColors.length)];

    return {position, rotation, scale, color};
}

export default function MainScene()
{
    return <><Canvas
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

    <button className='barrelRollButton'>Ghetto Barrel Roll</button>
    </>
}

function Scene() {
    // Ideally gridSize should be a multiple of gapBetweenTrees
    const gridSize = 26;

    const treeTileSize = 2;
    const treeRadiusFromCenter = 1.3;
    const treeRows = generateInitialTreeRows(gridSize, treeTileSize, treeRadiusFromCenter);

    const treesRef = useRef();

    // Paper plane test
    const paperPlane = useGLTF('./plane.gltf');

    // Infinite scrolling
    const scrollSpeedMultiplier = 1;
    useFrame((_state, delta) => {
        const treeRows = treesRef.current.children;
        const numTreeRows = treeRows.length;

        treeRows.forEach(treeRow => {
            // Make sure there's never a huge delta that would move many rows out of bounds
            const scaledDelta = delta % treeTileSize;
            treeRow.position.x += scaledDelta * scrollSpeedMultiplier;

            if (treeRow.position.x > 0) {
                // Note delta can be like 300 for example so all could go out of frame at once
                treeRow.position.x -= numTreeRows * treeTileSize;
                treeRow.children.forEach((child, i) => {
                    // This kinda sucks beacuse it requires knowledge of how <Tree> is structured
                    // since the color is on the 2nd mesh and other properties are on the whole group
                    // and we don't want to update React properties which would cause a re-render
                    const {position, rotation, scale, color} = randomizeTreeProperties(i, treeTileSize, treeRadiusFromCenter);
                    
                    // For some reason each property has to be called independently
                    child.position.x = position[0];
                    child.position.z = position[2];
                    child.rotation.y = rotation[1];
                    child.scale.x = scale;
                    child.scale.z = scale;
                    child.scale.y = scale;

                    const threeColor = new Color(color).convertLinearToSRGB();
                    if (child.children[1]) {
                        child.children[1].material.color.set(threeColor);
                    }
                });
            }
        });
    });

    const orbitRef = useRef();

    // Log the camera changes so I can capture the coordinates
    const onChange = () => {
        console.log(orbitRef.current.object.position);
    }

    const planeNodes = {
        PaperPlane: paperPlane.nodes['paper_plane_']
    };

    const numPlanes = 150;
    const planeRefs = [];

    const oddsOfFlipping = 0.25;
    useControls({
        barrelRoll: button(() => {
            planeRefs.forEach((planeRef) => {
                if (Math.random() > oddsOfFlipping) {
                    return;
                }
                const dir = planeRef.current.position.z < 0 ? 1 : -1;
                const delay = Math.random() * 0.5;
                const duration = 0.5 + (Math.random() * 0.5);
                gsap.to(planeRef.current.rotation, 
                    {
                        x: planeRef.current.rotation.x + ((Math.PI * 2) * dir),
                        delay,
                        duration
                    }
                );
                gsap.to(planeRef.current.position,
                    {
                        z: planeRef.current.position.z + (2 * dir),
                        delay,
                        duration
                    }
                );
            })
        })
    });

    const planeColors = ['#faedcb', '#c9e4de', '#c6def1', '#dbcdf0', '#f2c6de', '#f8d9c4'];
    // const planeColors = ['#5e347c', '#eb1376', '#0a877f', '#f8841f', '#c4a998'];

    return (
    <>
        <Perf position='top-left' minimal />
            
        <OrbitControls 
            ref={orbitRef}
            maxPolarAngle={Math.PI / 2 - 0.1}
            makeDefault 
            onChange={onChange} 
        />

        <Lights />

        {/* Paper plane instances in 1 call */}
        <Merged meshes={planeNodes} castShadow receiveShadow>
            {({PaperPlane}) => {
                return [...Array(numPlanes)].map((_, i) => {
                    const randomX = 5 + (Math.random() * 3.5);
                    const randomY = 7 + (Math.random() * 2);
                    const randomZ = -2 + (Math.random() * 4);
                    const color = planeColors[Math.floor(Math.random() * planeColors.length)];
                    const threeColor = new Color(color).convertSRGBToLinear();
                    const ref = planeRefs[i] = useRef();
                    return <Float key={i}>
                        <PaperPlane 
                            ref={ref}
                            scale={0.6}
                            position={[randomX, randomY, randomZ]} 
                            rotation={[-Math.PI * 0.5, 0, Math.PI * 0.5]}  
                            color={threeColor}
                            onClick={() => {
                                // Do a barrel roll
                                const dir = ref.current.position.z < 0 ? 1 : -1;
                                gsap.to(ref.current.rotation, 
                                    {x: ref.current.rotation.x + ((Math.PI * 2) * dir)}
                                );
                                gsap.to(ref.current.position,
                                    {z: ref.current.position.z + (0.5 * dir)}
                                );
                            }}
                        />
                    </Float>
                })
            }}
        </Merged>

        {/* Ground plane helps see where the tree grid is positioned */}
        <mesh name="ground" receiveShadow rotation-x={-Math.PI * 0.5} scale={gridSize}>
            <planeGeometry />
            <meshStandardMaterial color="greenyellow" />
        </mesh>

        {/* World position set to bottom left corner of plane */}
        <group name="treesPosition" position={[gridSize/2, 0, gridSize/2]}>
            {/* Model position to be moved starting from 0 without worrying about overall world position */}
            <group ref={treesRef} name="treesGroup">
                {treeRows}
            </group>
        </group>
    </>
    );
}