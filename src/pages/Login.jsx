import { useState } from "react";
import NavBar from "../components/NavBar";
import "./Login.css";

export default function App() {
  const [page, setPage] = useState("login");
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    identifier: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    console.log("Form submitted:", form);
    alert(`Submitted: ${JSON.stringify(form, null, 2)}`);
  };

  return (
    <div>
      <NavBar />

      {/* Apply your CSS styles here */}
      <div className="login-container">
        <h1>{page === "login" ? "Login" : "Register"}</h1>

        {page === "register" ? (
          <>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
            />
          </>
        ) : (
          <input
            type="text"
            name="identifier"
            placeholder="Username or Email"
            value={form.identifier}
            onChange={handleChange}
          />
        )}

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
        />

        <button onClick={handleSubmit}>
          {page === "login" ? "Login" : "Register"}
        </button>

        <p onClick={() => setPage(page === "login" ? "register" : "login")}>
          {page === "login"
            ? "Need an account? Register"
            : "Already have an account? Login"}
        </p>
      </div>
    </div>
  );
}
