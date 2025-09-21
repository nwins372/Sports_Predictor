import { useState } from "react";
import NavBar from "../components/NavBar";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import "./Login.css";

export default function App() {
  const [page, setPage] = useState("login");
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    identifier: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      if (page === "register") {
        // Sign up with Auth 
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            data: { username: form.username.trim() },
            emailRedirectTo: window.location.origin, 
          },
        });
        if (signUpError) throw signUpError;

        const user = signUpData.user;

        // Insert profile row in public.users
        const { error: insertError } = await supabase.from("users").insert({
          id: user.id,
          username: form.username.trim(),
          email: form.email.trim(),
        });
        if (insertError) throw insertError;

        alert("Registration successful!");
      } else {
        // LOGIN
        const identifier = form.identifier.trim();

        let emailForLogin = identifier;
        if (!identifier.includes("@")) {
          // fetch user by email
          const { data: rows, error: lookupError } = await supabase
            .from("users")
            .select("email")
            .eq("username", identifier)
            .limit(1)
            .maybeSingle();
          if (lookupError) throw lookupError;
          if (!rows?.email) {
            alert("Username not found.");
            return;
          }
          emailForLogin = rows.email;
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: emailForLogin,
          password: form.password,
          
        });
        if (signInError) {
          throw signInError;
        }
        // Alerts user of successful login, clears form, and redirects to home page
        // - Winston
        alert("Login successful!");
        setForm({
          username: "",
          email: "",
          password: "",
          identifier: "",
        });
        navigate("/");
      }
    } catch (err) {

      // Clear form if login fails
      console.error(err);
      alert(`Error: ${err.message ?? String(err)}`);
    } finally {
      setLoading(false);
          setForm({
          username: "",
          email: "",
          password: "",
          identifier: "",
        });
    }
  };

  return (
    <div>
      <NavBar />
      <div className="login-container">
        <h1>{page === "login" ? "Login" : "Register"}</h1>

        {/* If user is on register page, also show the username field */}
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

        <button onClick={handleSubmit} disabled={loading}>
          {loading ? "Please wait..." : page === "login" ? "Login" : "Register"}
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
