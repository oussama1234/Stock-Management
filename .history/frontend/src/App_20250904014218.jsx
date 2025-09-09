import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Button } from "@/components/ui/button"
import { RouterProvider } from "react-router-dom";
import router from "@/router/Index.jsx";

function App() {
 
  // adding routes to routes provided by router

  return (
    <>
      {/* Wrapping the RouterProvider with AuthProvider */}
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>

    </>
  )
}

export default App
