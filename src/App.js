import React from 'react';
import './index.css';

function App() {
  return (
    <div>
      <header>
        <div className="logo">ESPN</div>
        <nav>
          <ul>
            <li><a href="#">Home</a></li>
            <li><a href="#">Scores</a></li>
            <li><a href="#">Draft Predictor</a></li>
            <li><a href="#">Game Simulator</a></li>
            <li><a href="#">About</a></li>
          </ul>
        </nav>
      </header>

      <div className="container">
        <main>
          <h1>Top Story: Your Team Wins Big!</h1>
          <p>Angels geting swept in the series. Is this really a suprise?</p>
        </main>

        <aside>
          <h2>Latest Scores</h2>
          <ul>
            <li>Yankees 5 - Red Sox 3</li>
            <li>Lakers 102 - Celtics 99</li>
            <li>Cowboys 24 - Giants 20</li>
          </ul>
        </aside>
      </div>

      <footer>
        <p>&copy; Sports Predictor. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
