import { store } from "@/Redux/App/Store";
import { ApolloProvider } from "@apollo/client/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import client from "./api/Apollo/ApolloClient.js";
import App from "./App.jsx";
import { ConfirmProvider } from "./components/ConfirmContext/ConfirmContext.jsx";
import { ToastProvider } from "./components/Toaster/ToastContext.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ToastProvider position="top-right">
      <ConfirmProvider>
        <Provider store={store}>
          <ApolloProvider client={client}>
            <App />
          </ApolloProvider>
        </Provider>
      </ConfirmProvider>
    </ToastProvider>
  </StrictMode>
);
