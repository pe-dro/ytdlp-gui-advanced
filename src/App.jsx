import { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { I18nProvider } from './i18n/index';
import { ThemeProvider } from './context/ThemeContext';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import DownloaderPage from './pages/DownloaderPage';
import QueuePage from './pages/QueuePage';
import BatchPage from './pages/BatchPage';
import SettingsPage from './pages/SettingsPage';
import Console from './components/Console';
import BinaryBanner from './components/BinaryBanner';
import WelcomeScreen from './components/WelcomeScreen';
import { useApp } from './context/AppContext';

const isFirstRun = () => !localStorage.getItem('ytdl-gui-welcomed');

function Layout() {
  const { state } = useApp();
  const [showWelcome, setShowWelcome] = useState(isFirstRun);

  const pages = {
    downloader: <DownloaderPage />,
    queue:      <QueuePage />,
    batch:      <BatchPage />,
    settings:   <SettingsPage />,
  };

  return (
    <div className="flex flex-col h-screen bg-surface-950 overflow-hidden">
      {showWelcome && <WelcomeScreen onDone={() => setShowWelcome(false)} />}
      <TitleBar />
      <BinaryBanner />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 animate-fade-in">
            {pages[state.activeTab] || <DownloaderPage />}
          </div>
          <Console />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AppProvider>
          <Layout />
        </AppProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
