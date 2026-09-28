import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CameraScanner.css';

const CameraScanner = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
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

  // ===== ITO ANG GUMAGANANG CAMERA CODE (KOPYA MULA SA ADD CLOTHING) =====
  const startCamera = async () => {
  try {
    console.log('📷 Requesting camera...');

    // ===== I-REQUEST ANG CAMERA PERMISSION =====
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });

      console.log('✅ Camera accessed!');

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
        };
      }
      setCameraActive(true);
    } else {
      alert('Camera not supported on this device.');
    }
  } catch (error) {
    console.error('❌ Camera error:', error);

    let errorMsg = 'Unable to access camera. ';

    if (error.name === 'NotAllowedError') {
      errorMsg += 'Please allow camera permissions in Settings.';
    } else if (error.name === 'NotFoundError') {
      errorMsg += 'No camera found.';
    } else if (error.name === 'NotReadableError') {
      errorMsg += 'Camera is already in use by another app.';
    } else {
      errorMsg += error.message;
    }

    alert(errorMsg);
  }

  };

  // ===== ITO RIN ANG STOP CAMERA MULA SA ADD CLOTHING =====
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  // ===== CAPTURE PHOTO (GAYA RIN SA ADD CLOTHING) =====
  const capturePhoto = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataUrl = canvas.toDataURL('image/png');
    setCapturedImage(imageDataUrl);
    stopCamera();
    analyzePerson(imageDataUrl);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCapturedImage(event.target.result);
        analyzePerson(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setCapturedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const analyzePerson = async (imageData) => {
    setLoading(true);
    try {
      let formData = new FormData();
      
      if (imageData instanceof File) {
        formData.append('image', imageData);
      } else {
        const blob = dataURLToBlob(imageData);
        formData.append('image', blob, 'person.jpg');
      }

      const response = await fetch('http://192.168.1.240/fitpicker-api/analyze_person.php', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      console.log('Analysis result:', result);

      if (result.success) {
        navigate('/recommendation', { 
          state: { 
            analyzedPerson: result,
            image: capturedImage,
            fromCamera: true,
            suggestedOutfits: result.suggestedOutfits 
          } 
        });
      } else {
        alert('Analysis failed: ' + result.message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Connection error! Make sure XAMPP is running.');
    } finally {
      setLoading(false);
    }
  };

  const dataURLToBlob = (dataURL) => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', JSON.stringify(newMode));
  };

  return (
    <div className={`camera-scanner-container ${darkMode ? 'dark-mode' : ''}`}>
      <div className={`camera-scanner-card ${darkMode ? 'dark-card' : ''}`}>
        
        <div className="camera-scanner-header">
          <button className={`back-btn ${darkMode ? 'dark-btn' : ''}`} onClick={() => navigate('/dashboard')}>
            ← Back
          </button>
          <h1 className={`camera-scanner-title ${darkMode ? 'dark-text' : ''}`}>🔍 AI Virtual Try-On</h1>
          <button className={`btn-dark-mode ${darkMode ? 'dark-btn-mode' : ''}`} onClick={toggleDarkMode}>
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>

        <div className={`camera-section ${darkMode ? 'dark-camera' : ''}`}>
          {!cameraActive && !capturedImage && (
            <div className={`camera-placeholder ${darkMode ? 'dark-placeholder' : ''}`}>
              <span>🧑</span>
              <p>Point camera at a person</p>
              <small>AI will analyze body type and suggest outfits</small>
            </div>
          )}

          <video 
            ref={videoRef} 
            className={`camera-preview ${cameraActive ? 'active' : ''}`} 
            autoPlay 
            playsInline
          />
          
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {capturedImage && (
            <div className="image-preview">
              <img src={capturedImage} alt="Captured" />
              <button className="remove-image" onClick={removeImage}>
                ✕ Remove
              </button>
            </div>
          )}
        </div>

        <div className="camera-controls">
          {!cameraActive && !capturedImage && (
            <>
              <button className={`btn-camera ${darkMode ? 'dark-btn-primary' : ''}`} onClick={startCamera}>
                📷 Open Camera
              </button>
              <label className={`btn-upload ${darkMode ? 'dark-btn-info' : ''}`}>
                📤 Upload Photo
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </>
          )}

          {cameraActive && (
            <>
              <button className={`btn-capture ${darkMode ? 'dark-btn-success' : ''}`} onClick={capturePhoto}>
                📸 Capture
              </button>
              <button className={`btn-close-camera ${darkMode ? 'dark-btn-danger' : ''}`} onClick={stopCamera}>
                ✕ Close Camera
              </button>
            </>
          )}

          {capturedImage && (
            <>
              <button className={`btn-retry ${darkMode ? 'dark-btn-warning' : ''}`} onClick={removeImage}>
                🔄 Retry
              </button>
              <label className={`btn-upload ${darkMode ? 'dark-btn-info' : ''}`}>
                📤 Upload New
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </>
          )}
        </div>

        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner">⏳</div>
            <p>AI is analyzing your body type...</p>
            <p style={{ fontSize: '12px', color: '#aaa' }}>Finding the perfect outfits for you</p>
          </div>
        )}

        <div className="camera-info">
          <p>AI will suggest outfits based on your body type, skin tone, and style</p>
          <p className="camera-info-small">Powered by Google Gemini AI</p>
        </div>

      </div>
    </div>
  );
};

export default CameraScanner;