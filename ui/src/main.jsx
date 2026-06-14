import './index.css'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { StompProvider } from './StompContext.jsx'

const root = createRoot(document.getElementById('root'))
root.render(
    <StompProvider>
        <App />
    </StompProvider>
)
