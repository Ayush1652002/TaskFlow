import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-[#141414] border border-[#1e1e1e] flex items-center justify-center text-3xl">
        🔍
      </div>
      <h1 className="text-2xl font-semibold text-white">Page not found</h1>
      <p className="text-sm text-gray-500">The page you're looking for doesn't exist.</p>
      <button
        onClick={() => navigate("/")}
        className="mt-2 bg-violet-600 hover:bg-violet-700 text-white text-sm px-5 py-2 rounded-lg transition"
      >
        Back to Dashboard
      </button>
    </div>
  );
};

export default NotFound;