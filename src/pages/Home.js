import React from "react";
import NavBar from "../components/NavBar";

function Home() {
  return (
    <div id="app-container">
      <NavBar />
      <header></header>

      <div className="container text-center mt-5">
        <main>
          <h1>Top Story: Your Team Wins Big!</h1>
          <p>Angels getting swept in the series. Is this really a surprise?</p>
        </main>

        <aside className="mt-5">
          <h2>Latest Scores</h2>
          <ul>
            <li>Yankees 5 - Red Sox 3</li>
            <li>Lakers 102 - Celtics 99</li>
            <li>Cowboys 24 - Giants 20</li>
          </ul>
        </aside>
      </div>

      <footer>
        <p></p>
      </footer>
    </div>
  );
}

export default Home;
