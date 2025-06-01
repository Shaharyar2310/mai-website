fetch('/api/config')
  .then(res => res.json())
  .then(config => {
    const GOOGLE_BOOKS_API_KEY = config.GOOGLE_BOOKS_API_KEY;
    const GOOGLE_CLIENT_ID = config.GOOGLE_CLIENT_ID;

    // Use the keys here, e.g.:
    fetchBooks(GOOGLE_BOOKS_API_KEY);
    initGoogleSignIn(GOOGLE_CLIENT_ID);
  })
  .catch(err => {
    console.error("Failed to load API keys", err);
  });


// Fetch configuration from server
async function loadConfig() {
  try {
    const response = await fetch('/api/config');
    const config = await response.json();
    GOOGLE_BOOKS_API_KEY = config.GOOGLE_BOOKS_API_KEY;
    GOOGLE_CLIENT_ID = config.GOOGLE_CLIENT_ID;
  } catch (error) {
    console.error('Failed to load configuration:', error);
  }
}

const categoriesContainer = document.getElementById('book-categories');
const booksContainer = document.getElementById('books-container');
const searchInput = document.getElementById('book-search');
const bookFilter = document.getElementById('book-filter');
const loader = document.getElementById('loader');

// Modal elements
const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalCover = document.getElementById('modal-cover');
const modalDescription = document.getElementById('modal-description');
const modalPreviewLink = document.getElementById('modal-preview-link');
const modalCloseBtn = document.getElementById('modal-close-btn');

// Maps to store book info keyed by id for lookup
let booksMap = {};

function showLoader() {
  loader.style.display = 'block';
  booksContainer.style.display = 'none';
  booksContainer.setAttribute('aria-busy', 'true');
}

function hideLoader() {
  loader.style.display = 'none';
  booksContainer.style.display = 'grid';
  booksContainer.setAttribute('aria-busy', 'false');
}

// Render books in given container
function renderBooks(items, container) {
  if (!items || items.length === 0) {
    container.innerHTML = '<p style="grid-column: 1/-1; text-align:center; font-weight:bold; color:#777;">No books found.</p>';
    return;
  }

  const html = items.map(book => {
    const info = book.volumeInfo;
    booksMap[book.id] = info;
    const title = info.title || "Untitled";
    const desc = info.description || "No description available.";
    const img = info.imageLinks ? info.imageLinks.smallThumbnail || info.imageLinks.thumbnail : '';
    const readingTime = estimateReadingTime(info.pageCount);

    return `
      <div class="card" tabindex="0" role="button" aria-pressed="false" data-book-id="${book.id}" aria-label="View details for ${title}">
        ${img ? `<img src="${img}" alt="Cover image of ${title}" loading="lazy" />` : '<div style="height:320px;background:#ddd;display:flex;align-items:center;justify-content:center;color:#aaa;font-size:14px;">No Image</div>'}
        <h3 title="${title}">${title}</h3>
        <p>${desc}</p>
        <div class="reading-time">📖 ${readingTime}</div>
      </div>
    `;
  }).join('');
  container.innerHTML = html;
}

// Fetch books from Google Books API by category or query
async function fetchBooks({ category = null, query = null } = {}) {
  let url = 'https://www.googleapis.com/books/v1/volumes?maxResults=20&key=' + GOOGLE_BOOKS_API_KEY + '&langRestrict=en'; // Restrict to English
  if (category) {
    url += `&q=subject:${encodeURIComponent(category)}`;
  } else if (query) {
    url += `&q=${encodeURIComponent(query)}`;
  } else {
    // Randomize the query to fetch different books each time
    const randomSubjects = ['fiction', 'mystery', 'thriller', 'science', 'history', 'biography', 'travel'];
    const randomSubject = randomSubjects[Math.floor(Math.random() * randomSubjects.length)];
    url += `&q=subject:${randomSubject}`;
  }

  showLoader();
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.items) {
      renderBooks(data.items, booksContainer);
    } else {
      renderBooks([], booksContainer);
    }
  } catch (err) {
    booksContainer.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color:red;">Error fetching books. Please try again later.</p>`;
  } finally {
    hideLoader();
  }
}

// Show book details in modal
function showBookDetails(bookId) {
  let info = booksMap[bookId];
  if (!info) return;

  modalTitle.textContent = info.title || "Untitled";
  // Use higher quality image for modal
  const coverImage = info.imageLinks ? 
    (info.imageLinks.large || info.imageLinks.medium || info.imageLinks.small || info.imageLinks.thumbnail) : '';
  modalCover.src = coverImage;
  modalCover.alt = info.title ? `Cover image of ${info.title}` : "Book cover image";
  modalDescription.textContent = info.description || "No description available.";

  // Enhanced book metadata
  const authors = info.authors ? info.authors.join(', ') : 'Unknown Author';
  const publishedDate = info.publishedDate || 'Unknown';
  const pageCount = info.pageCount || 'N/A';
  const categories = info.categories ? info.categories.join(', ') : 'N/A';
  const rating = info.averageRating ? `${info.averageRating}/5 (${info.ratingsCount || 0} reviews)` : 'No rating';
  const language = info.language || 'N/A';
  const publisher = info.publisher || 'Unknown Publisher';

  // Create meta information section
  const metaDiv = document.createElement('div');
  metaDiv.className = 'meta';
  metaDiv.innerHTML = `
    <div class="meta-item">
      <span class="meta-label">Author(s):</span>
      <span class="meta-value">${authors}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Published:</span>
      <span class="meta-value">${publishedDate}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Publisher:</span>
      <span class="meta-value">${publisher}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Pages:</span>
      <span class="meta-value">${pageCount} pages</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Categories:</span>
      <span class="meta-value">${categories}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Rating:</span>
      <span class="meta-value">${rating}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Language:</span>
      <span class="meta-value">${language}</span>
    </div>
  `;

  // Insert meta div after title and before description
  const modalContent = document.getElementById('modal-content');
  const existingMeta = modalContent.querySelector('.meta');
  if (existingMeta) {
    existingMeta.remove();
  }
  modalTitle.parentNode.insertBefore(metaDiv, modalDescription);

  // Set link for preview if available
  if (info.previewLink) {
    modalPreviewLink.innerHTML = `<a href="${info.previewLink}" target="_blank" rel="noopener noreferrer" style="color:#667eea; font-weight:600; background: #f0f2ff; padding: 8px 16px; border-radius: 20px; text-decoration: none; display: inline-block; margin-top: 10px;">📖 Read Preview</a>`;
  } else {
    modalPreviewLink.innerHTML = '<span style="color:#999;">No preview available</span>';
  }

  modalOverlay.style.display = 'flex';
}

// Close modal
function closeModal() {
  modalOverlay.style.display = 'none';
  modalTitle.textContent = '';
  modalCover.src = '';
  modalCover.alt = '';
  modalDescription.textContent = '';
  modalPreviewLink.innerHTML = '';
}

// Modal event listeners
modalCloseBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => {
  if (e.target === modalOverlay) closeModal();
});

// Event delegation for cards click - for books
function setupCardClickListener(container) {
  container.addEventListener('click', e => {
    const card = e.target.closest('.card');
    if (card && card.hasAttribute('data-book-id')) {
      showBookDetails(card.getAttribute('data-book-id'));
    }
  });
}

// Setup listeners on page sections that hold cards
setupCardClickListener(booksContainer);

// Category buttons click and search input debounce
categoriesContainer.addEventListener('click', e => {
  if (e.target.tagName === 'BUTTON') {
    clearActiveCategory();
    e.target.classList.add('active');
    searchInput.value = '';
    fetchBooks({ category: e.target.getAttribute('data-category') });
  }
});

let debounceTimeout;
searchInput.addEventListener('input', e => {
  const query = e.target.value.trim();
  clearActiveCategory();

  if (debounceTimeout) clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    if (query.length >= 3) {
      fetchBooks({ query });
    } else if (query.length === 0) {
      booksContainer.innerHTML = '';
    }
  }, 400);
});

// Clear active button highlight helper
function clearActiveCategory() {
  const buttons = categoriesContainer.querySelectorAll('button');
  buttons.forEach(btn => btn.classList.remove('active'));
}

// Filter change event listener
bookFilter.addEventListener('change', e => {
  const filterValue = e.target.value;
  clearActiveCategory();
  searchInput.value = '';

  if (filterValue === 'all') {
    fetchBooks();
  } else {
    fetchBooksByFilter(filterValue);
  }
});

// Fetch books by filter
async function fetchBooksByFilter(filter) {
  let url = 'https://www.googleapis.com/books/v1/volumes?maxResults=20&key=' + GOOGLE_BOOKS_API_KEY + '&langRestrict=en';

  switch(filter) {
    case 'bestseller':
      url += '&q=bestseller';
      break;
    case 'newest':
      url += '&q=newest&orderBy=newest';
      break;
    case 'rating':
      url += '&q=subject:fiction&orderBy=relevance';
      break;
    case 'free':
      url += '&q=subject:fiction&filter=free-ebooks';
      break;
    default:
      url += '&q=bestseller';
  }

  showLoader();
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.items) {
      renderBooks(data.items, booksContainer);
    } else {
      renderBooks([], booksContainer);
    }
  } catch (err) {
    booksContainer.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color:red;">Error fetching books. Please try again later.</p>`;
  } finally {
    hideLoader();
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


// Reading time estimation (words per minute)
const AVERAGE_WPM = 250;

function estimateReadingTime(pageCount) {
  if (!pageCount) return 'Unknown';
  const wordsPerPage = 250;
  const totalWords = pageCount * wordsPerPage;
  const minutes = Math.round(totalWords / AVERAGE_WPM);

  if (minutes < 60) return `${minutes} min read`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m read`;
}

// Load random books function
function loadRandomBooks() {
  const randomTopics = ['fiction', 'mystery', 'thriller', 'science', 'history', 'biography', 'travel', 'adventure', 'fantasy', 'romance'];
  const randomTopic = randomTopics[Math.floor(Math.random() * randomTopics.length)];
  fetchBooks({ category: randomTopic });
}

// Initialize the app when DOM is loaded
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
  loadRandomBooks();

  // Initialize Google Auth after a small delay
  setTimeout(() => {
    initGoogleAuth();
  }, 1000);
});


// Advanced filters for books
function applyAdvancedFilters() {
  const year = document.getElementById('year-filter').value;
  const language = document.getElementById('language-filter').value;
  const minPages = document.getElementById('pages-filter').value;

  // This would require a more complex query to Google Books API
  // For now, we'll just search with year filter
  let query = 'bestseller';
  if (year) query += ` publishedDate:${year}`;

  fetchBooks({ query });
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

  // Load some default books on page load
  setTimeout(() => {
    searchBooks({ category: 'bestseller' });
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