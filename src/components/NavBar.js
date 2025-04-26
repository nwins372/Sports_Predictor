import { Link, Routes, Route } from 'react-router-dom';
import './NavBar.css'; 
import mg from '../assets/mag_glass.png';

function NavBar() {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/" className="site-title">
          SportsPredictor
        </Link>
      </div>

      <div className="navbar-center">
        <Link to="/following" className="nav-link" id="following">Following</Link>
        <Link to="/sports" className="nav-link" id="sports">Sports</Link>
        <Link to="/login">Login/CreateAccount </Link>
      </div>

      <div className="navbar-right">
        <span className="icon-placeholder" id="more-features">More</span>
        <Link to="/search" className="icon-placeholder" id="search">
          <img src ={mg} alt="Search Icon" width="30" height="30" />
        </Link>
        <span className="icon-placeholder" id="profile">Profile</span>
      </div>
    </nav>
  );
}

export default NavBar;
