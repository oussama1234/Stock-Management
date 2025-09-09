import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Button } from "@/components/ui/button"
import { RouterProvider } from "react-router-dom";
import router from "@/router/Index.jsx";
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './components/Toaster/ToastContext'
import usersReducer from '@/Redux/UsersSlice'
import { configureStore } from '@reduxjs/toolkit'

function App() {
 
  // adding routes to routes provided by router

  return (
    <>
      {/* Wrapping the RouterProvider with AuthProvider */}
      <ToastProvider position="top-right">
     
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>

      </ToastProvider>
    </>
  )
}

export default App
