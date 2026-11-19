import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Restore session on page reload using GET /api/auth/me
    useEffect(() => {
        const verifySession = async () => {
            const token = localStorage.getItem('kasper_token');
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const res = await api.get('/auth/me');
                setUser(res.data.data.user);
            } catch {
                localStorage.removeItem('kasper_token');
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        verifySession();
    }, []);

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        const { user: loggedUser, token } = res.data.data;
        localStorage.setItem('kasper_token', token);
        setUser(loggedUser);
        return loggedUser;
    };

    const register = async (name, email, password) => {
        const res = await api.post('/auth/register', { name, email, password });
        const { user: createdUser, token } = res.data.data;
        localStorage.setItem('kasper_token', token);
        setUser(createdUser);
        return createdUser;
    };

    const logout = () => {
        localStorage.removeItem('kasper_token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used inside an AuthProvider');
    }
    return context;
}