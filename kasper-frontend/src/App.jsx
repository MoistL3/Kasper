import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProfileProvider } from './context/ProfileContext';
import { ProtectedRoute, PublicRoute } from './components/RouteGuards';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import Profile from './pages/Profile';

export default function App() {
    return (
        <AuthProvider>
            <ProfileProvider>
                <BrowserRouter>
                    <Routes>
                        <Route
                            path="/login"
                            element={
                                <PublicRoute>
                                    <Login />
                                </PublicRoute>
                            }
                        />
                        <Route
                            path="/register"
                            element={
                                <PublicRoute>
                                    <Register />
                                </PublicRoute>
                            }
                        />
                        <Route
                            path="/verify-email"
                            element={
                                <PublicRoute>
                                    <VerifyEmail />
                                </PublicRoute>
                            }
                        />
                        <Route
                            path="/profile"
                            element={
                                <ProtectedRoute>
                                    <Profile />
                                </ProtectedRoute>
                            }
                        />
                        {/* أي مسار تاني: لو مسجّل دخول يروح للبروفايل، ولو لا ProtectedRoute يرجعه للـ login */}
                        <Route path="*" element={<Navigate to="/profile" replace />} />
                    </Routes>
                </BrowserRouter>
            </ProfileProvider>
        </AuthProvider>
    );
}