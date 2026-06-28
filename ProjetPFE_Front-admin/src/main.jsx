import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import store from "./components/Store/store.jsx";
import { BrowserRouter, useNavigate } from "react-router-dom";
import { Provider } from "react-redux";
import { setupAxiosInterceptors } from "./api/axiosConfig";
import "../global.js";

const AxiosSetup = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    setupAxiosInterceptors(navigate); 
  }, [navigate]);

  return children;
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Provider store={store}>
        <AxiosSetup>
          <App />
        </AxiosSetup>
      </Provider>
    </BrowserRouter>
  </React.StrictMode>
);