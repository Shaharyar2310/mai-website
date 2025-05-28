
import React, { useState, useEffect } from 'react';
import Modal from './Modal';

const GOOGLE_BOOKS_API_KEY = "AIzaSyCz1TT6JWVknpQ-9otI_FZBtymk071MVRQ";

const BookExplorer = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [modalData, setModalData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const categories = [
    { id: 'fiction', name: 'Fiction' },
    { id: 'non-fiction', name: 'Non-Fiction' },
    { id: 'mystery', name: 'Mystery' },
    { id: 'romance', name: 'Romance' },
    { id: 'science-fiction', name: 'Sci-Fi' },
    { id: 'biography', name: 'Biography' },
    { id: 'history', name: 'History' },
    { id: 'self-help', name: 'Self-Help' }
  ];

  const randomTopics = ['bestseller', 'fiction', 'science', 'history', 'technology', 'art', 'philosophy', 'psychology', 'adventure', 'mystery'];

  // Fetch random books on mount
  useEffect(() => {
    fetchRandomBooks();
  }, []);

  // Handle search and filters
  useEffect(() => {
    if (searchQuery.length >= 3) {
      searchBooks(searchQuery);
    } else if (searchQuery.length === 0) {
      if (selectedCategory) {
        fetchBooksByCategory(selectedCategory);
      } else {
        fetchBooksByFilter(selectedFilter);
      }
    }
  }, [searchQuery, selectedFilter, selectedCategory]);

  const fetchRandomBooks = async () => {
    setLoading(true);
    try {
      const randomTopic = randomTopics[Math.floor(Math.random() * randomTopics.length)];
      const randomStartIndex = Math.floor(Math.random() * 100);
      const res = await fetch(`https://www.googleapis.com/books/v1/volumes?maxResults=20&q=${randomTopic}&startIndex=${randomStartIndex}&key=${GOOGLE_BOOKS_API_KEY}&langRestrict=en`);
      const data = await res.json();
      setBooks(data.items || []);
    } catch (error) {
      console.error('Failed to fetch random books:', error);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`https://www.googleapis.com/books/v1/volumes?maxResults=20&q=bestseller&key=${GOOGLE_BOOKS_API_KEY}&langRestrict=en`);
      const data = await res.json();
      setBooks(data.items || []);
    } catch (error) {
      console.error('Failed to fetch books:', error);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBooksByCategory = async (category) => {
    setLoading(true);
    try {
      const res = await fetch(`https://www.googleapis.com/books/v1/volumes?maxResults=20&q=subject:${encodeURIComponent(category)}&key=${GOOGLE_BOOKS_API_KEY}&langRestrict=en`);
      const data = await res.json();
      setBooks(data.items || []);
    } catch (error) {
      console.error('Failed to fetch books by category:', error);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBooksByFilter = async (filter) => {
    setLoading(true);
    try {
      let url = `https://www.googleapis.com/books/v1/volumes?maxResults=20&key=${GOOGLE_BOOKS_API_KEY}&langRestrict=en`;
      
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

      const res = await fetch(url);
      const data = await res.json();
      setBooks(data.items || []);
    } catch (error) {
      console.error('Failed to fetch books by filter:', error);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const searchBooks = async (query) => {
    setLoading(true);
    try {
      const res = await fetch(`https://www.googleapis.com/books/v1/volumes?maxResults=20&q=${encodeURIComponent(query)}&key=${GOOGLE_BOOKS_API_KEY}&langRestrict=en`);
      const data = await res.json();
      setBooks(data.items || []);
    } catch (error) {
      console.error('Failed to search books:', error);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (book) => {
    const bookInfo = book.volumeInfo;
    setModalData({
      ...book,
      ...bookInfo
    });
    setIsModalOpen(true);
  };

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
    setSearchQuery('');
    setSelectedFilter('all');
  };

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
    setSelectedCategory('');
    setSearchQuery('');
  };

  const renderBookCard = (book) => {
    const info = book.volumeInfo;
    const title = info.title || "Untitled";
    const description = info.description || "No description available.";
    const image = info.imageLinks?.thumbnail || '';

    return (
      <div
        key={book.id}
        className="book-card"
        onClick={() => openModal(book)}
      >
        {image ? (
          <img src={image} alt={`Cover of ${title}`} loading="lazy" />
        ) : (
          <div className="no-image">No Image</div>
        )}
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    );
  };

  return (
    <div className="book-explorer">
      <header>
        <h1>📚 Book Explorer</h1>
        <p className="subtitle">Discover amazing books and expand your reading horizons</p>
      </header>

      <main>
        <section className="books-section">
          <h2>Explore Books by Category</h2>
          
          <div className="search-filter-container">
            <input
              type="search"
              placeholder="Search books by title, author, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <select 
              value={selectedFilter} 
              onChange={(e) => handleFilterChange(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Books</option>
              <option value="bestseller">Bestsellers</option>
              <option value="newest">Newest</option>
              <option value="rating">Highly Rated</option>
              <option value="free">Free eBooks</option>
            </select>
          </div>

          <div className="book-categories">
            <button 
              className={!selectedCategory ? 'active' : ''}
              onClick={() => handleCategoryClick('')}
            >
              All
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                className={selectedCategory === category.id ? 'active' : ''}
                onClick={() => handleCategoryClick(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="loader">Loading books...</div>
          ) : (
            <div className="books-container">
              {books.length === 0 ? (
                <p className="no-results">No books found.</p>
              ) : (
                books.map(renderBookCard)
              )}
            </div>
          )}

          <div className="randomize-container" style={{ textAlign: 'center', margin: '20px 0' }}>
            <button 
              className="randomize-button"
              onClick={fetchRandomBooks}
              disabled={loading}
            >
              Randomize Books
            </button>
          </div>
        </section>
      </main>

      {isModalOpen && modalData && (
        <Modal
          data={modalData}
          onClose={() => setIsModalOpen(false)}
          type="book"
        />
      )}
    </div>
  );
};

export default BookExplorer;
