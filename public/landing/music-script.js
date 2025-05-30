
let GOOGLE_CLIENT_ID = "481648255761-bl78pb4mc68apus76vg3hrp63sh28d2d.apps.googleusercontent.com";

// Fetch configuration from server
async function loadConfig() {
  try {
    const response = await fetch('/api/config');
    const config = await response.json();
    GOOGLE_CLIENT_ID = config.GOOGLE_CLIENT_ID;
  } catch (error) {
    console.error('Failed to load configuration:', error);
  }
}

const categoriesContainer = document.getElementById('music-categories');
const musicContainer = document.getElementById('music-container');
const searchInput = document.getElementById('music-search');
const musicFilter = document.getElementById('music-filter');
const loader = document.getElementById('music-loader');

// Modal elements
const modalOverlay = document.getElementById('music-modal-overlay');
const modalTitle = document.getElementById('music-modal-title');
const modalCover = document.getElementById('music-modal-cover');
const modalInfo = document.getElementById('music-modal-info');
const modalCloseBtn = document.getElementById('music-modal-close-btn');
const playerContainer = document.getElementById('music-player-container');

// Maps to store music info
let musicMap = {};
let currentMusicResults = [];

// Utility shuffle function to randomize array elements
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function showLoader() {
  loader.style.display = 'block';
  musicContainer.style.display = 'none';
  musicContainer.setAttribute('aria-busy', 'true');
}

function hideLoader() {
  loader.style.display = 'none';
  musicContainer.style.display = 'grid';
  musicContainer.setAttribute('aria-busy', 'false');
}

// Render music items
function renderMusic(items, container) {
  if (!items || items.length === 0) {
    container.innerHTML = '<p style="grid-column: 1/-1; text-align:center; font-weight:bold; color:#777;">No music found.</p>';
    return;
  }

  const html = items.map(item => {
    const id = item.trackId;
    const name = item.trackName;
    const artist = item.artistName || 'Unknown Artist';
    const image = item.artworkUrl100 ? item.artworkUrl100.replace('100x100', '300x300') : '';
    const duration = formatDuration(item.trackTimeMillis || 0);
    const previewUrl = item.previewUrl;
    const album = item.collectionName || 'Unknown Album';

    musicMap[id] = item;

    return `
      <div class="card music-card" tabindex="0" role="button" aria-pressed="false" data-music-id="${id}" aria-label="View details for ${name}">
        ${image ? `<img src="${image}" alt="Cover image of ${name}" loading="lazy" />` : '<div style="height:320px;background:#ddd;display:flex;align-items:center;justify-content:center;color:#aaa;font-size:14px;">No Image</div>'}
        <h3 title="${name}">${name}</h3>
        <p class="artist-name">${artist}</p>
        <div class="music-info">
          <span class="duration">🎵 ${duration}</span>
          ${previewUrl ? '<span class="has-preview">▶️ Preview</span>' : ''}
        </div>
      </div>
    `;
  }).join('');
  container.innerHTML = html;
}

// Format duration from milliseconds
function formatDuration(ms) {
  if (!ms) return '0:00';
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Search music using iTunes API (CORS-friendly)
async function searchMusic({ query = '', genre = null } = {}) {
  let searchQuery = query;
  if (genre && !query) {
    searchQuery = genre;
  }
  if (!searchQuery) {
    searchQuery = 'popular music'; // Default search
  }

  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(searchQuery)}&media=music&entity=song&limit=20`;

  showLoader();
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch from iTunes API');
    }

    const data = await response.json();
    const items = data.results || [];
    currentMusicResults = items;
    renderMusic(items, musicContainer);
  } catch (error) {
    console.error('Error fetching music:', error);
    // Fallback to a different search term
    try {
      const fallbackUrl = `https://itunes.apple.com/search?term=top%20songs&media=music&entity=song&limit=20`;
      const fallbackResponse = await fetch(fallbackUrl);
      const fallbackData = await fallbackResponse.json();
      currentMusicResults = fallbackData.results || [];
      renderMusic(currentMusicResults, musicContainer);
    } catch (fallbackError) {
      musicContainer.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color:red;">Error fetching music. Please try again later.</p>`;
    }
  } finally {
    hideLoader();
  }
}

// Show music details in modal
function showMusicDetails(musicId) {
  const item = musicMap[musicId];
  if (!item) return;

  const title = item.trackName;
  const artist = item.artistName || 'Unknown Artist';
  const image = item.artworkUrl100 ? item.artworkUrl100.replace('100x100', '600x600') : '';

  const info = `
    <div class="meta">
      <div class="meta-item">
        <span class="meta-label">Artist:</span>
        <span class="meta-value">${artist}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Album:</span>
        <span class="meta-value">${item.collectionName || 'Unknown Album'}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Duration:</span>
        <span class="meta-value">${formatDuration(item.trackTimeMillis || 0)}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Genre:</span>
        <span class="meta-value">${item.primaryGenreName || 'N/A'}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Release Date:</span>
        <span class="meta-value">${item.releaseDate ? new Date(item.releaseDate).toLocaleDateString() : 'Unknown'}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Price:</span>
        <span class="meta-value">${item.trackPrice ? `$${item.trackPrice}` : 'N/A'}</span>
      </div>
    </div>
  `;

  modalTitle.textContent = title;
  modalCover.src = image;
  modalCover.alt = `Cover image of ${title}`;
  modalInfo.innerHTML = info;

  // Add audio player for preview
  if (item.previewUrl) {
    playerContainer.innerHTML = `
      <div class="music-player">
        <h4>Preview (30 seconds)</h4>
        <audio controls style="width: 100%; margin-top: 10px;">
          <source src="${item.previewUrl}" type="audio/mpeg">
          Your browser does not support the audio element.
        </audio>
        <p style="margin-top: 10px; font-size: 14px; color: #666;">
          <a href="${item.trackViewUrl}" target="_blank" rel="noopener">Listen on iTunes</a>
        </p>
      </div>
    `;
  } else {
    playerContainer.innerHTML = `
      <div class="music-player">
        <p style="color: #999;">No preview available</p>
        <p style="margin-top: 10px; font-size: 14px; color: #666;">
          <a href="${item.trackViewUrl}" target="_blank" rel="noopener">View on iTunes</a>
        </p>
      </div>
    `;
  }

  modalOverlay.style.display = 'flex';
}

// Close modal
function closeModal() {
  modalOverlay.style.display = 'none';
  modalTitle.textContent = '';
  modalCover.src = '';
  modalCover.alt = '';
  modalInfo.innerHTML = '';
  playerContainer.innerHTML = '';
}

// Event listeners
modalCloseBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => {
  if (e.target === modalOverlay) closeModal();
});

// Close modal on Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && modalOverlay.style.display === 'flex') {
    closeModal();
  }
});

// Setup card click listener
musicContainer.addEventListener('click', e => {
  const card = e.target.closest('.card');
  if (card && card.hasAttribute('data-music-id')) {
    showMusicDetails(card.getAttribute('data-music-id'));
  }
});

// Setup card keyboard listener
musicContainer.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('music-card')) {
    e.preventDefault();
    showMusicDetails(e.target.getAttribute('data-music-id'));
  }
});

// Category buttons
categoriesContainer.addEventListener('click', e => {
  if (e.target.tagName === 'BUTTON') {
    clearActiveCategory();
    e.target.classList.add('active');
    searchInput.value = '';
    searchMusic({ genre: e.target.getAttribute('data-genre') });
  }
});

// Search input
let debounceTimeout;
searchInput.addEventListener('input', e => {
  const query = e.target.value.trim();
  clearActiveCategory();

  if (debounceTimeout) clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    if (query.length >= 3) {
      searchMusic({ query });
    } else if (query.length === 0) {
      searchMusic({ query: 'popular music' });
    }
  }, 400);
});

function clearActiveCategory() {
  const buttons = categoriesContainer.querySelectorAll('button');
  buttons.forEach(btn => btn.classList.remove('active'));
}

// Randomize button functionality
const randomizeButton = document.getElementById('randomize-button');
if (randomizeButton) {
  randomizeButton.addEventListener('click', () => {
    // Array of random search terms to discover new music
    const randomSearchTerms = [
      'top hits 2024', 'indie rock', 'chill vibes', 'acoustic songs', 
      'dance music', 'alternative rock', 'soul music', 'R&B hits',
      'folk songs', 'blues music', 'reggae', 'country hits',
      'world music', 'jazz fusion', 'ambient music', 'new releases',
      'classic rock', 'pop anthems', 'electronic beats', 'live sessions'
    ];
    
    // Pick a random search term
    const randomTerm = randomSearchTerms[Math.floor(Math.random() * randomSearchTerms.length)];
    
    // Clear active category and search for new music
    clearActiveCategory();
    searchInput.value = '';
    searchMusic({ query: randomTerm });
  });
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

    const userData = localStorage.getItem('googleUserData');
    if (userData) {
      const userInfo = JSON.parse(userData);
      document.getElementById('user-name').textContent = userInfo.name;
      document.getElementById('google-signin').style.display = 'none';
      document.getElementById('user-info').style.display = 'flex';
    }
  } else {
    console.log('Google Identity Services not available yet, will retry...');
  }
}

async function handleCredentialResponse(response) {
  try {
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

      localStorage.setItem('googleUserData', JSON.stringify(userInfo));
      localStorage.setItem('authToken', data.token);
    }
  } catch (error) {
    console.error('Error processing Google sign-in:', error);
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

document.getElementById('google-signin').addEventListener('click', () => {
  if (typeof google !== 'undefined' && google.accounts) {
    google.accounts.id.prompt();
  } else {
    console.log('Google Identity Services not available');
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
  localStorage.removeItem('authToken');
});


// Dark Mode functionality
function initDarkMode() {
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  const body = document.body;

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    body.classList.add('dark-mode');
    if (darkModeToggle) darkModeToggle.classList.add('active');
  }

  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', function() {
      body.classList.toggle('dark-mode');
      darkModeToggle.classList.toggle('active');

      const isDarkMode = body.classList.contains('dark-mode');
      localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    });
  }
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

  // Load some default music
  setTimeout(() => {
    searchMusic({ query: 'top songs' });
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
});


