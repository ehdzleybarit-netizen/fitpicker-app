-- FitPicker Database Schema
CREATE DATABASE IF NOT EXISTS fitpicker_db;
USE fitpicker_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    age VARCHAR(50) DEFAULT '18-24',
    skin_tone VARCHAR(50) DEFAULT 'Medium',
    body_shape VARCHAR(50) DEFAULT 'Slim',
    preferred_style VARCHAR(50) DEFAULT 'Casual',
    favorite_colors TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clothing items table
CREATE TABLE IF NOT EXISTS clothing_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    image LONGTEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'Top',
    color VARCHAR(50),
    style VARCHAR(50) DEFAULT 'Casual',
    date_added DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (username)
);
