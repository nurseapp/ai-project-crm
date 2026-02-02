import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Status from './pages/Status';
import Clients from './pages/Clients';
import Projects from './pages/Projects';
import APIs from './pages/APIs';
import Documents from './pages/Documents';

// TODO: Re-enable authentication later
// import { AuthProvider, useAuth } from './context/AuthContext';
// import Login from './pages/Login';

// Main Layout with horizontal nav
const MainLayout = () => {
  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-logo">
          <span>🤖</span> AI Project CRM
        </div>
        <nav className="topbar-nav">
          <NavLink to="/apis" className={({ isActive }) => `topbar-link ${isActive ? 'active' : ''}`}>
            🔐 APIs
          </NavLink>
          <NavLink to="/documents" className={({ isActive }) => `topbar-link ${isActive ? 'active' : ''}`}>
            📂 Documents
          </NavLink>
          <NavLink to="/" className={({ isActive }) => `topbar-link ${isActive ? 'active' : ''}`} end>
            📊 Dashboard
          </NavLink>
          <NavLink to="/tasks" className={({ isActive }) => `topbar-link ${isActive ? 'active' : ''}`}>
            📋 Tasks
          </NavLink>
          <NavLink to="/status" className={({ isActive }) => `topbar-link ${isActive ? 'active' : ''}`}>
            📌 Status
          </NavLink>
          <NavLink to="/clients" className={({ isActive }) => `topbar-link ${isActive ? 'active' : ''}`}>
            👥 Clients
          </NavLink>
          <NavLink to="/projects" className={({ isActive }) => `topbar-link ${isActive ? 'active' : ''}`}>
            📁 Projects
          </NavLink>
        </nav>
        <div className="topbar-user">
          <span className="user-name">👤 Dev Mode</span>
        </div>
      </header>
      <main className="main-content-horizontal">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/apis" element={<APIs />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/status" element={<Status />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/projects" element={<Projects />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <Routes>
      <Route path="/*" element={<MainLayout />} />
    </Routes>
  );
}

export default App;
