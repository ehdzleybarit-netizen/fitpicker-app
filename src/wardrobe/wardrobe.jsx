import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './wardrobe.css';

const Wardrobe = () => {
  const navigate = useNavigate();
  const [clothingItems, setClothingItems] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  // ===== IP ADDRESS NG PC MO =====
  const IP = '192.168.1.62'; 
  const API_URL = `http://${IP}/fitpicker-api`; 

  useEffect(() => {
    loadItems();
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

  const loadItems = async () => {
    setLoading(true);
    const username = localStorage.getItem('username');
    
    try {
      // ✅ PALITAN NG IP ITO
      const response = await fetch(`${API_URL}/get_clothing.php?username=${username}`);
      const result = await response.json();
      
      if (result.success) {
        setClothingItems(result.data);
        localStorage.setItem('clothingItems', JSON.stringify(result.data));
      } else {
        const items = JSON.parse(localStorage.getItem('clothingItems') || '[]');
        setClothingItems(items);
      }
    } catch (error) {
      console.error('Error loading items:', error);
      const items = JSON.parse(localStorage.getItem('clothingItems') || '[]');
      setClothingItems(items);
    }
    setLoading(false);
  };

  const deleteItem = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      const username = localStorage.getItem('username');
      
      try {
        // ✅ PALITAN NG IP ITO
        const response = await fetch(`${API_URL}/delete_clothing.php`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: id, username: username })
        });

        const result = await response.json();

        if (result.success) {
          const updatedItems = clothingItems.filter(item => item.id !== id);
          setClothingItems(updatedItems);
          localStorage.setItem('clothingItems', JSON.stringify(updatedItems));
          alert('✅ Item deleted successfully!');
        } else {
          alert('❌ Failed to delete item: ' + result.message);
        }
      } catch (error) {
        console.error('Error:', error);
        alert('❌ Connection error! Make sure XAMPP is running.');
      }
    }
  };

  const getFilteredItems = () => {
    if (filter === 'All') return clothingItems;
    return clothingItems.filter(item => item.type === filter);
  };

  const getTypeCount = (type) => {
    return clothingItems.filter(item => item.type === type).length;
  };

  const types = ['All', 'Top', 'Bottom', 'Dress', 'Outerwear', 'Footwear', 'Accessory'];

  const filteredItems = getFilteredItems();

  return (
    <div className={`wardrobe-container ${darkMode ? 'dark-mode' : ''}`}>
      <div className={`wardrobe-card ${darkMode ? 'dark-card' : ''}`}>
        <div className="wardrobe-header">
          <button className={`back-btn ${darkMode ? 'dark-btn' : ''}`} onClick={() => navigate('/dashboard')}>
            ← Back
          </button>
          <h1 className={`wardrobe-title ${darkMode ? 'dark-text' : ''}`}>👔 My Wardrobe</h1>
        </div>

        <div className="wardrobe-stats">
          <div className={`stat-card ${darkMode ? 'dark-stat' : ''}`}>
            <span className="stat-number">{clothingItems.length}</span>
            <span className={`stat-label ${darkMode ? 'dark-text' : ''}`}>Total Items</span>
          </div>
          <div className={`stat-card ${darkMode ? 'dark-stat' : ''}`}>
            <span className="stat-number">{getTypeCount('Top')}</span>
            <span className={`stat-label ${darkMode ? 'dark-text' : ''}`}>Tops</span>
          </div>
          <div className={`stat-card ${darkMode ? 'dark-stat' : ''}`}>
            <span className="stat-number">{getTypeCount('Bottom')}</span>
            <span className={`stat-label ${darkMode ? 'dark-text' : ''}`}>Bottoms</span>
          </div>
          <div className={`stat-card ${darkMode ? 'dark-stat' : ''}`}>
            <span className="stat-number">{getTypeCount('Dress')}</span>
            <span className={`stat-label ${darkMode ? 'dark-text' : ''}`}>Dresses</span>
          </div>
        </div>

        <div className="filter-section">
          <div className="filter-buttons">
            {types.map(type => (
              <button
                key={type}
                className={`filter-btn ${filter === type ? 'active' : ''} ${darkMode ? 'dark-filter' : ''}`}
                onClick={() => setFilter(type)}
              >
                {type} ({type === 'All' ? clothingItems.length : getTypeCount(type)})
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <p>Loading your wardrobe...</p>
          </div>
        ) : clothingItems.length === 0 ? (
          <div className={`empty-state ${darkMode ? 'dark-empty' : ''}`}>
            <span className="empty-icon">👔</span>
            <h3 className={darkMode ? 'dark-text' : ''}>No clothing items yet</h3>
            <p className={darkMode ? 'dark-subtext' : ''}>Go to Dashboard and click "Add Clothing" to add items</p>
          </div>
        ) : (
          <div className="wardrobe-grid">
            {filteredItems.map(item => (
              <div key={item.id} className={`wardrobe-item ${darkMode ? 'dark-item' : ''}`}>
                <div className="item-image">
                  <img src={item.image} alt={item.type} />
                  <button className="btn-delete" onClick={() => deleteItem(item.id)}>
                    ✕
                  </button>
                </div>
                <div className="item-details">
                  <span className={`item-type ${darkMode ? 'dark-text' : ''}`}>{item.type}</span>
                  <span className={`item-color ${darkMode ? 'dark-subtext' : ''}`}>🎨 {item.color || 'No color'}</span>
                  <span className={`item-style ${darkMode ? 'dark-subtext' : ''}`}>📅 {item.style || 'Casual'}</span>
                  <span className={`item-date ${darkMode ? 'dark-subtext' : ''}`}>📆 {item.date_added || item.date}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wardrobe;