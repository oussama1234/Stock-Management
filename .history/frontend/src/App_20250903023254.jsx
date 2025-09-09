import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Button } from "@/components/ui/button"

function App() {
 

  return (
    <>
      <h1 class="text-3xl font-bold underline">    Hello world!  </h1>
      <div className="flex min-h-svh flex-col items-center justify-center">
      <Button className="bg-blue-500 text-white cursor-pointer"
      >Click me</Button>
    </div>
    </>
  )
}

export default App
