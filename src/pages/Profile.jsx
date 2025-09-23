import NavBar from '../components/NavBar';
import './Profile.css';
import { useState } from 'react';

function Profile() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Updating profile:', { username, email, password });
    alert('Profile updated!');
  };

  return (
    <>
      <NavBar />
      <div className="profile-container">
        <h1>User Profile</h1>
        <div className="profile-box">
          <form className="profile-form" onSubmit={handleSubmit} autoComplete="off">
            <label>
              Username:
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter new username"
                autoComplete="off"
              />
            </label>
            <label>
              Email:
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter new email"
                autoComplete="off"
              />
            </label>
            <label>
              Password:
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                autoComplete="new-password"
              />
            </label>
            <button type="submit">Update Profile</button>
          </form>
        </div>
      </div>
    </>
  );
}

export default Profile;
