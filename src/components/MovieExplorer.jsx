
import React, { useState, useEffect } from 'react';
import Modal from './Modal';

const MOVIE_API_KEY = "ed103f0b096e2342ceea2741dd22538b";

const MovieExplorer = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [modalData, setModalData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch genres
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const res = await fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${MOVIE_API_KEY}&language=en-US`);
        const data = await res.json();
        setGenres(data.genres || []);
      } catch (error) {
        console.error('Failed to fetch genres:', error);
      }
    };
    fetchGenres();
  }, []);

  // Fetch movies
  useEffect(() => {
    if (searchQuery.length >= 3) {
      searchMovies(searchQuery);
    } else if (searchQuery.length === 0) {
      if (selectedGenre) {
        fetchMoviesByGenre(selectedGenre);
      } else {
        fetchMoviesByFilter(selectedFilter);
      }
    }
  }, [searchQuery, selectedFilter, selectedGenre]);

  const fetchMoviesByFilter = async (filter) => {
    setLoading(true);
    try {
      let url = `https://api.themoviedb.org/3/movie/${filter === 'all' ? 'popular' : filter}?api_key=${MOVIE_API_KEY}&language=en-US&page=1`;
      const res = await fetch(url);
      const data = await res.json();
      setMovies(data.results || []);
    } catch (error) {
      console.error('Failed to fetch movies:', error);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMoviesByGenre = async (genreId) => {
    setLoading(true);
    try {
      const res = await fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${MOVIE_API_KEY}&language=en-US&with_genres=${genreId}&page=1`);
      const data = await res.json();
      setMovies(data.results || []);
    } catch (error) {
      console.error('Failed to fetch movies by genre:', error);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  const searchMovies = async (query) => {
    setLoading(true);
    try {
      const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${MOVIE_API_KEY}&language=en-US&query=${encodeURIComponent(query)}&page=1&include_adult=false`);
      const data = await res.json();
      setMovies(data.results || []);
    } catch (error) {
      console.error('Failed to search movies:', error);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  const randomizeMovies = async () => {
    setLoading(true);
    try {
      const randomPage = Math.floor(Math.random() * 500) + 1;
      let url = `https://api.themoviedb.org/3/movie/popular?api_key=${MOVIE_API_KEY}&language=en-US&page=${randomPage}`;
      
      if (selectedGenre) {
        url = `https://api.themoviedb.org/3/discover/movie?api_key=${MOVIE_API_KEY}&language=en-US&with_genres=${selectedGenre}&page=${randomPage}`;
      }
      
      const res = await fetch(url);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const shuffled = [...data.results].sort(() => Math.random() - 0.5).slice(0, 10);
        setMovies(shuffled);
      }
    } catch (error) {
      console.error('Failed to randomize movies:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = async (movie) => {
    try {
      // Fetch additional movie details
      const [trailerRes, creditsRes] = await Promise.all([
        fetch(`https://api.themoviedb.org/3/movie/${movie.id}/videos?api_key=${MOVIE_API_KEY}&language=en-US`),
        fetch(`https://api.themoviedb.org/3/movie/${movie.id}/credits?api_key=${MOVIE_API_KEY}`)
      ]);
      
      const trailerData = await trailerRes.json();
      const creditsData = await creditsRes.json();
      
      const trailer = trailerData.results?.find(v => v.site === 'YouTube' && v.type === 'Trailer');
      const cast = creditsData.cast?.slice(0, 5) || [];
      const director = creditsData.crew?.find(person => person.job === 'Director');
      
      setModalData({
        ...movie,
        trailer: trailer?.key || null,
        cast: cast.map(actor => actor.name),
        director: director?.name || 'Not available'
      });
      setIsModalOpen(true);
    } catch (error) {
      setModalData(movie);
      setIsModalOpen(true);
    }
  };

  const handleGenreClick = (genreId) => {
    setSelectedGenre(genreId);
    setSearchQuery('');
    setSelectedFilter('all');
  };

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
    setSelectedGenre('');
    setSearchQuery('');
  };

  return (
    <div className="movie-explorer">
      <header>
        <h1>🎬 Movie Explorer</h1>
        <p className="subtitle">Discover amazing movies and explore endless entertainment</p>
      </header>

      <main>
        <section className="movies-section">
          <h2>Explore Movies</h2>
          
          <div className="search-filter-container">
            <input
              type="search"
              placeholder="Search movies by title or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <select 
              value={selectedFilter} 
              onChange={(e) => handleFilterChange(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Movies</option>
              <option value="popular">Popular</option>
              <option value="top_rated">Top Rated</option>
              <option value="upcoming">Upcoming</option>
              <option value="now_playing">Now Playing</option>
            </select>
          </div>

          <div className="movie-categories">
            <button 
              className={!selectedGenre ? 'active' : ''}
              onClick={() => handleGenreClick('')}
            >
              All
            </button>
            {genres.map(genre => (
              <button
                key={genre.id}
                className={selectedGenre === genre.id.toString() ? 'active' : ''}
                onClick={() => handleGenreClick(genre.id.toString())}
              >
                {genre.name}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="loader">Loading movies...</div>
          ) : (
            <div className="movies-container">
              {movies.length === 0 ? (
                <p className="no-results">No movies found.</p>
              ) : (
                movies.map(movie => (
                  <div
                    key={movie.id}
                    className="movie-card"
                    onClick={() => openModal(movie)}
                  >
                    {movie.poster_path ? (
                      <img 
                        src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                        alt={`Poster of ${movie.title}`}
                        loading="lazy"
                      />
                    ) : (
                      <div className="no-image">No Image</div>
                    )}
                    <h3>{movie.title}</h3>
                    <p>{movie.overview || "No description available."}</p>
                  </div>
                ))
              )}
            </div>
          )}

          <div className="randomize-container">
            <button onClick={randomizeMovies} className="randomize-button">
              Randomize Movies
            </button>
          </div>
        </section>
      </main>

      {isModalOpen && modalData && (
        <Modal
          data={modalData}
          onClose={() => setIsModalOpen(false)}
          type="movie"
        />
      )}
    </div>
  );
};

export default MovieExplorer;
