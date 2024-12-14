import './style.css'
import ReactDOM from 'react-dom/client'
import MainScene from './MainScene.jsx'
import { StrictMode } from 'react'

const root = ReactDOM.createRoot(document.querySelector('#root'))

root.render(
    <StrictMode>
        <MainScene />
    </StrictMode>
)