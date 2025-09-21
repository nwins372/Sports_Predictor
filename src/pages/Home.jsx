import NavBar from "../components/NavBar";
import ScheduleBar from "../components/ScheduleBar";
import './Home.css';
function Home() {
    return (
        <>
        <div id="app-container">
        {/* NavBar and ScheduleBar always at the top*/}
        <NavBar />
        <ScheduleBar />
       <header>
       </header>
 
       <div className="container">
         <main>

         </main>
 
         <aside>
         </aside>
       </div>
 
       <footer>
         
       </footer>
     </div>
     </>
    )
}

export default Home;