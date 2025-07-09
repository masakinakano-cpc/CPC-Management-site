import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/apiService';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const checkAuthStatus = useCallback(async () => {
        console.log('🔍 認証状態をチェック中...');
        try {
            const response = await authAPI.getCurrentUser();
            console.log('✅ 認証成功:', response.user);
            setUser(response.user);
            setIsAuthenticated(true);
        } catch (error) {
            console.error('❌ 認証チェックエラー:', error);
            logout();
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = useCallback(() => {
        console.log('🚪 ログアウト実行');
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
        // ログアウト時にログイン画面にリダイレクト
        if (window.location.pathname !== '/login') {
            window.location.href = '/login';
        }
    }, []);

    // 初期化時にトークンをチェック
    useEffect(() => {
        console.log('🚀 AuthContext初期化開始');
        const token = localStorage.getItem('token');
        console.log('🔑 トークン存在:', !!token);

        if (token) {
            checkAuthStatus();
        } else {
            console.log('❌ トークンなし - 未認証状態に設定');
            setLoading(false);
            setIsAuthenticated(false);
        }
    }, [checkAuthStatus]);

    const login = async (username, password) => {
        alert('login関数呼び出し');
        console.log('🔐 ログイン試行:', username);
        try {
            const response = await authAPI.login({
                username,
                password
            });

            const { token, user } = response;
            console.log('✅ ログイン成功:', user);
            localStorage.setItem('token', token);
            setUser(user);
            setIsAuthenticated(true);
            return { success: true };
        } catch (error) {
            console.error('❌ ログインエラー:', error);
            alert(error.message || 'ログインに失敗しました');
            return {
                success: false,
                error: error.message || 'ログインに失敗しました'
            };
        }
    };

    const value = {
        user,
        isAuthenticated,
        loading,
        login,
        logout
    };

    console.log('📊 認証状態:', { isAuthenticated, loading, user: user?.username });

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
