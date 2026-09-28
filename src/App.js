import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './login/login';
import Register from './register/register';
import Dashboard from './dashboard/dashboard';
import Profile from './profile/profile';
import AddClothing from './addclothing/addclothing';
import Wardrobe from './wardrobe/wardrobe';
import Recommendation from './recommendation/recommendation';
import CameraScanner from './components/CameraScanner';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/add-clothing" element={<AddClothing />} />
          <Route path="/wardrobe" element={<Wardrobe />} />
          <Route path="/recommendations" element={<Recommendation />} />
          <Route path="/recommendation" element={<Recommendation />} />
          <Route path="/camera-scanner" element={<CameraScanner />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;