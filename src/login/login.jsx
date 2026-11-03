import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
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
          const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username.trim())
      .single();

    if (error || !data) {
      setMessage('✗ Invalid username or password!');
      setMessageType('error');
      setLoading(false);
      return;
    }

    if (data.password !== password.trim()) {
      setMessage('✗ Invalid username or password!');
      setMessageType('error');
      setLoading(false);
      return;
    }

    // Success
    localStorage.setItem('username', data.username);
    localStorage.setItem('user', JSON.stringify(data));
    setMessage('✓ Login successful! Welcome ' + data.username + '!');
    setMessageType('success');
    
    setTimeout(() => {
      navigate('/dashboard');
    }, 1000);

    
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