import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'
import App from './App'
import { LibraryGamePage } from './Pages/librarygame/LibraryGamePage'
import { MovingTargetInfoPage } from './Pages/gameinfo/movingtarget_info/movingTarget_info'

import { ContinuousTrackingInfoPage } from './Pages/gameinfo/continuous_tracking_info/ContinuousTracking_info'
import { PredictionInterceptInfoPage } from './Pages/gameinfo/prediction_intercept_info/PredictionIntercept_info'

import { DualTaskInfoPage } from './Pages/gameinfo/dualtask_info/dualTask_info'
import { SpeedLogicInfoPage } from './Pages/gameinfo/speedlogic_info/speedlogic_info'

import MovingTargetGamePage from './Pages/gamepages/movingtarget/movingTarget'
import DualTaskGamePage from './Pages/gamepages/dualtask/dualtask'
import DualTaskResultPage from './Pages/gamepages/dualtask/dualtaskResult'
import SpeedLogicGamePage from './Pages/gamepages/speedlogic/speedLogic'
import SpeedLogicResultPage from './Pages/gamepages/speedlogic/speedLogicResult'
import ContinuousTrackingGamePage from './Pages/gamepages/continuous_tracking/ContinuousTrackingGame'
import PredictionInterceptGamePage from './Pages/gamepages/prediction_intercept/PredictionInterceptGame'

import { NumberSearchInfoPage } from './Pages/gameinfo/numbersearch_info/numberSearch_info'
import NumberSearchGamePage from './Pages/gamepages/numbersearch/numberSearch'

import { SprayControlInfoPage } from './Pages/gameinfo/spray_control_info/SprayControl_info'
import SprayControlGamePage from './Pages/gamepages/spray_control/SprayControlGame'
import { AuditoryLocalizationInfoPage } from './Pages/gameinfo/auditory_localization_info/AuditoryLocalization_info'
import AuditoryLocalizationGamePage from './Pages/gamepages/auditory_localization/AuditoryLocalizationGame'

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

        <Route path="/gameinfo/prediction-intercept" element={<PredictionInterceptInfoPage />} />
        <Route path="/gameplay/prediction-intercept" element={<PredictionInterceptGamePage />} />

        <Route path="/gameinfo/dualtask" element={<DualTaskInfoPage />} />
        <Route path="/gameplay/dualtask" element={<DualTaskGamePage />} />
        <Route path="/gameplay/dualtask/result" element={<DualTaskResultPage />} />
        
        <Route path="/gameinfo/speedlogic" element={<SpeedLogicInfoPage />} />
        <Route path="/gameplay/speedlogic" element={<SpeedLogicGamePage />} />
        <Route path="/gameplay/speedlogic/result" element={<SpeedLogicResultPage />} />

        <Route path="/gameinfo/numbersearch" element={<NumberSearchInfoPage />} />
        <Route path="/gameplay/numbersearch" element={<NumberSearchGamePage />} />

        <Route path="/gameinfo/spray-control" element={<SprayControlInfoPage />} />
        <Route path="/gameplay/spray-control" element={<SprayControlGamePage />} />

        <Route path="/gameinfo/auditory-localization" element={<AuditoryLocalizationInfoPage />} />
        <Route path="/gameplay/auditory-localization" element={<AuditoryLocalizationGamePage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
