import { useControls } from "leva"
import { useRef } from "react";

export default function Lights()
{
    const {dirLightIntensity, ambLightIntensity, position} = useControls({dirLightIntensity: {
        value: 0.4,
        min: 0,
        max: 10,
    }, ambLightIntensity: {
        value: 0.2,
        min: 0,
        max: 10,
    },
     position: {
        value: [0, 12, 0],
        step: 1
    }});

    return <>
        <directionalLight
            castShadow
            position={ position }
            intensity={ dirLightIntensity }
            shadow-mapSize={ [ 1024, 1024 ] }
            shadow-camera-near={ 0.1 }
            shadow-camera-far={ 10 }
            shadow-camera-top={ 10 }
            shadow-camera-right={ 10 }
            shadow-camera-bottom={ - 10 }
            shadow-camera-left={ - 10 }
        />
        <ambientLight intensity={ ambLightIntensity } />
    </>
}