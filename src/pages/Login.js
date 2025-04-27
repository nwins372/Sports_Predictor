import NavBar from '../components/NavBar';
import './Login.css';

function Login() {
    return (
        <>
        <NavBar />    
        <div className="login-container">
        <h1>Login</h1>
      <div className="login-box">
        <form className="login-form">
          <input type="text" placeholder="Username" />
          <input type="password" placeholder="Password" />
          <button type="submit" id="login-button">Log In</button>
          <button type="button" id="create-account-button">Create Account</button>
        </form>
      </div>
    </div>
    </>
    );
}

export default Login;