import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    // Initial check
    useEffect(() => {
        const initAuth = async () => {
            if (token) {
                try {
                    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    const res = await axios.get('http://127.0.0.1:8000/auth/me');
                    setUser(res.data);
                } catch (e) {
                    console.error("Auth init failed", e);
                    logout();
                }
            }
            setLoading(false);
        };
        initAuth();
    }, [token]);

    const login = async (email, password) => {
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);

        const res = await axios.post('http://127.0.0.1:8000/auth/login', formData);
        const accessToken = res.data.access_token;

        localStorage.setItem('token', accessToken);
        setToken(accessToken);
        // User will be fetched by effect
        return true;
    };

    const signup = async (companyName, fullName, email, password) => {
        const formData = new FormData();
        formData.append('company_name', companyName);
        formData.append('full_name', fullName);
        formData.append('email', email);
        formData.append('password', password);

        const res = await axios.post('http://127.0.0.1:8000/auth/signup', formData);
        const accessToken = res.data.access_token;

        localStorage.setItem('token', accessToken);
        setToken(accessToken);
        return true;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{ user, token, login, signup, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
