import NavBar from "../components/NavBar";

function Home() {
    const navigate = useNavigate();

    const goToSportsNews = () => {
      navigate("/sports-news");
  };
    return (
        <>
        <div id="app-container">
        <NavBar />
       <header>
       </header>
 
       <div className="container">
         <main>
           <h1>Top Story: Your Team Wins Big!</h1>
           <p>Angels geting swept in the series. Is this really a suprise?</p>
          {/* Sports button */}
            <button
              className="btn btn-primary mt-3"
              onClick={goToSportsNews}
            >
              Go to Sports News
            </button>
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
         <p></p>
       </footer>
     </div>
     </>
    )
}

export default Home;