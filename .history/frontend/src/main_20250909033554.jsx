import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { store } from '@/Redux/App/Store'
import { Provider } from 'react-redux'
import { ToastProvider } from './components/Toaster/ToastContext.jsx'
import ConfirmContext from './components/ConfirmContext/ConfirmContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
      <ToastProvider position="top-right">

      
          <ConfirmContext>
    <Provider store={store}>
    <App />
    </Provider>
          </Confir>
    </ToastProvider>
  </StrictMode>,
)
