import React, { useState, useEffect } from 'react';
import '../css/NewsPage.css';

function NewsPage() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    const loadNewsData = async () => {
      try {
        // Load news data from public folder
        const newsResponse = await fetch('./cricket_news.json');
        if (newsResponse.ok) {
          const newsData = await newsResponse.json();
          // Filter out news items without descriptions during initial loading
          const newsWithDescriptions = newsData?.storyList?.filter(item => 
            item.story && item.story.intro && item.story.intro.trim() !== ''
          ) || [];
          setNews(newsWithDescriptions);
          console.log("Loaded news items:", newsWithDescriptions.length);
        } else {
          console.error("Failed to fetch news data:", newsResponse.statusText);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        setLoading(false);
      }
    };
    
    loadNewsData();
  }, []);

  // Format the date for better readability
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    // Check if the timestamp is a valid number
    const numTimestamp = Number(timestamp);
    if (isNaN(numTimestamp)) return 'N/A';
    
    try {
      const date = new Date(numTimestamp);
      
      // Check if date is valid
      if (isNaN(date.getTime())) return 'N/A';
      
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error("Date formatting error:", error);
      return 'N/A';
    }
  };

  // Filter news by category
  const filterNewsByCategory = (category) => {
    setActiveCategory(category);
  };

  if (loading) {
    return <div className="loading">Loading news data...</div>;
  }

  // Extract categories from context field which may be a string
  const getNewsCategories = () => {
    const categories = new Set();
    news.forEach(item => {
      if (item.story?.context) {
        // Handle both string and object formats for context
        const category = typeof item.story.context === 'string' 
          ? item.story.context 
          : item.story.context?.category;
          
        if (category) {
          categories.add(category.toLowerCase());
        }
      }
    });
    return ['all', ...Array.from(categories)];
  };
  
  const newsCategories = getNewsCategories();

  // Filter news based on active category and context format
  const filteredNews = activeCategory === 'all' 
    ? news 
    : news.filter(item => {
        const newsContext = item.story?.context;
        if (typeof newsContext === 'string') {
          return newsContext.toLowerCase() === activeCategory;
        } else if (typeof newsContext === 'object') {
          return (newsContext?.category?.toLowerCase() || '') === activeCategory;
        }
        return false;
      });

  return (
    <div className="news-page">
      <h1>Cricket News & Updates</h1>
      
      <div className="news-layout">
        <div className="main-content">
          <div className="category-filter">
            {newsCategories.map(category => (
              <button 
                key={category}
                className={`category-btn ${activeCategory === category ? 'active' : ''}`}
                onClick={() => filterNewsByCategory(category)}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
          
          <div className="news-list">
            {filteredNews && filteredNews.length > 0 ? (
              filteredNews.map((item, index) => {
                // Skip items without story or intro
                if (!item.story || !item.story.intro) return null;
                
                return (
                  <div key={item.story.id || index} className="news-card">
                    <div className="news-content">
                      <h3 className="news-title">{item.story.hline || 'News Title'}</h3>
                      <p className="news-intro">{item.story.intro}</p>
                      <div className="news-meta">
                        {item.story.context && (
                          <span className="news-category">
                            {typeof item.story.context === 'string' 
                              ? item.story.context 
                              : (item.story.context.category || 'General')}
                          </span>
                        )}
                        <span className="news-date">{formatDate(item.story.pubTime)}</span>
                      </div>
                    </div>
                  </div>
                );
              }).filter(Boolean) // Remove null items
            ) : (
              <div className="no-news">No news articles available in this category.</div>
            )}
          </div>
        </div>
        
        <div className="sidebar">
          <div className="news-stats-card">
            <h3>News Statistics</h3>
            <div className="stats-container">
              <div className="stat-item">
                <span className="stat-value">{news.length}</span>
                <span className="stat-label">Total Articles</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{newsCategories.length - 1}</span>
                <span className="stat-label">Categories</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">
                  {news.length > 0 ? formatDate(news[0].story?.pubTime) : 'N/A'}
                </span>
                <span className="stat-label">Latest Update</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewsPage;