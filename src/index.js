import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import Header from "./components/Header";
import Footer from "./components/Footer";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex flex-col flex-grow">
        <App />
      </main>
      <Footer />
    </div>
  </React.StrictMode>,
);
