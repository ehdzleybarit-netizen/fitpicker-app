import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './addclothing.css';

const AddClothing = () => {
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [clothingType, setClothingType] = useState('Top');
  const [color, setColor] = useState('');
  const [style, setStyle] = useState('Casual');
  const [occasion, setOccasion] = useState('Casual');
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
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

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      videoRef.current.srcObject = stream;
      setCameraActive(true);
    } catch (error) {
      alert('Unable to access camera. Please allow camera permissions.');
      console.error('Camera error:', error);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  const capturePhoto = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataUrl = canvas.toDataURL('image/png');
    setImage(imageDataUrl);
    stopCamera();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!image) {
      alert('Please take or upload a photo of your clothing!');
      return;
    }

    setLoading(true);
    const username = localStorage.getItem('username');
    
    const clothingData = {
      username: username,
      image: image,
      type: clothingType,
      color: color,
      style: style,
      occasion: occasion,
      date: new Date().toLocaleDateString()
    };

    console.log('Saving to database:', clothingData);

    try {
      const response = await fetch('http://192.168.1.240/fitpicker-api/save_clothing.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clothingData)
      });

      const result = await response.json();
      console.log('Response from server:', result);

      if (result.success) {
        alert('✓ Clothing item saved to database successfully!');
        setImage(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        const existingItems = JSON.parse(localStorage.getItem('clothingItems') || '[]');
        existingItems.push({ ...clothingData, id: Date.now() });
        localStorage.setItem('clothingItems', JSON.stringify(existingItems));
        navigate('/wardrobe');
      } else {
        alert('✗ ' + result.message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('✗ Connection error! Make sure XAMPP is running.');
    }

    setLoading(false);
  };

  return (
    <div className={`add-clothing-container ${darkMode ? 'dark-mode' : ''}`}>
      <div className={`add-clothing-card ${darkMode ? 'dark-card' : ''}`}>
        <div className="add-clothing-header">
          <button className={`back-btn ${darkMode ? 'dark-btn' : ''}`} onClick={() => navigate('/dashboard')}>
            ← Back
          </button>
          <h1 className={`add-clothing-title ${darkMode ? 'dark-text' : ''}`}>📸 Add Clothing</h1>
        </div>

        <div className={`camera-section ${darkMode ? 'dark-camera' : ''}`}>
          {!cameraActive && !image && (
            <div className={`camera-placeholder ${darkMode ? 'dark-placeholder' : ''}`}>
              <span>📷</span>
              <p>Take a photo or upload from gallery</p>
            </div>
          )}

          <video 
            ref={videoRef} 
            className={`camera-preview ${cameraActive ? 'active' : ''}`} 
            autoPlay 
            playsInline
          />
          
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {image && (
            <div className="image-preview">
              <img src={image} alt="Clothing preview" />
              <button className="remove-image" onClick={removeImage}>
                ✕ Remove
              </button>
            </div>
          )}
        </div>

        <div className="camera-controls">
          {!cameraActive && !image && (
            <button className={`btn-camera ${darkMode ? 'dark-btn-primary' : ''}`} onClick={startCamera}>
              📷 Open Camera
            </button>
          )}

          {cameraActive && (
            <button className={`btn-capture ${darkMode ? 'dark-btn-success' : ''}`} onClick={capturePhoto}>
              📸 Capture
            </button>
          )}

          {cameraActive && (
            <button className={`btn-close-camera ${darkMode ? 'dark-btn-danger' : ''}`} onClick={stopCamera}>
              ✕ Close Camera
            </button>
          )}

          <label className={`btn-upload ${darkMode ? 'dark-btn-info' : ''}`}>
            📁 Upload from Gallery
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        <div className={`clothing-details ${darkMode ? 'dark-section' : ''}`}>
          <h3 className={darkMode ? 'dark-text' : ''}>Clothing Details</h3>
          
          <div className="form-group">
            <label className={darkMode ? 'dark-label' : ''}>Clothing Type</label>
            <select 
              className={darkMode ? 'dark-select' : ''}
              value={clothingType} 
              onChange={(e) => setClothingType(e.target.value)}
            >
              <option>Top</option>
              <option>Bottom</option>
              <option>Dress</option>
              <option>Outerwear</option>
              <option>Footwear</option>
              <option>Accessory</option>
            </select>
          </div>

          <div className="form-group">
            <label className={darkMode ? 'dark-label' : ''}>Color</label>
            <input 
              type="text" 
              className={darkMode ? 'dark-input' : ''}
              value={color} 
              onChange={(e) => setColor(e.target.value)}
              placeholder="e.g., Blue, Red, Black"
            />
          </div>

          <div className="form-group">
            <label className={darkMode ? 'dark-label' : ''}>Style</label>
            <select 
              className={darkMode ? 'dark-select' : ''}
              value={style} 
              onChange={(e) => setStyle(e.target.value)}
            >
              <option>Casual</option>
              <option>Formal</option>
              <option>Trendy</option>
              <option>Classic</option>
              <option>Sporty</option>
              <option>Bohemian</option>
            </select>
          </div>

          {/* OCCASION DROPDOWN */}
          <div className="form-group">
            <label className={darkMode ? 'dark-label' : ''}>Occasion</label>
            <select 
              className={darkMode ? 'dark-select' : ''}
              value={occasion} 
              onChange={(e) => setOccasion(e.target.value)}
            >
              <option>Casual</option>
              <option>Formal</option>
              <option>Work</option>
              <option>School</option>
              <option>Social</option>
              <option>Party</option>
              <option>Sporty</option>
            </select>
          </div>
        </div>

        <button className={`btn-save ${darkMode ? 'dark-btn-primary' : ''}`} onClick={handleSave} disabled={loading}>
          {loading ? 'SAVING...' : '💾 Save Clothing'}
        </button>
      </div>
    </div>
  );
};

export default AddClothing;