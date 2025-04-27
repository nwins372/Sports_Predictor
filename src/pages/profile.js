import NavBar from '../components/NavBar';
import './Login.css';

function Profile_Page() {
    return (
        <>
        <NavBar />    
        <div className="profile-container">
        <h1>User Profile</h1>
      <div className="profile-box">
        <input type="text" placeholder="Username" />
        <input type="password" placeholder="Password" />
        <button type="submit" id="login-button">Log In</button>
        <button type="button" id="create-account-button">Create Account</button>
      </div>
    </div>
    </>
    );
}

export default Profile_Page;
