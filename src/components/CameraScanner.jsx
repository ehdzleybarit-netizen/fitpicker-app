import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import './CameraScanner.css';

const OCCASIONS = [
  { id: 'Casual', icon: '👖', label: 'Casual' },
  { id: 'Formal', icon: '👔', label: 'Formal' },
  { id: 'Sporty', icon: '🏃', label: 'Sporty' },
  { id: 'Work', icon: '💼', label: 'Work' },
  { id: 'Party', icon: '🎉', label: 'Party' },
];

const LOADING_STEPS = [
  { icon: '🔍', title: 'Verifying Person in Photo', desc: 'Gemini AI is checking human presence and posture...' },
  { icon: '🧬', title: 'Analyzing Body & Style', desc: 'Detecting body shape, skin tone and existing aesthetic...' },
  { icon: '✨', title: 'AI Virtual Try-On', desc: 'Tailoring occasion garments to your body with AI Diffusion...' },
  { icon: '🎨', title: 'Preserving Identity', desc: 'Inpainting new clothes while keeping your face, hair and pose...' },
  { icon: '🪄', title: 'Finalizing Outfit Recommendations', desc: 'Styling matching shoes, bottoms, and accessories...' },
];

const CameraScanner = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [occasion, setOccasion] = useState(
    location.state?.occasion || localStorage.getItem('selectedOccasion') || 'Casual'
  );
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [viewMode, setViewMode] = useState('tryon'); // 'tryon' | 'original' | 'split'

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

  // Cycling loading steps for transparent AI feedback
  useEffect(() => {
    if (!loading) {
      setLoadingStepIdx(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingStepIdx((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [loading]);

  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
          audio: false
        });

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
      console.error('Camera error:', error);
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

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  const capturePhoto = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageDataUrl);
    stopCamera();
    analyzePerson(imageDataUrl, occasion);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        setCapturedImage(dataUrl);
        setAnalysisResult(null);
        analyzePerson(file, occasion);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const analyzePerson = async (imageInput, targetOccasion = occasion) => {
    setLoading(true);
    setAnalysisResult(null);
    try {
      const formData = new FormData();
      if (imageInput instanceof File) {
        formData.append('image', imageInput);
      } else {
        const blob = dataURLToBlob(imageInput);
        formData.append('image', blob, 'person.jpg');
      }
      formData.append('occasion', targetOccasion);


      const response = await fetch(`${API_BASE_URL}/analyze_person.php`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      console.log('AI Tryon analysis result:', result);

      if (result.humanDetected === false || (result.success === false && result.message)) {
        alert(result.message || '⚠️ No person detected in the photo. Please make sure a human is clearly visible.');
        return;
      }

      if (result.success) {
        setAnalysisResult(result);
        setViewMode('tryon');
      } else {
        alert('Analysis error: ' + (result.message || 'Unable to complete AI tryon'));
      }
    } catch (error) {
      console.error('Error during AI analysis:', error);
      alert('Connection error! Please make sure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchOccasion = (newOccasion) => {
    setOccasion(newOccasion);
    localStorage.setItem('selectedOccasion', newOccasion);
    if (capturedImage && !loading) {
      analyzePerson(capturedImage, newOccasion);
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
    if (newMode) {
      document.body.classList.add('dark-mode');
      document.documentElement.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
      document.documentElement.classList.remove('dark-mode');
    }
  };

  // Helper to format image URLs
  const resolveImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
      return path;
    }
    return `${API_BASE_URL}/${path}`;
  };

  const tryonImgUrl = analysisResult?.tryonBase64 || resolveImageUrl(analysisResult?.tryonImage || analysisResult?.tryonRemoteUrl);
  const originalImgUrl = analysisResult?.originalBase64 || capturedImage || resolveImageUrl(analysisResult?.originalImage);

  return (
    <div className={`camera-scanner-container ${darkMode ? 'dark-mode' : ''}`}>
      <div className={`camera-scanner-card ${darkMode ? 'dark-card' : ''}`}>
        
        {/* Header */}
        <div className="camera-scanner-header">
          <button className={`back-btn ${darkMode ? 'dark-btn' : ''}`} onClick={() => navigate('/dashboard')}>
            ← Back
          </button>
          <div className="header-title-box">
            <h1 className={`camera-scanner-title ${darkMode ? 'dark-text' : ''}`}>✨ Scan with AI</h1>
            <span className="header-subtitle">Virtual Try-On • Identity Preserved</span>
          </div>
          <button className={`btn-dark-mode ${darkMode ? 'dark-btn-mode' : ''}`} onClick={toggleDarkMode}>
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>

        {/* Occasion Selector Ribbon */}
        <div className="occasion-selector-container">
          <span className="occasion-selector-label">Occasion:</span>
          <div className="occasion-pill-group">
            {OCCASIONS.map((occ) => (
              <button
                key={occ.id}
                className={`occasion-pill ${occasion === occ.id ? 'active' : ''} ${darkMode ? 'dark-pill' : ''}`}
                onClick={() => handleSwitchOccasion(occ.id)}
                disabled={loading}
              >
                <span>{occ.icon}</span>
                <span>{occ.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* RESULTS VIEW */}
        {analysisResult ? (
          <div className="ai-results-view">
            
            {/* Hero Virtual Try-On Banner */}
            <div className={`ai-tryon-hero-card ${darkMode ? 'dark-hero' : ''}`}>
              <div className="tryon-card-header">
                <div className="tryon-badge">
                  <span>✨ AI Virtual Try-On</span>
                  <span className="tryon-occasion-tag">{occasion} Garb</span>
                </div>
                <div className="view-toggle-group">
                  <button
                    className={`btn-view-toggle ${viewMode === 'tryon' ? 'active' : ''}`}
                    onClick={() => setViewMode('tryon')}
                  >
                    ✨ New Look
                  </button>
                  <button
                    className={`btn-view-toggle ${viewMode === 'original' ? 'active' : ''}`}
                    onClick={() => setViewMode('original')}
                  >
                    📸 Original
                  </button>
                  <button
                    className={`btn-view-toggle ${viewMode === 'split' ? 'active' : ''}`}
                    onClick={() => setViewMode('split')}
                  >
                    ↔️ Side by Side
                  </button>
                </div>
              </div>

              {/* Visual Showcase */}
              <div className="tryon-visual-stage">
                {viewMode === 'tryon' && (
                  <div className="single-image-wrapper">
                    {tryonImgUrl ? (
                      <img src={tryonImgUrl} alt="AI Virtual Try-On" className="tryon-main-image" />
                    ) : (
                      <div className="tryon-fallback">
                        <img src={originalImgUrl} alt="Original" className="tryon-main-image" />
                        <p className="tryon-fallback-text">Diffusion preview rendered recommendations below.</p>
                      </div>
                    )}
                    <div className="image-caption-badge">
                      <span>👤 Same Person • Inpainted for {occasion}</span>
                    </div>
                  </div>
                )}

                {viewMode === 'original' && (
                  <div className="single-image-wrapper">
                    <img src={originalImgUrl} alt="Original Upload" className="tryon-main-image" />
                    <div className="image-caption-badge original-badge">
                      <span>📸 Original Photo</span>
                    </div>
                  </div>
                )}

                {viewMode === 'split' && (
                  <div className="split-view-container">
                    <div className="split-item">
                      <div className="split-label">Original Photo</div>
                      <img src={originalImgUrl} alt="Original" className="split-image" />
                    </div>
                    <div className="split-item">
                      <div className="split-label tryon-label">AI {occasion} Try-On</div>
                      <img src={tryonImgUrl || originalImgUrl} alt="AI Try-On" className="split-image" />
                    </div>
                  </div>
                )}
              </div>

              <div className="tryon-info-footnote">
                <p>
                  💡 <strong>Real AI Inpainting:</strong> The exact same person's face, skin, and body are preserved while their clothing was tailored for <strong>{occasion}</strong>.
                </p>
              </div>
            </div>

            {/* Gemini Body & Style Analysis Badges */}
            <div className={`ai-person-summary ${darkMode ? 'dark-summary' : ''}`}>
              <div className="summary-title-row">
                <span className="summary-title">🧬 Gemini Fashion Analysis</span>
                <span className="ai-model-tag">Google Gemini AI</span>
              </div>
              <div className="ai-tags-row">
                <span className="ai-tag">🧍 Body: <strong>{analysisResult.bodyShape || 'Proportional'}</strong></span>
                <span className="ai-tag">🎨 Skin Tone: <strong>{analysisResult.skinTone || 'Natural'}</strong></span>
                <span className="ai-tag">⏳ Age: <strong>{analysisResult.ageRange || 'Adult'}</strong></span>
                <span className="ai-tag">🚻 Presentation: <strong>{analysisResult.gender || 'Unisex'}</strong></span>
                <span className="ai-tag">👔 Current Style: <strong>{analysisResult.currentStyle || 'Casual'}</strong></span>
              </div>
            </div>

            {/* Recommended Garbs Breakdown */}
            <div className="ai-garbs-header">
              <h3 className={darkMode ? 'dark-text' : ''}>
                👔 Recommended Garbs for <strong>{occasion}</strong>
              </h3>
              <p className="ai-garbs-sub">Stylist recommendations tailored to your body type & skin tone:</p>
            </div>

            <div className="ai-garbs-grid">
              {analysisResult.suggestedOutfits?.map((garb, idx) => (
                <div key={idx} className={`ai-garb-card ${darkMode ? 'dark-garb-card' : ''}`}>
                  <div className="ai-garb-card-top">
                    <span className="ai-garb-num">Look #{idx + 1}</span>
                    <span className="ai-garb-occ-tag">{occasion}</span>
                  </div>
                  <h4 className="ai-garb-name">{garb.name}</h4>
                  <p className="ai-garb-desc">{garb.description}</p>
                  <div className="ai-garb-items">
                    <div className="ai-garb-row"><span>👕 Top:</span> <strong>{garb.top}</strong></div>
                    <div className="ai-garb-row"><span>👖 Bottom:</span> <strong>{garb.bottom}</strong></div>
                    {garb.footwear && (
                      <div className="ai-garb-row"><span>👟 Shoes:</span> <strong>{garb.footwear}</strong></div>
                    )}
                    {garb.accessories && (
                      <div className="ai-garb-row"><span>🕶️ Extras:</span> <strong>{garb.accessories}</strong></div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Try Another Occasion Quick Switcher */}
            <div className={`re-tryon-panel ${darkMode ? 'dark-re-panel' : ''}`}>
              <p className="re-tryon-title">🔄 Try Another Occasion for This Photo:</p>
              <div className="re-tryon-buttons">
                {OCCASIONS.filter((o) => o.id !== occasion).map((occ) => (
                  <button
                    key={occ.id}
                    className="btn-re-tryon"
                    onClick={() => handleSwitchOccasion(occ.id)}
                    disabled={loading}
                  >
                    {occ.icon} Generate {occ.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Controls */}
            <div className="ai-results-controls">
              <button className="btn-scan-again" onClick={removeImage}>
                📸 Scan Another Person
              </button>
            </div>
          </div>
        ) : (
          /* SCAN / CAPTURE VIEW */
          <div className="scan-capture-section">
            <div className={`camera-section ${darkMode ? 'dark-camera' : ''}`}>
              {!cameraActive && !capturedImage && (
                <div className={`camera-placeholder ${darkMode ? 'dark-placeholder' : ''}`}>
                  <span className="placeholder-icon">🧑</span>
                  <h3>Point camera at a person</h3>
                  <p>Upload or snap a photo of yourself or a friend</p>
                  <div className="placeholder-tags">
                    <span className="hint-pill">✨ Identity Preserved</span>
                    <span className="hint-pill">👔 Tailored to {occasion}</span>
                    <span className="hint-pill">⚡ Real AI Diffusion</span>
                  </div>
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
                  <img src={capturedImage} alt="Captured Person" />
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
                  <label 
                    className={`btn-upload ${darkMode ? 'dark-btn-info' : ''}`}
                    style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer' }}
                  >
                    <span>📤 Upload Photo</span>
                    <input 
                      id="scanner-photo-upload"
                      ref={fileInputRef}
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileUpload}
                      style={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        width: '100%', 
                        height: '100%', 
                        opacity: 0, 
                        cursor: 'pointer',
                        zIndex: 10
                      }}
                    />
                  </label>
                </>
              )}

              {cameraActive && (
                <>
                  <button className={`btn-capture ${darkMode ? 'dark-btn-success' : ''}`} onClick={capturePhoto}>
                    📸 Capture Person
                  </button>
                  <button className={`btn-close-camera ${darkMode ? 'dark-btn-danger' : ''}`} onClick={stopCamera}>
                    ✕ Close Camera
                  </button>
                </>
              )}

              {capturedImage && (
                <>
                  <button className={`btn-retry ${darkMode ? 'dark-btn-warning' : ''}`} onClick={removeImage}>
                    🔄 Retake
                  </button>
                  <label 
                    className={`btn-upload ${darkMode ? 'dark-btn-info' : ''}`}
                    style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer' }}
                  >
                    <span>📤 Upload New</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileUpload}
                      style={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        width: '100%', 
                        height: '100%', 
                        opacity: 0, 
                        cursor: 'pointer',
                        zIndex: 10
                      }}
                    />
                  </label>
                </>
              )}
            </div>

            <div className="camera-info">
              <p>
                <strong>Virtual Try-On AI:</strong> Upload a photo of a person to see them wearing occasion-ready garbs!
              </p>
              <p className="camera-info-small">Powered by Google Gemini Vision & IDM-VTON Diffusion</p>
            </div>
          </div>
        )}

        {/* Dynamic Multi-Step AI Loading Overlay */}
        {loading && (
          <div className="loading-overlay">
            <div className="loading-content-box">
              <div className="ai-radar-pulsar">
                <span className="radar-icon">{LOADING_STEPS[loadingStepIdx].icon}</span>
                <div className="radar-ring ring-1" />
                <div className="radar-ring ring-2" />
                <div className="radar-ring ring-3" />
              </div>
              <h3 className="loading-step-title">{LOADING_STEPS[loadingStepIdx].title}</h3>
              <p className="loading-step-desc">{LOADING_STEPS[loadingStepIdx].desc}</p>
              
              <div className="loading-progress-bar-container">
                <div className="loading-progress-bar-fill" />
              </div>
              
              <span className="loading-target-occasion">
                Generating <strong>{occasion}</strong> Outfit for the same person...
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CameraScanner;