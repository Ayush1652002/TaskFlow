import { useState } from "react";
import axios from "../api/axios";

const Login = ({ setAuth }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [awaitingOtp, setAwaitingOtp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);
    try {
      if (isRegister) {
        await axios.post("/auth/register", { name, email, password });
        setAwaitingOtp(true); // move to the "enter the code we emailed you" screen
        setInfo(`We sent a 6-digit code to ${email}`);
      } else {
        const res = await axios.post("/auth/login", { email, password });
        setAuth({ accessToken: res.data.accessToken, name: res.data.name, id: res.data.id });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    setSubmitting(true);
    try {
      const res = await axios.post("/auth/verify-otp", { email, otp });
      setAuth({ accessToken: res.data.accessToken, name: res.data.name, id: res.data.id });
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired code");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    try {
      await axios.post("/auth/resend-otp", { email });
      setInfo("A new code was sent");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend code");
    }
  };

  const handleGuestLogin = async () => {
    try {
      const res = await axios.post("/auth/guest");
      setAuth({ accessToken: res.data.accessToken, name: res.data.name, id: res.data.id });
    } catch {
      setError("Failed to start guest session");
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${axios.defaults.baseURL}/auth/google`;
  };

  // ---- OTP verification screen ----
  if (awaitingOtp) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-8 w-full max-w-md space-y-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-violet-600 rounded-md"></div>
            <h1 className="text-lg font-semibold text-white">TaskFlow</h1>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">Verify your email</h2>
            <p className="text-sm text-gray-500 mt-1">{info}</p>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="6-digit code"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            className="w-full bg-[#1e1e1e] border border-[#2e2e2e] rounded-lg px-4 py-2 text-sm text-white outline-none placeholder-gray-600 tracking-widest text-center"
          />

          <button
            onClick={handleVerifyOtp}
            disabled={submitting || otp.length !== 6}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm py-2 rounded-lg transition"
          >
            {submitting ? "Verifying..." : "Verify"}
          </button>

          <p className="text-sm text-gray-500 text-center">
            Didn't get it?
            <button onClick={handleResendOtp} className="text-violet-400 ml-1 hover:underline">
              Resend code
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ---- Normal login/register screen ----
  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
      <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-8 w-full max-w-md space-y-6">

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-violet-600 rounded-md"></div>
          <h1 className="text-lg font-semibold text-white">TaskFlow</h1>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-white">
            {isRegister ? "Create account" : "Welcome back"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {isRegister ? "Sign up to get started" : "Login to your account"}
          </p>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="space-y-3">
          {isRegister && (
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#1e1e1e] border border-[#2e2e2e] rounded-lg px-4 py-2 text-sm text-white outline-none placeholder-gray-600"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#1e1e1e] border border-[#2e2e2e] rounded-lg px-4 py-2 text-sm text-white outline-none placeholder-gray-600"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#1e1e1e] border border-[#2e2e2e] rounded-lg px-4 py-2 text-sm text-white outline-none placeholder-gray-600"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm py-2 rounded-lg transition"
        >
          {submitting ? "Please wait..." : isRegister ? "Register" : "Login"}
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[#2e2e2e]" />
          <span className="text-xs text-gray-600">or</span>
          <div className="flex-1 h-px bg-[#2e2e2e]" />
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-gray-800 text-sm py-2 rounded-lg transition"
        >
          <svg width="16" height="16" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.9 32.7 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.2 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.2 29.5 4 24 4c-7.7 0-14.3 4.4-17.7 10.7z"/>
            <path fill="#4CAF50" d="M24 44c5.4 0 10.3-2.1 14-5.5l-6.5-5.5c-2 1.4-4.6 2.3-7.5 2.3-5.4 0-9.9-3.3-11.4-8H5.9l-6.6 5.1C3.7 39.6 13.1 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1 3-3.2 5.4-6 6.8l6.5 5.5C39 37 43 31.5 43.6 24c.2-1.2.4-2.4.4-3.5 0-1.3-.1-2.7-.4-3.5z"/>
          </svg>
          Continue with Google
        </button>

        <button
          onClick={handleGuestLogin}
          className="w-full bg-[#1e1e1e] hover:bg-[#2e2e2e] text-gray-300 text-sm py-2 rounded-lg transition"
        >
          Continue as Guest
        </button>

        <p className="text-sm text-gray-500 text-center">
          {isRegister ? "Already have an account?" : "Don't have an account?"}
          <button
            onClick={() => { setIsRegister(!isRegister); setError(""); }}
            className="text-violet-400 ml-1 hover:underline"
          >
            {isRegister ? "Login" : "Register"}
          </button>
        </p>

      </div>
    </div>
  );
};

export default Login;
