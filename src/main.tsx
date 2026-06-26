import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext';
import { ProgressionManager } from './game/ProgressionManager';
import { StoryManager } from './game/StoryManager';
import './index.css';

ProgressionManager.initCloudSync();
StoryManager.init();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
