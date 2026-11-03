import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useNavigate } from 'react-router-dom';
import './recommendation.css';

const Recommendation = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [occasion, setOccasion] = useState('Sporty');
  const [stats, setStats] = useState({ total: 0, filtered: 0, outfits: 0 });
  const [clothingItems, setClothingItems] = useState([]); 
  const [outfits, setOutfits] = useState([]);
  
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      setDarkMode(JSON.parse(savedDarkMode));
    }
    loadItemsAndGenerate();
 }, [occasion]); 

  
 const loadItemsAndGenerate = async () => {
  setLoading(true);
  const username = localStorage.getItem('username');

  try {
    const { data, error } = await supabase
      .from('clothing_items')
      .select('*')
      .eq('username', username);

    if (error) throw error;

    // 1. I-filter base sa occasion (case-insensitive at walang space)
    const filtered = data.filter(item => 
      (item.occasion || '').trim().toLowerCase() === occasion.trim().toLowerCase()
    );

    // 2. Ihiwalay ang Top at Bottom
    const tops = filtered.filter(item => (item.type || '').toLowerCase() === 'top');
    const bottoms = filtered.filter(item => (item.type || '').toLowerCase() === 'bottom');

    // 3. I-set ang Stats
    setStats({
      total: data.length || 0,
      filtered: filtered.length || 0,
      outfits: (tops.length > 0 && bottoms.length > 0) ? 1 : 0
    });

    // 4. I-generate ang Outfit kung may Top at Bottom
    if (tops.length > 0 && bottoms.length > 0) {
      const bestTop = tops[0];
      const bestBottom = bottoms[0];
      const score = calculateScore(bestTop, bestBottom); // Siguraduhing nasa baba ang function na ito

      setOutfits([{
        top: bestTop,
        bottom: bestBottom,
        score: score,
        type: `${occasion} Look`
      }]);
    } else {
      setOutfits([]);
    }

  } catch (error) {
    console.error('Fetch error:', error);
  } finally {
    setLoading(false);
  }
};

  // ===== SCORING SYSTEM =====
  const calculateScore = (top, bottom) => {
    let score = 0;
    
    // 1. Color harmony
    const goodCombinations = [
      ['black', 'white'], ['black', 'blue'], ['black', 'gray'],
      ['white', 'black'], ['white', 'blue'],
      ['blue', 'black'], ['blue', 'white'],
      ['gray', 'black'], ['gray', 'white'],
      ['black', 'red'], ['white', 'red']
    ];
    
    const topColor = (top.color || '').toLowerCase();
    const bottomColor = (bottom.color || '').toLowerCase();
    
    for (let combo of goodCombinations) {
      if ((topColor === combo[0] && bottomColor === combo[1]) ||
          (topColor === combo[1] && bottomColor === combo[0])) {
        score += 10;
        break;
      }
    }
    
    // 2. Same style = good match
    if ((top.style || '').toLowerCase() === (bottom.style || '').toLowerCase()) {
      score += 8;
    }
    
    // 3. Color variety bonus
    if (topColor !== bottomColor) {
      score += 5;
    }
    
    // 4. May kulay bonus
    if (topColor && topColor !== 'no color') score += 2;
    if (bottomColor && bottomColor !== 'no color') score += 2;
    
    return score;
  };

  // ===== SCORE LABELS =====
  const getScoreLabel = (score) => {
    if (score >= 25) return 'Perfect Match! ';
    if (score >= 20) return 'Excellent Match! ';
    if (score >= 15) return 'Great Match! ';
    if (score >= 10) return 'Good Match';
    if (score >= 5) return 'Decent Match';
    return 'Try Different';
  };

  const getScoreColor = (score) => {
    if (score >= 25) return '#2ecc71';
    if (score >= 20) return '#3498db';
    if (score >= 15) return '#f39c12';
    if (score >= 10) return '#e67e22';
    if (score >= 5) return '#95a5a6';
    return '#e74c3c';
  };

  // ===== HANDLE OCCASION CHANGE =====
  const handleOccasionChange = (e) => {
    const newOccasion = e.target.value;
    console.log('🔄 Occasion changed to:', newOccasion);
    setOccasion(newOccasion);
    
    const items = JSON.parse(localStorage.getItem('clothingItems') || '[]');
  };

  // ===== REFRESH =====
  const handleRefresh = () => {
    loadItemsAndGenerate();
  };

  // ===== TOGGLE DARK MODE =====
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', JSON.stringify(newMode));
  };

  return (
    <div className={`recommendation-container ${darkMode ? 'dark-mode' : ''}`}>
      <div className={`recommendation-card ${darkMode ? 'dark-card' : ''}`}>
        {/* ===== HEADER ===== */}
        <div className="recommendation-header">
          <button className={`back-btn ${darkMode ? 'dark-btn' : ''}`} onClick={() => navigate('/dashboard')}>
            ← Back
          </button>
          <h1 className={`recommendation-title ${darkMode ? 'dark-text' : ''}`}>⌬ AI Recommendations</h1>
          
        </div>

        {/* ===== OCCASION SELECTOR ===== */}
        <div className={`occasion-section ${darkMode ? 'dark-section' : ''}`}>
          <h3 className={darkMode ? 'dark-text' : ''}>Select Occasion</h3>
          <div className="occasion-controls">
            <select
              className={`occasion-select ${darkMode ? 'dark-select' : ''}`}
              value={occasion}
              onChange={handleOccasionChange}
            >
              <option value="Casual">Casual</option>
              <option value="Formal">Formal</option>
              <option value="Work">Work</option>
              <option value="School">School</option>
              <option value="Social">Social</option>
              <option value="Party">Party</option>
              <option value="Sporty">Sporty</option>
              <option value="Trendy">Trendy</option>
            </select>
            <button className="btn-refresh" onClick={handleRefresh}>
              ⟳ Refresh
            </button>
          </div>
        </div>

        {/* ===== STATISTICS ===== */}
        <div className={`decision-tree-stats ${darkMode ? 'dark-section' : ''}`}>
          <h3 className={darkMode ? 'dark-text' : ''}>Decision Tree Results</h3>
          <div className="stats-grid">
            <div className={`stat-item ${darkMode ? 'dark-stat' : ''}`}>
              <span className="stat-number">{stats.total}</span>
              <span className={`stat-label ${darkMode ? 'dark-text' : ''}`}>Total Items</span>
            </div>
            <div className={`stat-item ${darkMode ? 'dark-stat' : ''}`}>
              <span className="stat-number">{stats.filtered}</span>
              <span className={`stat-label ${darkMode ? 'dark-text' : ''}`}>Filtered Items</span>
            </div>
            <div className={`stat-item ${darkMode ? 'dark-stat' : ''}`}>
              <span className="stat-number">{stats.outfits}</span>
              <span className={`stat-label ${darkMode ? 'dark-text' : ''}`}>Outfits Generated</span>
            </div>
          </div>
        </div>

        {/* ===== RESULTS ===== */}
        {loading ? (
          <div className="loading-state">
            <p>⏳ Analyzing your style...</p>
          </div>
        ) : outfits.length === 0 ? (
          <div className={`empty-state ${darkMode ? 'dark-empty' : ''}`}>
            <span className="empty-icon">☷</span>
            <h3 className={darkMode ? 'dark-text' : ''}>No outfits found</h3>
            <p className={darkMode ? 'dark-subtext' : ''}>
              Items with style "{occasion}": {stats.filtered} found.<br />
              You need at least 1 <strong>Top</strong> and 1 <strong>Bottom</strong> with style "{occasion}".
            </p>
            <button className="btn-add-first" onClick={() => navigate('/add-clothing')}>
              + Add Clothing
            </button>
          </div>
        ) : (
          <div className="outfits-grid">
            {outfits.map((outfit, index) => (
              <div key={index} className={`outfit-card ${darkMode ? 'dark-item' : ''}`}>
                {/* Best Match Badge */}
                {index === 0 && <div className="best-match-badge">🏆 Best Match</div>}
                
                {/* Outfit Number */}
                <div className="outfit-number">#{index + 1}</div>
                
                {/* Score */}
                <div className="outfit-score" style={{ color: getScoreColor(outfit.score) }}>
                  Score: {outfit.score}/27 ({Math.round((outfit.score / 27) * 100)}%) - {getScoreLabel(outfit.score)}
                </div>
                
                {/* ===== OUTFIT COMBINATION ===== */}
                <div className="outfit-combination">
                  {/* TOP */}
                  <div className="outfit-item">
                    <div className="item-image-container">
                      {outfit.top && outfit.top.image ? (
                        <img 
                          src={outfit.top.image} 
                          alt={outfit.top.type} 
                          className="item-image"
                        />
                      ) : (
                        <div className="item-placeholder">👕</div>
                      )}
                    </div>
                    <div className="item-details">
                      <span className="item-label">Top</span>
                      <span className="item-color">🎨 {outfit.top?.color || 'No color'}</span>
                      <span className="item-style">🏳️ {outfit.top?.style || 'No style'}</span>
                    </div>
                  </div>

                  {/* PLUS SIGN */}
                  <div className="outfit-arrow">➕</div>

                  {/* BOTTOM */}
                  <div className="outfit-item">
                    <div className="item-image-container">
                      {outfit.bottom && outfit.bottom.image ? (
                        <img 
                          src={outfit.bottom.image} 
                          alt={outfit.bottom.type} 
                          className="item-image"
                        />
                      ) : (
                        <div className="item-placeholder">👖</div>
                      )}
                    </div>
                    <div className="item-details">
                      <span className="item-label">Bottom</span>
                      <span className="item-color">🎨 {outfit.bottom?.color || 'No color'}</span>
                      <span className="item-style">🏳️ {outfit.bottom?.style || 'No style'}</span>
                    </div>
                  </div>
                </div>

                {/* Outfit Type */}
                <div className="outfit-type">{outfit.type}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Recommendation;