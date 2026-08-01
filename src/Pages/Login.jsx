import { useState } from "react";
import axios from "../api/axios";

const Login = ({ setAuth }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    try {
      if (isRegister) {
        await axios.post("/auth/register", { name, email, password });
        setIsRegister(false);
        setError("Registered! Please login.");
      } else {
        const res = await axios.post("/auth/login", { email, password });
        setAuth({ accessToken: res.data.accessToken, name: res.data.name });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

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

              {error && (
                  <p className={`text-sm ${error.includes("Registered") ? "text-green-400" : "text-red-400"}`}>
                      {error}
                  </p>
              )}

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
          className="w-full bg-violet-600 hover:bg-violet-700 text-white text-sm py-2 rounded-lg transition"
        >
          {isRegister ? "Register" : "Login"}
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