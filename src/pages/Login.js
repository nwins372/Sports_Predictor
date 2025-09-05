import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function Login() {
  const [page, setPage] = useState("login");
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });
    if (error) setMessage(error.message);
    else setMessage("Check your email to confirm registration.");
  };

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });
    if (error) setMessage(error.message);
    else {
      setUser(data.user);
      setMessage("Login successful");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setMessage("Logged out");
  };

  return (
    <div className="p-6 max-w-sm mx-auto">
      <h1 className="text-xl mb-4">
        {page === "login" ? "Login" : "Register"}
      </h1>

      <input
        type="email"
        name="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
        className="border p-2 mb-2 w-full"
      />
      <input
        type="password"
        name="password"
        placeholder="Password"
        value={form.password}
        onChange={handleChange}
        className="border p-2 mb-2 w-full"
      />

      {page === "login" ? (
        <button
          onClick={handleLogin}
          className="bg-blue-500 text-white p-2 w-full rounded"
        >
          Login
        </button>
      ) : (
        <button
          onClick={handleRegister}
          className="bg-green-500 text-white p-2 w-full rounded"
        >
          Register
        </button>
      )}

      <p
        className="mt-2 text-sm cursor-pointer text-blue-700"
        onClick={() => setPage(page === "login" ? "register" : "login")}
      >
        {page === "login"
          ? "Need an account? Register"
          : "Already have an account? Login"}
      </p>

      {message && <p className="mt-3 text-gray-700">{message}</p>}

      {user && (
        <div className="mt-4">
          <p>Welcome, {user.email}</p>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white p-2 w-full rounded"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}