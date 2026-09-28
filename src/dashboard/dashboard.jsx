import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [occasion, setOccasion] = useState('Casual');
  const [darkMode, setDarkMode] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const user = localStorage.getItem('username');
    if (user) {
      setUsername(user);
    }
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      const isDark = JSON.parse(savedDarkMode);
      setDarkMode(isDark);
      if (isDark) {
        document.body.classList.add('dark-mode');
        document.documentElement.classList.add('dark-mode');
      }
    }
  }, []);

  // ===== I-CLOSE ANG DROPDOWN KAPAG PININDOT SA LABAS =====
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ===== TOGGLE DARK MODE =====
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', JSON.stringify(newMode));
    if (newMode) {
      document.body.classList.add('dark-mode');
      document.documentElement.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
      document.documentElement.classList.remove('dark-mode');
    }
    setShowDropdown(false);
  };

  // ===== LOGOUT =====
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('username');
      navigate('/');
    }
    setShowDropdown(false);
  };

  const handleAddClothing = () => {
    navigate('/add-clothing');
  };

  const handleWardrobe = () => {
    navigate('/wardrobe');
  };

  const handleRecommendations = () => {
    navigate('/recommendation');
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  return (
    <div className={`dashboard-container ${darkMode ? 'dark-mode' : ''}`}>
      <div className={`dashboard-card ${darkMode ? 'dark-card' : ''}`}>
        
        {/* ===== HEADER ===== */}
        <div className="dashboard-header">
          <div className="header-left">
            <span className="logo-icon">👔</span>
            <h1 className={`dashboard-title ${darkMode ? 'dark-text' : ''}`}>FitPicker</h1>
          </div>
          
          <div className="header-right">
            {/* ===== PROFILE DROPDOWN ===== */}
            <div className="profile-dropdown" ref={dropdownRef}>
              <div 
                className={`profile-trigger ${darkMode ? 'dark-trigger' : ''}`}
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <span className="profile-avatar">🧑</span>
                <span className={`profile-name ${darkMode ? 'dark-text' : ''}`}>
                  {username || 'emman'}
                </span>
                <span className={`dropdown-arrow ${showDropdown ? 'open' : ''}`}>▼</span>
              </div>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div className={`dropdown-menu ${darkMode ? 'dark-dropdown' : ''}`}>
                  <div className="dropdown-item" onClick={toggleDarkMode}>
                    <span className="dropdown-icon">{darkMode ? '☀️' : '🌙'}</span>
                    <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                  </div>
                  <div className="dropdown-divider"></div>
                  <div className="dropdown-item logout" onClick={handleLogout}>
                    <span className="dropdown-icon">🚪</span>
                    <span>Logout</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ===== WELCOME ===== */}
        <div className="welcome-section">
          <h2 className={darkMode ? 'dark-text' : ''}>Welcome to FitPicker!</h2>
          <p className={darkMode ? 'dark-subtext' : ''}>Your AI-Powered Wardrobe Assistant</p>
        </div>

        {/* ===== OCCASION ===== */}
        <div className={`occasion-section ${darkMode ? 'dark-section' : ''}`}>
          <h3 className={darkMode ? 'dark-text' : ''}>📅 Select Occasion</h3>
          <select 
            className={`occasion-select ${darkMode ? 'dark-select' : ''}`}
            value={occasion} 
            onChange={(e) => setOccasion(e.target.value)}
          >
            <option>Casual</option>
            <option>Formal</option>
            <option>Work</option>
            <option>School</option>
            <option>Social</option>
            <option>Party</option>
          </select>
          <p className={`selected-occasion ${darkMode ? 'dark-text' : ''}`}>
            Selected: <strong>{occasion}</strong>
          </p>
        </div>
        
        {/* ===== SCAN WITH AI - PAHABA (FULL WIDTH) ===== */}
        <div className={`feature-card-wide ${darkMode ? 'dark-feature-wide' : ''}`} onClick={() => navigate('/camera-scanner')}>
          <span className="feature-icon">🔍</span>
          <h4>Scan with AI</h4>
          <p>Scan clothing for recommendations</p>
        </div>
        
        {/* ===== FEATURES GRID ===== */}
        <div className="features-grid">
          <div className={`feature-card ${darkMode ? 'dark-feature' : ''}`} onClick={handleAddClothing}>
            <span className="feature-icon">📸</span>
            <h4 className={darkMode ? 'dark-text' : ''}>Add Clothing</h4>
            <p className={darkMode ? 'dark-subtext' : ''}>Upload your wardrobe items</p>
          </div>

          <div className={`feature-card ${darkMode ? 'dark-feature' : ''}`} onClick={handleWardrobe}>
            <span className="feature-icon">👔</span>
            <h4 className={darkMode ? 'dark-text' : ''}>My Wardrobe</h4>
            <p className={darkMode ? 'dark-subtext' : ''}>View your clothing collection</p>
          </div>

          <div className={`feature-card ${darkMode ? 'dark-feature' : ''}`} onClick={handleRecommendations}>
            <span className="feature-icon">🤖</span>
            <h4 className={darkMode ? 'dark-text' : ''}>Recommendations</h4>
            <p className={darkMode ? 'dark-subtext' : ''}>AI-powered outfit suggestions</p>
          </div>

          <div className={`feature-card ${darkMode ? 'dark-feature' : ''}`} onClick={handleProfile}>
            <span className="feature-icon">👤</span>
            <h4 className={darkMode ? 'dark-text' : ''}>Profile</h4>
            <p className={darkMode ? 'dark-subtext' : ''}>Manage your account</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;