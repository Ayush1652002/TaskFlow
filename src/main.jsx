import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import TaskProvider from "./Context/TaskContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
        <TaskProvider>
            <App />
        </TaskProvider>
    </BrowserRouter> 
  </StrictMode>
);
