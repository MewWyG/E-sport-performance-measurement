import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'
import App from './App'
import { LibraryGamePage } from './Pages/librarygame/LibraryGamePage'
import { MovingTargetInfoPage } from './Pages/gameinfo/movingtarget_info/movingTarget_info'
import MovingTargetGamePage from './Pages/gamepages/movingtarget/movingTarget'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/librarygame" element={<LibraryGamePage />} />
        <Route path="/gameinfo/movingtarget" element={<MovingTargetInfoPage />} />
        <Route path="/gameplay/movingtarget" element={<MovingTargetGamePage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)