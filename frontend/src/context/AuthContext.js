import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const userData = await api('/api/auth/me');
                    setUser(userData);
                } catch (error) {
                    localStorage.removeItem('token');
                    setUser(null);
                }
            }
            setLoading(false);
        };
        loadUser();
    }, []);

    const login = async (credentials) => {
        const data = await api('/api/auth/login', 'POST', credentials);
        localStorage.setItem('token', data.token);
        const userData = await api('/api/auth/me');
        setUser(userData);
    };
    
    const signup = async (userData) => {
        const data = await api('/api/auth/signup', 'POST', userData);
        localStorage.setItem('token', data.token);
        const newUser = await api('/api/auth/me');
        setUser(newUser);
    };

    const guestLogin = async () => {
        const data = await api('/api/auth/guest', 'POST');
        localStorage.setItem('token', data.token);
        const userData = await api('/api/auth/me');
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const value = { user, loading, login, signup, guestLogin, logout };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};