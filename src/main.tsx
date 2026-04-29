import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'
import App from './App'
import { LibraryGamePage } from './Pages/librarygame/LibraryGamePage'
import { MovingTargetInfoPage } from './Pages/gameinfo/movingtarget_info/movingTarget_info'

import { ContinuousTrackingInfoPage } from './Pages/gameinfo/continuous_tracking_info/ContinuousTracking_info'

import { DualTaskInfoPage } from './Pages/gameinfo/dualtask_info/dualTask_info'

import MovingTargetGamePage from './Pages/gamepages/movingtarget/movingTarget'
import DualTaskGamePage from './Pages/gamepages/dualtask/dualtask'
import DualTaskResultPage from './Pages/gamepages/dualtask/dualtaskResult'
import ContinuousTrackingGamePage from './Pages/gamepages/continuous_tracking/ContinuousTrackingGame'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/librarygame" element={<LibraryGamePage />} />
        <Route path="/gameinfo/movingtarget" element={<MovingTargetInfoPage />} />
        <Route path="/gameplay/movingtarget" element={<MovingTargetGamePage />} />

        <Route path="/gameinfo/continuous-tracking" element={<ContinuousTrackingInfoPage />} />
        <Route path="/gameplay/continuous-tracking" element={<ContinuousTrackingGamePage />} />

        <Route path="/gameinfo/dualtask" element={<DualTaskInfoPage />} />
        <Route path="/gameinfo/dualtask" element={<DualTaskGamePage />} />
        <Route path="/gameplay/dualtask/result" element={<DualTaskResultPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
