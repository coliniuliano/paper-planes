import { Clone, Merged, OrbitControls, useGLTF } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import {Perf} from 'r3f-perf'
import Lights from './Lights.jsx'
import { Tree } from './tree.jsx'
import { useRef } from 'react'
import { Color, MeshBasicMaterial, Vector3 } from 'three'
import { FoliageMaterial } from './FoliageMaterial.jsx'

// TODO: fix shadows - the camera is too small for the shadows, only some get generated

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
    const randomGreen = 3 + Math.floor(Math.random() * 7);
    const color = `#3f${randomGreen}${randomGreen}21`;

    return {position, rotation, scale, color};
}

export default function MainScene()
{
    const camera = {
        fov: 45,
        near: 0.1,
        far: 200,
        position: [11, 12, 0],
    };

    return <Canvas shadows camera={camera}>
        <Scene />
    </Canvas>
}

function Scene() {
    // Create a tiled grid where each tile can contain one tree
    // Each tree is randomly moved from the center of its tile
    // to ensure a certain density but still allow randomization
    const treeTileSize = 2;
    const numTilesInGrid = 13;
    const gridSize = treeTileSize * numTilesInGrid;

    const treeRadiusFromCenter = 1.3;
    const treeRows = generateInitialTreeRows(gridSize, treeTileSize, treeRadiusFromCenter);

    const treesRef = useRef();

    // Infinite scrolling
    const scrollSpeedMultiplier = 2;
    // useFrame((_state, delta) => {
    //     const treeRows = treesRef.current.children;
    //     const numTreeRows = treeRows.length;

    //     treeRows.forEach(treeRow => {
    //         // Make sure there's never a huge delta that would move many rows out of bounds
    //         const scaledDelta = delta % treeTileSize;
    //         // treeRow.position.x += scaledDelta * scrollSpeedMultiplier;

    //         if (treeRow.position.x > 0) {
    //             // Note delta can be like 300 for example so all could go out of frame at once
    //             treeRow.position.x -= numTreeRows * treeTileSize;
    //             treeRow.children.forEach((child, i) => {
    //                 // This kinda sucks beacuse it requires knowledge of how <Tree> is structured
    //                 // since the color is on the 2nd mesh and other properties are on the whole group
    //                 // and we don't want to update React properties which would cause a re-render
    //                 const {position, rotation, scale, color} = randomizeTreeProperties(i, treeTileSize, treeRadiusFromCenter);
                    
    //                 // For some reason each property has to be called independently
    //                 child.position.x = position[0];
    //                 child.position.z = position[2];
    //                 child.rotation.y = rotation[1];
    //                 child.scale.x = scale;
    //                 child.scale.z = scale;
    //                 child.scale.y = scale;

    //                 const threeColor = new Color(color).convertLinearToSRGB();
    //                 if (child.children[1]) {
    //                     child.children[1].material.color.set(threeColor);
    //                 }
    //             });
    //         }
    //     });
    // });

    const orbitRef = useRef();

    // Log the camera changes so I can capture the coordinates
    const onChange = () => {
        console.log(`Camera`, orbitRef.current.object.position);
    }

    // Load the tree model here so it can be instanced (merged)
    // Preconfigure materials and geometries
    const tree = useGLTF('./tree.glb');
    console.log(tree);
    tree.nodes.trunk.material = new MeshBasicMaterial({color: 'black'});

    // Need to clone args for use with Meshed for some reason
    // From drei Clone https://github.com/pmndrs/drei/blob/master/src/core/Clone.tsx
    //const keys = ['near', 'far', 'color', 'distance', 'decay', 'penumbra', 'angle', 'intensity', 'skeleton', 'visible', 'castShadow', 'receiveShadow', 'morphTargetDictionary', 'morphTargetInfluences', 'name', 'geometry', 'material', 'position', 'rotation', 'scale', 'up', 'userData', 'bindMode', 'bindMatrix', 'bindMatrixInverse', 'skeleton'];
    // I only really care about a couple for this project
    const keys = ['position', 'rotation', 'scale'];
    const trunkArgsClone = {};
    const foliageArgsClone = {};
    for (const key of keys) {
        trunkArgsClone[key] = tree.nodes.trunk[key];
        foliageArgsClone[key] = tree.nodes.foliage[key];
    }

    return (
    <>
        <Perf position='top-left' />
            
        <OrbitControls maxPolarAngle={Math.PI / 2 - 0.1} ref={orbitRef} makeDefault onChange={onChange} />

        <Lights />

        {/* Ground plane helps see where the tree grid is positioned and to receive shadow */}
        <mesh name="ground" receiveShadow rotation-x={-Math.PI * 0.5} scale={gridSize}>
            <planeGeometry />
            <meshStandardMaterial color="greenyellow" />
        </mesh>

        {/* World position set to bottom left corner of plane */}
        <group name="treesPosition" position={[gridSize/2, 0, gridSize/2]}>
            <Merged meshes={tree.nodes} castShadow receiveShadow>
                {({trunk: Trunk, foliage: Foliage}) => (
                    //{/* Model position to be moved starting from 0 without worrying about overall world position */}
                    <group ref={treesRef} name="treesGroup">
                        {/* {treeRows} */}
                        {/* // Trying to find out if its possible to tweak materials and stuff without cloning */}
                        {
                            [...Array(13*5)].map((x, i) => {
                                const row = Math.floor(i / 13) * 2 + 1;
                                const col = i % 13 * 2 + 1;
                            
                                return <group key={i} name="tree" position={[-row, 0, -col]}>
                                    <Trunk {...trunkArgsClone} color="blue">
                                        <meshBasicMaterial color="blue" attach="material" />
                                    </Trunk>
                                </group>
                            }
                            )
                        }
                    </group>
                )}
            </Merged>
            <Tree position={[-15, 0, -15]} />
            <Tree position={[-20, 0, -20]} />
        </group>
    </>
    );
}