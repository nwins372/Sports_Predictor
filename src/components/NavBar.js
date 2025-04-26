import { Link, Routes, Route } from 'react-router-dom';
import './NavBar.css'; 

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
        <span className="icon-placeholder" id="more-features">Icon1</span>
        <span className="icon-placeholder" id="search">Icon2</span>
        <span className="icon-placeholder" id="profile">Icon3</span>
      </div>
    </nav>
  );
}

export default NavBar;
