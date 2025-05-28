
import React, { useEffect } from 'react';

const Modal = ({ data, onClose, type }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const renderMovieModal = () => {
    const releaseDate = data.release_date || 'Unknown';
    const rating = data.vote_average !== undefined ? data.vote_average.toFixed(1) + '/10' : 'N/A';
    const cast = data.cast ? data.cast.join(', ') : 'Not available';
    const director = data.director || 'Not available';

    return (
      <>
        <h2>{data.title || "Untitled"}</h2>
        <div className="meta">
          <div className="meta-item">
            <span className="meta-label">Release Date:</span>
            <span className="meta-value">{releaseDate}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Rating:</span>
            <span className="meta-value">{rating}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Director:</span>
            <span className="meta-value">{director}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Main Cast:</span>
            <span className="meta-value">{cast}</span>
          </div>
        </div>
        {data.poster_path && (
          <img 
            src={`https://image.tmdb.org/t/p/w500${data.poster_path}`}
            alt={`Poster of ${data.title}`}
          />
        )}
        <p>{data.overview || "No description available."}</p>
        {data.trailer && (
          <div className="modal-trailer">
            <iframe
              src={`https://www.youtube.com/embed/${data.trailer}?autoplay=1`}
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        )}
      </>
    );
  };

  const renderBookModal = () => {
    const authors = data.authors ? data.authors.join(', ') : 'Unknown Author';
    const publishedDate = data.publishedDate || 'Unknown';
    const pageCount = data.pageCount || 'N/A';
    const categories = data.categories ? data.categories.join(', ') : 'N/A';
    const rating = data.averageRating ? `${data.averageRating}/5 (${data.ratingsCount || 0} reviews)` : 'No rating';
    const language = data.language || 'N/A';
    const publisher = data.publisher || 'Unknown Publisher';

    return (
      <>
        <h2>{data.title || "Untitled"}</h2>
        <div className="meta">
          <div className="meta-item">
            <span className="meta-label">Author(s):</span>
            <span className="meta-value">{authors}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Published:</span>
            <span className="meta-value">{publishedDate}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Publisher:</span>
            <span className="meta-value">{publisher}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Pages:</span>
            <span className="meta-value">{pageCount} pages</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Categories:</span>
            <span className="meta-value">{categories}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Rating:</span>
            <span className="meta-value">{rating}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Language:</span>
            <span className="meta-value">{language}</span>
          </div>
        </div>
        {data.imageLinks?.thumbnail && (
          <img 
            src={data.imageLinks.thumbnail}
            alt={`Cover of ${data.title}`}
          />
        )}
        <p>{data.description || "No description available."}</p>
        {data.previewLink && (
          <a 
            href={data.previewLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="preview-link"
          >
            📖 Read Preview
          </a>
        )}
      </>
    );
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <button className="modal-close" onClick={onClose} aria-label="Close details">
          &times;
        </button>
        {type === 'movie' ? renderMovieModal() : renderBookModal()}
      </div>
    </div>
  );
};

export default Modal;
