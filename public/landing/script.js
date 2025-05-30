let MOVIE_API_KEY = "ed103f0b096e2342ceea2741dd22538b";
let GOOGLE_CLIENT_ID = "481648255761-bl78pb4mc68apus76vg3hrp63sh28d2d.apps.googleusercontent.com";

// Fetch configuration from server
async function loadConfig() {
  try {
    const response = await fetch('/api/config');
    const config = await response.json();
    MOVIE_API_KEY = config.MOVIE_API_KEY;
    GOOGLE_CLIENT_ID = config.GOOGLE_CLIENT_ID;
  } catch (error) {
    console.error('Failed to load configuration:', error);
  }
}

const moviesLoader = document.getElementById('movies-loader');
const moviesContainer = document.getElementById('movies-container');
const movieSearch = document.getElementById('movie-search');
const movieFilter = document.getElementById('movie-filter');
const movieCategories = document.getElementById('movie-categories');
const randomizeButton = document.getElementById('randomize-button');

const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalMeta = document.getElementById('modal-meta');
const modalCover = document.getElementById('modal-cover');
const modalDescription = document.getElementById('modal-description');
const modalCloseBtn = document.getElementById('modal-close-btn');
const trailerIframe = document.getElementById('trailer-iframe');
const modalTrailer = document.getElementById('modal-trailer');

let focusedElementBeforeModal;
let moviesMap = {};
let currentMovies = [];
let currentGenreId = null;
let currentSearchQuery = '';

// Utility shuffle function to randomize array elements
function shuffleArray(array) {
  const copy = array.slice();
  for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Fetch genres and populate categories row
async function fetchGenres() {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${MOVIE_API_KEY}&language=en-US`);
    const data = await res.json();
    if(data.genres){
      movieCategories.innerHTML = '';
      // Add "All" button first
      const allBtn = document.createElement('button');
      allBtn.textContent = 'All';
      allBtn.setAttribute('data-genre-id', '');
      allBtn.setAttribute('role', 'listitem');
      allBtn.classList.add('active');
      allBtn.addEventListener('click', onGenreClick);
      movieCategories.appendChild(allBtn);

      data.genres.forEach(genre => {
        const btn = document.createElement('button');
        btn.textContent = genre.name;
        btn.setAttribute('data-genre-id', genre.id);
        btn.setAttribute('role', 'listitem');
        btn.addEventListener('click', onGenreClick);
        movieCategories.appendChild(btn);
      });
    }
  } catch (e) {
    movieCategories.innerHTML = '<p style="color:red;text-align:center;">Failed to load categories.</p>';
  }
}

// Render movies in grid container
function renderMovies(movies) {
  if (!movies || movies.length === 0) {
    moviesContainer.innerHTML = '<p style="grid-column: 1/-1; text-align:center; font-weight:bold; color:#777;">No movies found.</p>';
    currentMovies = [];
    return {};
  }
  const map = {};
  const html = movies.map(movie => {
    map[movie.id] = movie;
    const title = movie.title;
    const desc = movie.overview || "No description available.";
    const img = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '';
    // Removed user rating and favorites
    const watchTime = movie.runtime ? `${movie.runtime} min` : 'Runtime N/A';
    const tmdbRating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';

    return `
      <div class="movie-card" tabindex="0" role="button" aria-pressed="false" data-movie-id="${movie.id}" aria-label="View details for ${title}">
        ${img ? `<img src="${img}" alt="Poster of ${title}" loading="lazy" />` : '<div class="no-image">No Image</div>'}
        <h3 title="${title}">${title}</h3>
        <p>${desc}</p>
        <div class="reading-time">🎬 ${watchTime} • ⭐ ${tmdbRating}/10</div>
      </div>
    `;
  }).join('');
  moviesContainer.innerHTML = html;
  moviesContainer.style.display = 'grid';
  currentMovies = movies;
  return map;
}

// Fetch popular movies (default)
async function fetchPopularMovies() {
  moviesLoader.style.display = 'block';
  moviesContainer.style.display = 'none';
  clearCategoryActive();
  currentGenreId = null;
  currentSearchQuery = '';
  try {
    const res = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${MOVIE_API_KEY}&language=en-US`);
    const data = await res.json();
    if (data.results) {
      moviesMap = renderMovies(data.results);
    } else {
      moviesContainer.innerHTML = '<p style="color:#777; text-align:center;">No popular movies found.</p>';
      currentMovies = [];
    }
  } catch {
    moviesContainer.innerHTML = '<p style="color:red; text-align:center;">Failed to load popular movies.</p>';
    currentMovies = [];
  } finally {
    moviesLoader.style.display = 'none';
  }
}

// Fetch movies by genre
async function fetchMoviesByGenre(genreId) {
  moviesLoader.style.display = 'block';
  moviesContainer.style.display = 'none';
  clearCategoryActive();
  currentGenreId = genreId || null;
  currentSearchQuery = '';
  // Set active button for selected genre
  const btns = movieCategories.querySelectorAll('button');
  btns.forEach(btn => {
    if (btn.getAttribute('data-genre-id') === genreId) {
      btn.classList.add('active');
    }
  });
  try {
    const res = await fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${MOVIE_API_KEY}&language=en-US&with_genres=${genreId}&page=1`);
    const data = await res.json();
    if(data.results) {
      moviesMap = renderMovies(data.results);
    } else {
      moviesContainer.innerHTML = '<p style="color:#777; text-align:center;">No movies found in this category.</p>';
      currentMovies = [];
    }
  } catch {
    moviesContainer.innerHTML = '<p style="color:red; text-align:center;">Failed to load category movies.</p>';
    currentMovies = [];
  } finally {
    moviesLoader.style.display = 'none';
  }
}

// Handle genre button click
function onGenreClick(e) {
  const genreId = e.currentTarget.getAttribute('data-genre-id');
  fetchMoviesByGenre(genreId);
}

// Clear category active states
function clearCategoryActive() {
  const btns = movieCategories.querySelectorAll('button');
  btns.forEach(btn => btn.classList.remove('active'));
}

// Search movies by query
async function searchMovies(query) {
  if(!query || query.trim() === '') {
    fetchPopularMovies();
    return;
  }
  moviesLoader.style.display = 'block';
  moviesContainer.style.display = 'none';
  clearCategoryActive();
  currentGenreId = null;
  currentSearchQuery = query;
  try {
    const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${MOVIE_API_KEY}&language=en-US&query=${encodeURIComponent(query)}&page=1&include_adult=false`);
    const data = await res.json();
    if(data.results) {
      moviesMap = renderMovies(data.results);
    } else {
      moviesContainer.innerHTML = '<p style="color:#777; text-align:center;">No movies found matching your search.</p>';
      currentMovies = [];
    }
  } catch {
    moviesContainer.innerHTML = '<p style="color:red; text-align:center;">Search failed. Please try again later.</p>';
    currentMovies = [];
  } finally {
    moviesLoader.style.display = 'none';
  }
}

// Randomize movies
async function randomizeMovies() {
  moviesLoader.style.display = 'block';
  moviesContainer.style.display = 'none';
  try {
    let url;
    if (currentSearchQuery) {
      url = `https://api.themoviedb.org/3/search/movie?api_key=${MOVIE_API_KEY}&language=en-US&query=${encodeURIComponent(currentSearchQuery)}&page=1&include_adult=false`;
    } else if (currentGenreId) {
      const randomPage = Math.floor(Math.random() * 500) + 1;
      url = `https://api.themoviedb.org/3/discover/movie?api_key=${MOVIE_API_KEY}&language=en-US&with_genres=${currentGenreId}&page=${randomPage}`;
    } else {
      const randomPage = Math.floor(Math.random() * 500) + 1;
      url = `https://api.themoviedb.org/3/movie/popular?api_key=${MOVIE_API_KEY}&language=en-US&page=${randomPage}`;
    }
    const res = await fetch(url);
    const data = await res.json();
    if(data.results && data.results.length > 0) {
      const shuffled = shuffleArray(data.results).slice(0, 10);
      moviesMap = renderMovies(shuffled);
    } else {
      moviesContainer.innerHTML = '<p style="color:#777; text-align:center;">No movies found to randomize.</p>';
      currentMovies = [];
    }
  } catch {
    moviesContainer.innerHTML = '<p style="color:red; text-align:center;">Failed to load movies for randomization.</p>';
    currentMovies = [];
  } finally {
    moviesLoader.style.display = 'none';
  }
}

// Show movie details modal
async function showMovieDetails(id) {
  const info = moviesMap[id];
  if (!info) return;

  try {
    // Fetch trailer
    const trailerRes = await fetch(`https://api.themoviedb.org/3/movie/${id}/videos?api_key=${MOVIE_API_KEY}&language=en-US`);
    const trailerData = await trailerRes.json();
    const trailer = trailerData.results.find(v => v.site === 'YouTube' && v.type === 'Trailer');
    const trailerKey = trailer ? trailer.key : null;

    // Fetch cast and crew
    const creditsRes = await fetch(`https://api.themoviedb.org/3/movie/${id}/credits?api_key=${MOVIE_API_KEY}`);
    const creditsData = await creditsRes.json();
    const cast = creditsData.cast ? creditsData.cast.slice(0, 5) : [];
    const director = creditsData.crew ? creditsData.crew.find(person => person.job === 'Director') : null;

    modalTitle.textContent = info.title || "Untitled";
    modalCover.src = info.poster_path ? `https://image.tmdb.org/t/p/w500${info.poster_path}` : '';
    modalCover.alt = info.title ? `Poster of ${info.title}` : "Movie poster";
    modalDescription.textContent = info.overview || "No description available.";

    const releaseDate = info.release_date || 'Unknown';
    const rating = info.vote_average !== undefined ? info.vote_average.toFixed(1) + '/10' : 'N/A';
    const runtime = info.runtime ? `${info.runtime} minutes` : 'N/A';
    const castList = cast.length > 0 ? cast.map(actor => actor.name).join(', ') : 'Not available';
    const directorName = director ? director.name : 'Not available';

    modalMeta.innerHTML = `
      <div class="meta-item">
        <span class="meta-label">Release Date:</span>
        <span class="meta-value">${releaseDate}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Rating:</span>
        <span class="meta-value">${rating}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Director:</span>
        <span class="meta-value">${directorName}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Main Cast:</span>
        <span class="meta-value">${castList}</span>
      </div>
    `;

    if (trailerKey) {
      trailerIframe.src = `https://www.youtube.com/embed/${trailerKey}?autoplay=1`;
      modalTrailer.style.display = 'block';
    } else {
      modalTrailer.style.display = 'none';
      trailerIframe.src = '';
    }       

    modalOverlay.style.display = 'flex';
    focusedElementBeforeModal = document.activeElement;
    modalCloseBtn.focus();
    document.body.style.overflow = 'hidden';
  } catch (err) {
    modalTitle.textContent = info.title || "Untitled";
    modalCover.src = info.poster_path ? `https://image.tmdb.org/t/p/w500${info.poster_path}` : '';
    modalCover.alt = info.title ? `Poster of ${info.title}` : "Movie poster";
    modalDescription.textContent = info.overview || "No description available.";

    const releaseDate = info.release_date || 'Unknown';
    const rating = info.vote_average !== undefined ? info.vote_average.toFixed(1) + '/10' : 'N/A';

    modalMeta.innerHTML = `
      <div class="meta-item">
        <span class="meta-label">Release Date:</span>
        <span class="meta-value">${releaseDate}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Rating:</span>
        <span class="meta-value">${rating}</span>
      </div>
    `;
    modalTrailer.style.display = 'none';
    trailerIframe.src = '';

    modalOverlay.style.display = 'flex';
    focusedElementBeforeModal = document.activeElement;
    modalCloseBtn.focus();
    document.body.style.overflow = 'hidden';
  }
}

// Close modal
function closeModal() {
  modalOverlay.style.display = 'none';
  document.body.style.overflow = '';
  modalTitle.textContent = '';
  modalCover.src = '';
  modalCover.alt = '';
  modalDescription.textContent = '';
  modalMeta.textContent = '';
  trailerIframe.src = '';
  modalTrailer.style.display = 'none';
  if (focusedElementBeforeModal) focusedElementBeforeModal.focus();
}

// Event listeners
modalOverlay.addEventListener('click', e => {
  if (e.target === modalOverlay) closeModal();
});
modalCloseBtn.addEventListener('click', closeModal);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && modalOverlay.style.display === 'flex') closeModal();
});

moviesContainer.addEventListener('click', e => {
  const card = e.target.closest('.movie-card');
  if (card && card.hasAttribute('data-movie-id')) {
    showMovieDetails(card.getAttribute('data-movie-id'));
  }
});

moviesContainer.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('movie-card')) {
    e.preventDefault();
    showMovieDetails(e.target.getAttribute('data-movie-id'));
  }
});

let debounceTimeout;
movieSearch.addEventListener('input', e => {
  const query = e.target.value.trim();
  if(debounceTimeout) clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    if(query.length >= 3) {
      searchMovies(query);
    } else if(query.length === 0) {
      fetchPopularMovies();
    }
  }, 450);
});

randomizeButton.addEventListener('click', randomizeMovies);

// Filter change event listener
movieFilter.addEventListener('change', e => {
  const filterValue = e.target.value;
  clearCategoryActive();
  currentGenreId = null;
  currentSearchQuery = '';
  movieSearch.value = '';

  if (filterValue === 'all') {
    fetchPopularMovies();
  } else {
    fetchMoviesByFilter(filterValue);
  }
});

// Fetch movies by filter
async function fetchMoviesByFilter(filter) {
  moviesLoader.style.display = 'block';
  moviesContainer.style.display = 'none';
  try {
    let url = `https://api.themoviedb.org/3/movie/${filter}?api_key=${MOVIE_API_KEY}&language=en-US&page=1`;
    const res = await fetch(url);
    const data = await res.json();
    if(data.results) {
      moviesMap = renderMovies(data.results);
    } else {
      moviesContainer.innerHTML = '<p style="color:#777; text-align:center;">No movies found for this filter.</p>';
      currentMovies = [];
    }
  } catch {
    moviesContainer.innerHTML = '<p style="color:red; text-align:center;">Failed to load filtered movies.</p>';
    currentMovies = [];
  } finally {
    moviesLoader.style.display = 'none';
  }
}

// Google Auth functions
function initGoogleAuth() {
  if (typeof google !== 'undefined' && google.accounts && GOOGLE_CLIENT_ID) {
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
      ux_mode: 'popup'
    });

    // Check if user is already signed in from localStorage
    const userData = localStorage.getItem('googleUserData');
    if (userData) {
      const userInfo = JSON.parse(userData);
      document.getElementById('user-name').textContent = userInfo.name;
      document.getElementById('google-signin').style.display = 'none';
      document.getElementById('user-info').style.display = 'flex';
    }
  } else {
    console.error('Google Identity Services not loaded');
  }
}

async function handleCredentialResponse(response) {
  try {
    // Send credential to backend for verification
    const backendResponse = await fetch('/auth/google/callback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ credential: response.credential })
    });

    if (backendResponse.ok) {
      const data = await backendResponse.json();
      const userInfo = data.user;

      document.getElementById('user-name').textContent = userInfo.name;
      document.getElementById('google-signin').style.display = 'none';
      document.getElementById('user-info').style.display = 'flex';

      // Store user data and token in localStorage
      localStorage.setItem('googleUserData', JSON.stringify(userInfo));
      localStorage.setItem('authToken', data.token);
    } else {
      console.error('Backend authentication failed');
    }
  } catch (error) {
    console.error('Error processing Google sign-in:', error);
    // Fallback to client-side processing
    const userInfo = JSON.parse(atob(response.credential.split('.')[1]));
    document.getElementById('user-name').textContent = userInfo.name;
    document.getElementById('google-signin').style.display = 'none';
    document.getElementById('user-info').style.display = 'flex';

    localStorage.setItem('googleUserData', JSON.stringify({
      name: userInfo.name,
      email: userInfo.email,
      picture: userInfo.picture
    }));
  }
}

function checkAuthStatus() {
  const userData = localStorage.getItem('googleUserData');
  return userData !== null;
}

document.getElementById('google-signin').addEventListener('click', () => {
  if (typeof google !== 'undefined' && google.accounts) {
    google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        console.log('Google Sign-In was not displayed or was skipped');
      }
    });
  } else {
    console.error('Google Identity Services not available');
  }
});

document.getElementById('logout-btn').addEventListener('click', () => {
  if (typeof google !== 'undefined' && google.accounts) {
    google.accounts.id.disableAutoSelect();
  }
  document.getElementById('google-signin').style.display = 'block';
  document.getElementById('user-info').style.display = 'none';
  document.getElementById('user-name').textContent = '';
  localStorage.removeItem('googleUserData');
});

// Dark Mode functionality
function initDarkMode() {
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  const body = document.body;

  // Check saved theme preference
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    body.classList.add('dark-mode');
    darkModeToggle.classList.add('active');
  }

  // Toggle dark mode
  darkModeToggle.addEventListener('click', function() {
    body.classList.toggle('dark-mode');
    darkModeToggle.classList.toggle('active');

    // Save preference
    const isDarkMode = body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  });
}

// Removed favorites and ratings functionality

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
  await loadConfig();
  const toggleAdvanced = document.getElementById('toggle-advanced');
  const advancedFilters = document.getElementById('advanced-filters');
  const applyFilters = document.getElementById('apply-filters');

  if (toggleAdvanced && advancedFilters) {
    toggleAdvanced.addEventListener('click', () => {
      advancedFilters.style.display = advancedFilters.style.display === 'none' ? 'block' : 'none';
    });
  }

  if (applyFilters) {
    applyFilters.addEventListener('click', applyAdvancedFilters);
  }

  initDarkMode();
  
  // Initialize movies and genres
  fetchGenres();
  fetchPopularMovies();
  
  // Initialize Google Auth after a small delay
  setTimeout(() => {
    initGoogleAuth();
  }, 1000);
});

// Removed favorites and rating functionality

// Advanced filters
function applyAdvancedFilters() {
  const year = document.getElementById('year-filter').value;
  const rating = document.getElementById('rating-filter').value;
  const genre = document.getElementById('genre-filter-advanced').value;

  let url = `https://api.themoviedb.org/3/discover/movie?api_key=${MOVIE_API_KEY}&language=en-US`;

  if (year) url += `&year=${year}`;
  if (rating) url += `&vote_average.gte=${rating}`;
  if (genre) url += `&with_genres=${genre}`;

  fetchMoviesWithFilters(url);
}

async function fetchMoviesWithFilters(url) {
  showMoviesLoader();
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.results) {
      moviesMap = renderMovies(data.results);
    }
  } catch (err) {
    moviesContainer.innerHTML = '<p style="color:red; text-align:center;">Error applying filters.</p>';
  } finally {
    hideMoviesLoader();
  }
}

function showMoviesLoader() {
  moviesLoader.style.display = 'block';
  moviesContainer.style.display = 'none';
}

function hideMoviesLoader() {
  moviesLoader.style.display = 'none';
  moviesContainer.style.display = 'grid';
}
// Hamburger menu functionality
function initMobileMenu() {
  const hamburgerMenu = document.getElementById('hamburger-menu');
  const mobileNav = document.getElementById('mobile-nav');

  if (hamburgerMenu && mobileNav) {
    hamburgerMenu.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!hamburgerMenu.contains(e.target) && !mobileNav.contains(e.target)) {
        mobileNav.classList.remove('open');
      }
    });

    // Sync auth state between desktop and mobile
    const mobileGoogleSignin = document.getElementById('mobile-google-signin');
    const mobileUserInfo = document.getElementById('mobile-user-info');
    const mobileUserName = document.getElementById('mobile-user-name');
    const mobileLogoutBtn = document.getElementById('mobile-logout-btn');

    if (mobileGoogleSignin) {
      mobileGoogleSignin.addEventListener('click', () => {
        document.getElementById('google-signin').click();
      });
    }

    if (mobileLogoutBtn) {
      mobileLogoutBtn.addEventListener('click', () => {
        document.getElementById('logout-btn').click();
      });
    }

    // Sync user state
    function syncMobileAuth() {
      const desktopSignin = document.getElementById('google-signin');
      const desktopUserInfo = document.getElementById('user-info');
      const desktopUserName = document.getElementById('user-name');

      if (mobileGoogleSignin && mobileUserInfo) {
        mobileGoogleSignin.style.display = desktopSignin.style.display;
        mobileUserInfo.style.display = desktopUserInfo.style.display;
        if (mobileUserName) {
          mobileUserName.textContent = desktopUserName.textContent;
        }
      }
    }

    // Observe changes to sync auth state
    const observer = new MutationObserver(syncMobileAuth);
    const desktopAuth = document.querySelector('.auth-section');
    if (desktopAuth) {
      observer.observe(desktopAuth, { childList: true, subtree: true, attributes: true });
    }
  }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', async function() {
  await loadConfig();

  initDarkMode();
  initMobileMenu();

  // Load some default movies on page load
  setTimeout(() => {
    fetchMovies({ category: 'popular' });
  }, 1000);

  // Initialize Google Auth with retry
  let retryCount = 0;
  const maxRetries = 5;

  function tryInitGoogleAuth() {
    if (typeof google !== 'undefined' && google.accounts) {
      initGoogleAuth();
    } else if (retryCount < maxRetries) {
      retryCount++;
      setTimeout(tryInitGoogleAuth, 1000);
    } else {
      console.log('Google Identity Services could not be loaded after multiple attempts');
    }
  }

  setTimeout(tryInitGoogleAuth, 1000);
  console.log('Movie Explorer script loaded');
});