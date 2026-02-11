import './Navigation.css';

export default function Navigation({ currentTab, onTabChange, theme, toggleTheme }) {
  return (
    <nav className="navigation">
      <div className="nav-container">
        <h1 className="nav-title">🦀 LAN Service Monitor</h1>
        
        <div className="nav-tabs">
          <button
            className={`nav-tab ${currentTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => onTabChange('dashboard')}
          >
            📊 Dashboard
          </button>
          <button
            className={`nav-tab ${currentTab === 'ideas' ? 'active' : ''}`}
            onClick={() => onTabChange('ideas')}
          >
            💡 Ideas
          </button>
        </div>

        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
      </div>
    </nav>
  );
}
