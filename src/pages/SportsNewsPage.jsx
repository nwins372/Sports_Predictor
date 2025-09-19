import React, { useEffect, useState } from "react";
import NavBar from "../components/NavBar";  
import "./SportsNewsPage.css";

const API_KEY = "f9f8b0829ca84fe1a1d450e0fe7dbbd1";
const API_URL = `https://newsapi.org/v2/top-headlines?category=sports&language=en&pageSize=10&apiKey=${API_KEY}`;

function SportsNewsPage() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      const cached = localStorage.getItem("sportsNews");
      const lastUpdate = localStorage.getItem("sportsNewsTimestamp");
      const now = new Date().getTime();

      // Use cached news if less than 24 hours old
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
    <>
      <NavBar />   

      <div className="container mt-5">
        <h2
          className="mb-4 text-center"
          style={{
            fontFamily: "Arial Black, sans-serif",
            color: "#e63946",
          }}
        >
          Sports News
        </h2>

        {loading ? (
          <p className="text-center">Loading latest sports news...</p>
        ) : news.length === 0 ? (
          <p className="text-center">No news available. Try again later.</p>
        ) : (
          <div className="row">
            {news.map((article, index) => (
              <div key={index} className="col-md-6 mb-4">
                <div
                  className="card h-100 shadow-sm"
                  style={{ border: "2px solid #1d3557" }}
                >
                  {article.urlToImage && (
                    <img
                      src={article.urlToImage}
                      className="card-img-top"
                      alt={article.title}
                      style={{ height: "200px", objectFit: "cover" }}
                    />
                  )}
                  <div className="card-body">
                    <h5 className="card-title">{article.title}</h5>
                    <p className="card-text">{article.description}</p>
                  </div>
                  <div className="card-footer d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                      {new Date(article.publishedAt).toLocaleDateString()}
                    </small>
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-primary"
                    >
                      Read More
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default SportsNewsPage;
