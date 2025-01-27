import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, ChevronRight, ArrowRight, Search } from 'lucide-react';
import './Home.css';

const API_BASE_URL = 'http://localhost:5000';

const ItemCard = ({ item, currentUser }) => {
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();

  const getImageUrl = (photoPath) => {
    if (!photoPath) return '/api/placeholder/400/320';
    return `${API_BASE_URL}/uploads/${photoPath}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date not available';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Invalid Date';
    }
  };
  const isUserPost = currentUser  && item.userId === currentUser.userId; // Adjust based on your item structure
  return (
    <div className="item-card">
      <div className="item-image">
        <img
          src={!imageError ? getImageUrl(item.photoPath) : '/api/placeholder/400/320'}
          alt={item.itemName || 'Item image'}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="item-content">
        <h3 className="item-title">{item.itemName}</h3>
        <div className="item-details">
          <div className="item-detail">📍 {item.location}</div>
          <div className="item-detail">📅 {formatDate(item.dateReported)}</div>
        </div>
        <p className="item-description">{item.description}</p>
        <div className={`item-status ${item.status}`}>
          Status: {item.status}
        </div>
        {item.status === 'active' && (
  <button 
    className={`item-button ${isUserPost ? 'disabled' : ''}`} 
    onClick={() => !isUserPost && navigate(`/details/${item.id}`)} 
    disabled={isUserPost}  // Disable button if the user posted the item
  >
    {isUserPost ? 'You posted this item' : 'View Details'}
  </button>
)}

      </div>
    </div>
  );
};

const ItemCarousel = ({ title, items, currentUser }) => {
  const scroll = (direction) => {
    const container = document.getElementById(`carousel-${title}`);
    const scrollAmount = direction === 'left' ? -350 : 350;
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  return (
    <div className="carousel-container">
      <div className="section-header">
        <h2 className="section-title">{title}</h2>
        <button className="view-all-button">
          View All <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      <div className="carousel-wrapper group">
        <button
          onClick={() => scroll('left')}
          className="carousel-button prev"
        >
          <ChevronLeft />
        </button>
        <div id={`carousel-${title}`} className="carousel-track">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} currentUser={currentUser} />
          ))}
        </div>
        <button
          onClick={() => scroll('right')}
          className="carousel-button next"
        >
          <ChevronRight />
        </button>
      </div>
    </div>
  );
};
const SearchResults = ({ results, currentUser }) => {
  const navigate = useNavigate();

  const handleItemClick = (item) => {
    if (item.status === 'active') {
      navigate(`/details/${item.id}`);
    } else if (item.status === 'resolved') {
      alert('The item has been found!');
    }
  };

  return (
    <div className="search-results">
      {results.map((item) => (
        <div key={item.id} className="search-result-card">
          <div className="result-image">
            <img
              src={item.photoPath ? `${API_BASE_URL}/uploads/${item.photoPath}` : '/api/placeholder/400/320'}
              alt={item.itemName}
              onError={(e) => e.target.src = '/api/placeholder/400/320'}
            />
          </div>
          <div className="result-content">
            <h3>{item.itemName}</h3>
            <div className="result-details">
              <span className={`status ${item.status.toLowerCase()}`}>
                {item.status}
              </span>
              <span className="date">{new Date(item.dateReported).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="result-actions">
            {item.status === 'active' ? (
              <button
                className="view-details-btn"
                onClick={() => handleItemClick(item)}
              >
                View Details
              </button>
            ) : item.status === 'resolved' ? (
              <button
                className="item-resolved-btn"
                disabled
              >
                Item Resolved
              </button>
            ) : (
              <button
                className="report-found-btn"
                disabled
              >
                Report as Found
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const Home = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentUser, setCurrentUser] = useState();

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/items`);
        if (response.data.success) {
          // Filter items to only include 'active' or 'resolved' status
          const filteredItems = response.data.items.filter(item =>
            item.status === 'active' || item.status === 'resolved'
          );
          setItems(filteredItems);
        } else {
          setError(response.data.message);
        }
      } catch (error) {
        setError('Error fetching items');
      } finally {
        setLoading(false);
      }
    };

    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/auth/current`, {
          withCredentials: true,
        });

        if (response.data) {
          setCurrentUser(response.data); // Set the entire user object
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };

    fetchItems();
    fetchCurrentUser();
  }, []);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filteredItems = items.filter(item =>
      item.itemName.toLowerCase().includes(query)
    );

    setSearchResults(filteredItems);
    setIsSearching(true);
  };

  useEffect(() => {
    const delayDebounce = setTimeout(handleSearch, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="home-container">
      <header className="home-header">
        <h1 className="app-name">Lost & Found</h1>
        <div className="search-bar">
          <div className="search-input-wrapper">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      {isSearching && searchQuery ? (
        <SearchResults results={searchResults} currentUser={currentUser} />
      ) : (
        <div className="items-section">
          {/* Assuming you are filtering items by type */}
          <ItemCarousel
            title="Recently Lost Items"
            items={items.filter(item => item.type === 'lost')}
            currentUser={currentUser}
          />
          <ItemCarousel
            title="Recently Found Items"
            items={items.filter(item => item.type === 'found')}
            currentUser={currentUser}
          />
        </div>
      )}
    </div>
  );
};

export default Home;