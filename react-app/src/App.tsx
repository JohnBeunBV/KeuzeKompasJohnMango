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
import ErrorPage from "./presentation/pages/ErrorPage";
import AboutPage from "./presentation/pages/AboutPage";
import SwipePage from "./presentation/pages/SwipePage";
import AuthGuard from "./presentation/components/AuthGuard";
import AdminPage from "./presentation/pages/AdminPage";
import TeacherPage from "./presentation/pages/TeacherPage";



function App() {
    return (
        <Routes>
            <Route path="/" element={<Layout />}>

                {/* Public */}
                <Route index element={<HomePage />} />
                <Route path="about" element={<AboutPage />} />
                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />

                {/* Auth required */}
                <Route
                    path="account"
                    element={
                        <AuthGuard>
                            <AccountPage />
                        </AuthGuard>
                    }
                />

                <Route
                    path="vkms"
                    element={
                        <AuthGuard>
                            <VkmsPage />
                        </AuthGuard>
                    }
                />

                <Route
                    path="vkms/:id"
                    element={
                        <AuthGuard>
                            <VkmsDetailPage />
                        </AuthGuard>
                    }
                />

                <Route
                    path="swipe"
                    element={
                        <AuthGuard>
                            <SwipePage />
                        </AuthGuard>
                    }
                />

                {/* Role protected */}
                <Route
                    path="teacher"
                    element={
                        <AuthGuard roles={["teacher"]}>
                            <TeacherPage />
                        </AuthGuard>
                    }
                />

                <Route
                    path="admin"
                    element={
                        <AuthGuard roles={["admin"]}>
                            <AdminPage />
                        </AuthGuard>
                    }
                />

                <Route path="unauthorized" element={<ErrorPage />} />
                <Route path="*" element={<ErrorPage />} />
            </Route>
        </Routes>
    );
}

export default App;

