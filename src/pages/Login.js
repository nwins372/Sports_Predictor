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
          <button type="submit" className="login-button">Log In</button>
          <button type="button" className="create-account-button">Create Account</button>
        </form>
      </div>
    </div>
    </>
    );
}

export default Login;