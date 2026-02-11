import { useState } from 'react';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import IdeasPage from './components/IdeasPage';
import './App.css';

function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');

  return (
    <div className="App">
      <Navigation currentTab={currentTab} onTabChange={setCurrentTab} />
      
      <main className="app-content">
        {currentTab === 'dashboard' ? <Dashboard /> : <IdeasPage />}
      </main>
    </div>
  );
}

export default App;
