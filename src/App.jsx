
import React, { useState } from 'react';
import Navigation from './components/Navigation';
import MovieExplorer from './components/MovieExplorer';
import BookExplorer from './components/BookExplorer';
import Footer from './components/Footer';
import './App.css';

const App = () => {
  const [currentView, setCurrentView] = useState('movies');

  return (
    <div className="app">
      <Navigation currentView={currentView} onViewChange={setCurrentView} />
      {currentView === 'movies' ? <MovieExplorer /> : <BookExplorer />}
      <Footer currentView={currentView} />
    </div>
  );
};

export default App;
