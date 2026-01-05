import { Routes, Route } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

import Layout from "./presentation/components/layout";
import HomePage from "./presentation/pages/HomePage";
import VkmsPage from "./presentation/pages/VkmsPage";
import VkmsDetailPage from "./presentation/pages/VkmsDetailPage";
import LoginPage from "./presentation/pages/LoginPage";
import RegisterPage from "./presentation/pages/RegisterPage";
import AccountPage from "./presentation/pages/AccountPage";
import ErrorPage from "./presentation/pages/ErrorPage"; // pas het pad aan naar jouw file
import AboutPage from "./presentation/pages/AboutPage";
import SwipePage from "./presentation/pages/SwipePage";


function App() {
  return (
    <Routes>
      {/* ✅ Alle routes zitten nu in de Layout */}
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="vkms" element={<VkmsPage />} />
        <Route path="vkms/:id" element={<VkmsDetailPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/account" element={<AccountPage />} />
                <Route path="*" element={<ErrorPage  />} />
                <Route path="/unauthorized" element={<ErrorPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/swipe" element={<SwipePage />} />

      </Route>
    </Routes>
  );
}

export default App;
