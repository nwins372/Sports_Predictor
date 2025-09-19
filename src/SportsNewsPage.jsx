import React, { useEffect, useState } from "react";

// Example API: https://newsapi.org/ (you need an API key)
const API_KEY = "YOUR_NEWSAPI_KEY"; // replace with your key
const API_URL = `https://newsapi.org/v2/top-headlines?category=sports&language=en&pageSize=10&apiKey=${API_KEY}`;

function SportsNewsPage() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      const cached = localStorage.getItem("sportsNews");
      const lastUpdate = localStorage.getItem("sportsNewsTimestamp");
      const now = new Date().getTime();

      if (cached && lastUpdate && now - lastUpdate < 24 * 60 * 60 * 1000) {
        setNews(JSON.parse(cached));
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(API_URL);
        const data = await response.json();
        if (data.articles) {
          setNews(data.articles);
          localStorage.setItem("sportsNews", JSON.stringify(data.articles));
          localStorage.setItem("sportsNewsTimestamp", now.toString());
        }
      } catch (error) {
        console.error("Error fetching sports news:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  return (
    <div className="container mt-5">
      <h2>Latest Sports News</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="list-group mt-3">
          {news.map((article, index) => (
            <a
              key={index}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="list-group-item list-group-item-action flex-column align-items-start"
            >
              <div className="d-flex w-100 justify-content-between">
                <h5 className="mb-1">{article.title}</h5>
                <small>{new Date(article.publishedAt).toLocaleDateString()}</small>
              </div>
              <p className="mb-1">{article.description}</p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default SportsNewsPage;
