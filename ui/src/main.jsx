import './index.css'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

console.log("[Main] Root created, rendering App...");
const root = createRoot(document.getElementById('root'));
root.render(<App />);
