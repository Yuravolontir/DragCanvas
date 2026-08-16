import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Vendor stylesheet first, ours second.
//
// Bootstrap sets `body { background-color: var(--bs-body-bg) }`, and while it
// was imported last it won that declaration outright - which stopped mattering
// only because the app's own background used to be near-white too. With a dark
// palette the page stayed white under a dark design. Our design system should
// be the thing that has the last word about our own page.
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css'

import App from './App.jsx'


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
