import { useState } from "react";
import NavBar from "../components/NavBar";
import { supabase } from "../supabaseClient";
import "./Login.css";

export default function App() {
  const [page, setPage] = useState("login");
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    identifier: "", // username or email
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      if (page === "register") {
        // 1) Sign up with Auth (stores password securely)
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            data: { username: form.username.trim() }, // optional: saved in user_metadata
            emailRedirectTo: window.location.origin, // optional
          },
        });
        if (signUpError) throw signUpError;

        const user = signUpData.user;
        if (!user) {
          // If email confirmation is required, user can be null until they confirm
          alert("Check your email to confirm your account.");
          return;
        }

        // 2) Insert profile row in public.users
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
          // Treat as username -> fetch email
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
        if (signInError) throw signInError;

        alert("Login successful!");
      }
    } catch (err) {
      console.error(err);
      alert(`Error: ${err.message ?? String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <NavBar />
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
