import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CapacitorHttp } from '@capacitor/core';
import './login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      setMessage('Please enter both username and password!');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await CapacitorHttp.post({
        url: 'http://192.168.1.62/fitpicker-api/login.php',
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          username: username,
          password: password
        }
      });

      console.log('Raw response:', response);
      console.log('Response data:', response.data);
      console.log('Type of response.data:', typeof response.data);

      // ===== I-PARSE KUNG STRING ANG RESPONSE =====
      let result = response.data;
      
      if (typeof result === 'string') {
        try {
          result = JSON.parse(result);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          setMessage('✗ Invalid response from server');
          setMessageType('error');
          setLoading(false);
          return;
        }
      }

      console.log('Parsed result:', result);

      if (result && result.success === true) {
        // ===== I-SAVE ANG USER INFO =====
        const userName = result.user?.username || username;
        localStorage.setItem('username', userName);
        localStorage.setItem('user', JSON.stringify(result.user));
        
        setMessage('✓ Login successful! Welcome ' + userName + '!');
        setMessageType('success');
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      } else {
        setMessage('✗ ' + (result?.message || 'Login failed'));
        setMessageType('error');
        setPassword('');
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('✗ Connection error! Make sure XAMPP is running.');
      setMessageType('error');
    }

    setLoading(false);
  };

  const handleRegister = () => {
    navigate('/register');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="brand-section">
          <span className="logo-icon">👔</span>
          <h1 className="brand-title">FitPicker</h1>
          <p className="brand-subtitle">Your AI-Powered Wardrobe Assistant</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
              <span 
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '🙈' : '👁️'}
              </span>
            </div>
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={showPassword}
                onChange={() => setShowPassword(!showPassword)}
              />
              Show Password
            </label>
          </div>

          {message && (
            <div className={`status-message ${messageType}`}>
              {message}
            </div>
          )}

          <div className="button-group">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'LOGGING IN...' : 'LOGIN'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleRegister}>
              REGISTER
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;