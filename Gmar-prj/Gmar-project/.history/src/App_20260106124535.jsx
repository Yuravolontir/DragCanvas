import { useState } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import './App.css'

import Login from './Login';
import Register from './Register';

function App() {
  
const router = createBrowserRouter([
    {
      path: "/",
      element: <Login />
    },
    {
      path: "/register",
      element: <Register />
    },
  ]);


  return (
    <>
      <RouterProvider router={router} />
    </>
  )
}

export default App
