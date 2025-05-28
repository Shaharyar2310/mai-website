
import React from 'react';

const Footer = ({ currentView }) => {
  const isMovies = currentView === 'movies';
  
  return (
    <footer>
      <div className="footer-content">
        <div className="footer-section">
          <h3>About {isMovies ? 'Movie' : 'Book'} Explorer</h3>
          <p>
            Discover amazing {isMovies ? 'movies' : 'books'} and 
            {isMovies ? ' explore endless entertainment' : ' expand your reading horizons'}. 
            Your {isMovies ? 'go-to platform for movie recommendations and reviews' : 'ultimate destination for book recommendations and literary exploration'}.
          </p>
        </div>
        <div className="footer-section">
          <h3>Features</h3>
          <ul>
            <li>Browse by {isMovies ? 'genre' : 'category'}</li>
            <li>Search {isMovies ? 'movies' : 'books'}</li>
            <li>{isMovies ? 'Filter by rating' : 'Popular collections'}</li>
            <li>{isMovies ? 'Watch trailers' : 'Read previews'}</li>
          </ul>
        </div>
        <div className="footer-section">
          <h3>Contact</h3>
          <p>Email: info@{isMovies ? 'movie' : 'book'}explorer.com</p>
          <p>Phone: +1 (555) {isMovies ? '123-4567' : '987-6543'}</p>
          <div className="social-links">
            <a href="#" className="social-link" aria-label="Facebook">📘</a>
            <a href="#" className="social-link" aria-label="Twitter">🐦</a>
            <a href="#" className="social-link" aria-label="Instagram">📷</a>
            <a href="#" className="social-link" aria-label="YouTube">📺</a>
            <a href="#" className="social-link" aria-label="LinkedIn">💼</a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2024 {isMovies ? 'Movie' : 'Book'} Explorer. All rights reserved. | Privacy Policy | Terms of Service</p>
      </div>
    </footer>
  );
};

export default Footer;
