import { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import IdeasPage from './components/IdeasPage';
import RedisChat from './components/RedisChat';
import './App.css';

function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <div className="App">
      <Navigation 
        currentTab={currentTab} 
        onTabChange={setCurrentTab} 
        theme={theme} 
        toggleTheme={toggleTheme} 
      />
      <main className="app-content">
        {currentTab === 'dashboard' ? <Dashboard /> : 
         currentTab === 'ideas' ? <IdeasPage /> : 
         <RedisChat />}
      </main>
    </div>
  );
}

export default App;
