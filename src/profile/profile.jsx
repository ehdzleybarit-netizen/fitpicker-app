import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    age: '18-24',
    skinTone: 'Medium',
    bodyShape: 'Slim',
    preferredStyle: 'Casual',
    favoriteColors: []
  });

  useEffect(() => {
    const user = localStorage.getItem('username');
    if (user) {
      setUsername(user);
      loadProfile(user);
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

  const loadProfile = (user) => {
    const savedProfile = localStorage.getItem('profile');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        setProfile(parsed);
        return;
      } catch (e) {
        console.error('Error parsing profile:', e);
      }
    }
    fetchProfile(user);
  };

  const fetchProfile = async (user) => {
    try {
      const response = await fetch(`http://192.168.1.62/fitpicker-api/get_profile.php?username=${user}`);
      const result = await response.json();
      
      if (result.success) {
        const data = {
          fullName: result.data.full_name || '',
          email: result.data.email || '',
          age: result.data.age || '18-24',
          skinTone: result.data.skin_tone || 'Medium',
          bodyShape: result.data.body_shape || 'Slim',
          preferredStyle: result.data.preferred_style || 'Casual',
          favoriteColors: result.data.favorite_colors ? JSON.parse(result.data.favorite_colors) : []
        };
        setProfile(data);
        localStorage.setItem('profile', JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

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
  };

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value
    });
  };

  const handleColorToggle = (color) => {
    setProfile(prev => {
      const colors = prev.favoriteColors.includes(color)
        ? prev.favoriteColors.filter(c => c !== color)
        : [...prev.favoriteColors, color];
      return { ...prev, favoriteColors: colors };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    localStorage.setItem('profile', JSON.stringify(profile));

    const profileData = {
      username: username,
      fullName: profile.fullName,
      email: profile.email,
      age: profile.age,
      skinTone: profile.skinTone,
      bodyShape: profile.bodyShape,
      preferredStyle: profile.preferredStyle,
      favoriteColors: JSON.stringify(profile.favoriteColors)
    };

    try {
      const response = await fetch('http://192.168.1.62/fitpicker-api/update_profile.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData)
      });

      const result = await response.json();

      if (result.success) {
        setMessage('✓ Profile saved successfully!');
        setMessageType('success');
      } else {
        setMessage('✗ ' + result.message);
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('✗ Connection error! Make sure XAMPP is running.');
      setMessageType('error');
    }

    setLoading(false);
  };

  const colorOptions = ['Red', 'Blue', 'Black', 'White', 'Green', 'Yellow', 'Pink', 'Purple', 'Orange', 'Gray'];

  return (
    <div className={`profile-container ${darkMode ? 'dark-mode' : ''}`}>
      <div className={`profile-card ${darkMode ? 'dark-card' : ''}`}>
        
        {/* ===== HEADER ===== */}
        <div className="profile-header">
          <button className={`back-btn ${darkMode ? 'dark-btn' : ''}`} onClick={() => navigate('/dashboard')}>
            ← Back
          </button>
          <div className="header-center">
            <h1 className={`profile-title ${darkMode ? 'dark-text' : ''}`}>👤 My Profile</h1>
          </div>
          <div className="header-actions">
            <button className={`btn-dark-mode ${darkMode ? 'dark-btn-mode' : ''}`} onClick={toggleDarkMode}>
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>

        <form onSubmit={handleSave}>
          {/* Personal Information */}
          <div className={`profile-section ${darkMode ? 'dark-section' : ''}`}>
            <h3 className={darkMode ? 'dark-text' : ''}>Personal Information</h3>
            
            <div className="form-group">
              <label className={darkMode ? 'dark-label' : ''}>Full Name</label>
              <input
                type="text"
                name="fullName"
                className={darkMode ? 'dark-input' : ''}
                value={profile.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
              />
            </div>

            <div className="form-group">
              <label className={darkMode ? 'dark-label' : ''}>Email</label>
              <input
                type="email"
                name="email"
                className={darkMode ? 'dark-input' : ''}
                value={profile.email}
                onChange={handleChange}
                placeholder="Enter your email"
              />
            </div>
          </div>

          {/* Body Attributes */}
          <div className={`profile-section ${darkMode ? 'dark-section' : ''}`}>
            <h3 className={darkMode ? 'dark-text' : ''}>Body Attributes</h3>
            
            <div className="row-group">
              <div className="form-group half">
                <label className={darkMode ? 'dark-label' : ''}>Age</label>
                <select 
                  name="age" 
                  className={darkMode ? 'dark-select' : ''} 
                  value={profile.age} 
                  onChange={handleChange}
                >
                  <option>18-24</option>
                  <option>25-34</option>
                  <option>35-44</option>
                  <option>45-54</option>
                  <option>55+</option>
                </select>
              </div>

              <div className="form-group half">
                <label className={darkMode ? 'dark-label' : ''}>Skin Tone</label>
                <select 
                  name="skinTone" 
                  className={darkMode ? 'dark-select' : ''} 
                  value={profile.skinTone} 
                  onChange={handleChange}
                >
                  <option>Fair</option>
                  <option>Light</option>
                  <option>Medium</option>
                  <option>Tan</option>
                  <option>Brown</option>
                  <option>Dark</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className={darkMode ? 'dark-label' : ''}>Body Shape</label>
              <select 
                name="bodyShape" 
                className={darkMode ? 'dark-select' : ''} 
                value={profile.bodyShape} 
                onChange={handleChange}
              >
                <option>Slim</option>
                <option>Athletic</option>
                <option>Average</option>
                <option>Curvy</option>
                <option>Plus Size</option>
                <option>Pear-shaped</option>
              </select>
            </div>
          </div>

          {/* Fashion Preferences */}
          <div className={`profile-section ${darkMode ? 'dark-section' : ''}`}>
            <h3 className={darkMode ? 'dark-text' : ''}>Fashion Preferences</h3>
            
            <div className="form-group">
              <label className={darkMode ? 'dark-label' : ''}>Preferred Style</label>
              <select 
                name="preferredStyle" 
                className={darkMode ? 'dark-select' : ''} 
                value={profile.preferredStyle} 
                onChange={handleChange}
              >
                <option>Casual</option>
                <option>Formal</option>
                <option>Trendy</option>
                <option>Classic</option>
                <option>Sporty</option>
                <option>Bohemian</option>
              </select>
            </div>

            <div className="form-group">
              <label className={darkMode ? 'dark-label' : ''}>Favorite Colors</label>
              <div className="color-grid">
                {colorOptions.map(color => (
                  <button
                    key={color}
                    type="button"
                    className={`color-btn ${profile.favoriteColors.includes(color) ? 'selected' : ''} ${darkMode ? 'dark-color-btn' : ''}`}
                    style={{ backgroundColor: color.toLowerCase() }}
                    onClick={() => handleColorToggle(color)}
                  >
                    {profile.favoriteColors.includes(color) && '✓'}
                  </button>
                ))}
              </div>
              <div className={`selected-colors ${darkMode ? 'dark-text' : ''}`}>
                {profile.favoriteColors.length > 0 ? (
                  <p>Selected: <strong>{profile.favoriteColors.join(', ')}</strong></p>
                ) : (
                  <p className={`hint ${darkMode ? 'dark-hint' : ''}`}>Select your favorite colors above</p>
                )}
              </div>
            </div>
          </div>

          {/* AI Recommendations */}
          <div className={`profile-section ai-section ${darkMode ? 'dark-section' : ''}`}>
            <h3 className={darkMode ? 'dark-text' : ''}>🤖 AI Recommendations</h3>
            <p className={darkMode ? 'dark-subtext' : ''}>Based on your profile:</p>
            <ul className={darkMode ? 'dark-list' : ''}>
              <li className={darkMode ? 'dark-list-item' : ''}>
                👕 <strong>Body Shape:</strong> {profile.bodyShape} - Recommended: 
                {profile.bodyShape === 'Slim' ? ' Fitted styles' :
                 profile.bodyShape === 'Athletic' ? ' Athletic cuts' :
                 profile.bodyShape === 'Curvy' ? ' Flattering curves' :
                 profile.bodyShape === 'Plus Size' ? ' Comfortable fits' :
                 ' Balanced silhouettes'}
              </li>
              <li className={darkMode ? 'dark-list-item' : ''}>
                🎨 <strong>Skin Tone:</strong> {profile.skinTone} - Recommended colors: 
                {profile.skinTone === 'Fair' ? ' Pastels, Soft colors' :
                 profile.skinTone === 'Light' ? ' Earth tones, Pastels' :
                 profile.skinTone === 'Medium' ? ' Warm colors, Jewel tones' :
                 profile.skinTone === 'Tan' ? ' Bright colors, Earth tones' :
                 profile.skinTone === 'Brown' ? ' Rich colors, Gold tones' :
                 ' Deep colors, Metallics'}
              </li>
              <li className={darkMode ? 'dark-list-item' : ''}>
                📅 <strong>Style:</strong> {profile.preferredStyle} - 
                {profile.preferredStyle === 'Casual' ? ' Everyday comfortable looks' :
                 profile.preferredStyle === 'Formal' ? ' Elegant professional attire' :
                 profile.preferredStyle === 'Trendy' ? ' Latest fashion styles' :
                 profile.preferredStyle === 'Classic' ? ' Timeless pieces' :
                 ' Sporty and active wear'}
              </li>
            </ul>
          </div>

          {message && (
            <div className={`status-message ${messageType}`}>
              {message}
            </div>
          )}

          {/* ===== SAVE ONLY (WALANG BACK) ===== */}
          <div className="button-group">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'SAVING...' : 'SAVE PROFILE'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;