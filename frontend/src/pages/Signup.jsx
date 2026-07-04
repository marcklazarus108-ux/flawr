import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import client from "../api/client";
import { useAuth } from "../AuthContext";
import GoogleButton from "../components/GoogleButton";
import ThemeToggle from "../components/ThemeToggle";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await client.post("/auth/signup", { name, email, password });
      loginWithToken(res.data.token, res.data.user);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Couldn't create your account. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleCredential(idToken) {
    setError("");
    try {
      const res = await client.post("/auth/google", { idToken });
      loginWithToken(res.data.token, res.data.user);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Couldn't sign up with Google.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-neutral-50 dark:bg-neutral-950">
      <div className="w-full max-w-sm">
        <div className="flex justify-between items-center mb-8">
          <div className="font-serif text-2xl text-flawr-800 dark:text-flawr-100">Flawr</div>
          <ThemeToggle />
        </div>

        <h1 className="text-lg font-medium mb-1">Create your account</h1>
        <p className="text-sm text-neutral-500 mb-6">Let the writing take care of itself.</p>

        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 dark:bg-red-950 dark:text-red-300 border border-red-200 dark:border-red-900 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-flawr-400"
          />
          <input
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-flawr-400"
          />
          <input
            type="password"
            placeholder="Password, at least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-flawr-400"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-flawr-800 hover:bg-flawr-900 text-white text-sm font-medium py-2 transition-colors disabled:opacity-60"
          >
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
          <span className="text-xs text-neutral-400">or</span>
          <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
        </div>

        <GoogleButton onCredential={handleGoogleCredential} />

        <p className="text-sm text-neutral-500 text-center mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-flawr-800 dark:text-flawr-200 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
