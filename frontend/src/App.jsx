import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { Button } from "@/components/ui/button"
import { RouterProvider } from "react-router-dom";
import router from "@/router/Index.jsx";
import { AuthProvider } from './context/AuthContext'
import { PreferencesProvider } from './context/PreferencesContext'
import { NotificationProvider } from './context/NotificationContext'
import { ToastProvider } from './components/Toaster/ToastContext'
import ConfirmContext from './components/ConfirmContext/ConfirmContext'



function App() {
 
  // adding routes to routes provided by router

  return (
    <>
      {/* Wrapping the RouterProvider with AuthProvider, PreferencesProvider, NotificationProvider, ToastProvider, and ConfirmContext */}
      <AuthProvider>
        <PreferencesProvider>
          <NotificationProvider>
            <ToastProvider>
              <ConfirmContext>
                <RouterProvider router={router} />
              </ConfirmContext>
            </ToastProvider>
          </NotificationProvider>
        </PreferencesProvider>
      </AuthProvider>
    </>
  )
}

export default App
