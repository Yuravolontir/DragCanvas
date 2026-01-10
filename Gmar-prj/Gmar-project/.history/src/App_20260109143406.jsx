import { useState } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import './App.css'

import Login from './Login';
import Register from './Register';
import LandingPage from './LandingPage';

function App() {
  
const router = createBrowserRouter([
    {
      path: "/",
      element: <LandingPage />
    },
    {
      path: "/register",
      element: <Register />
    },
        {
      path: "/login",
      element: <Login />
    }
  ]);


  return (
    <>
      <RouterProvider router={router} />
    </>
  )
}

export default App
