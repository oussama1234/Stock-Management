import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { Button } from "@/components/ui/button"
import { RouterProvider } from "react-router-dom";
import router from "@/router/Index.jsx";
import { AuthProvider } from './context/AuthContext'
import { PreferencesProvider } from './context/PreferencesContext'
import { ToastProvider } from './components/Toaster/ToastContext'
import ConfirmContext from './components/ConfirmContext/ConfirmContext'



function App() {
 
  // adding routes to routes provided by router

  return (
    <>
      {/* Wrapping the RouterProvider with PreferencesProvider, AuthProvider, ToastProvider, and ConfirmContext */}
      <PreferencesProvider>
        <AuthProvider>
          <ToastProvider>
            <ConfirmContext>
              <RouterProvider router={router} />
            </ConfirmContext>
          </ToastProvider>
        </AuthProvider>
      </PreferencesProvider>
    </>
  )
}

export default App
