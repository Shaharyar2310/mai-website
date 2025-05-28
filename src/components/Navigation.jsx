
import React, { useState, useEffect } from 'react';

const Navigation = ({ currentView, onViewChange }) => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // Check if user is already signed in
    const userData = localStorage.getItem('googleUserData');
    if (userData) {
      const userInfo = JSON.parse(userData);
      setUserName(userInfo.name);
      setIsSignedIn(true);
    }

    // Initialize Google Auth
    const initGoogleAuth = () => {
      if (typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.initialize({
          client_id: '481648255761-lq04us3kevscscjc9eggq66j0fifh0b9.apps.googleusercontent.com',
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true
        });
      }
    };

    const checkGoogleAPI = () => {
      if (typeof google !== 'undefined' && google.accounts) {
        initGoogleAuth();
      } else {
        setTimeout(checkGoogleAPI, 100);
      }
    };

    checkGoogleAPI();
  }, []);

  const handleCredentialResponse = (response) => {
    try {
      const userInfo = JSON.parse(atob(response.credential.split('.')[1]));
      setUserName(userInfo.name);
      setIsSignedIn(true);
      
      localStorage.setItem('googleUserData', JSON.stringify({
        name: userInfo.name,
        email: userInfo.email,
        picture: userInfo.picture
      }));
    } catch (error) {
      console.error('Error processing Google sign-in:', error);
    }
  };

  const handleGoogleSignIn = () => {
    if (typeof google !== 'undefined' && google.accounts) {
      google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.log('Google Sign-In was not displayed or was skipped');
        }
      });
    }
  };

  const handleLogout = () => {
    if (typeof google !== 'undefined' && google.accounts) {
      google.accounts.id.disableAutoSelect();
    }
    setIsSignedIn(false);
    setUserName('');
    localStorage.removeItem('googleUserData');
  };

  return (
    <nav>
      <div className="nav-links">
        <button
          className={currentView === 'movies' ? 'active' : ''}
          onClick={() => onViewChange('movies')}
        >
          <span className="nav-icon">🎬</span>Movies
        </button>
        <button
          className={currentView === 'books' ? 'active' : ''}
          onClick={() => onViewChange('books')}
        >
          <span className="nav-icon">📚</span>Books
        </button>
      </div>
      <div className="auth-section">
        {!isSignedIn ? (
          <div className="google-btn" onClick={handleGoogleSignIn}>
            <img 
              src="https://developers.google.com/identity/images/g-logo.png" 
              alt="Google" 
              className="google-icon"
            />
            Sign in with Google
          </div>
        ) : (
          <div className="user-info">
            <span className="user-name">{userName}</span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
