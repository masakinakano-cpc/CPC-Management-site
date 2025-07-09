import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { FaUser, FaLock, FaSignInAlt, FaBug } from 'react-icons/fa';
import './Login.css';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showDebug, setShowDebug] = useState(false);
    const { login, isAuthenticated, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    console.log('🎨 Loginコンポーネントレンダリング');

    // デバッグ情報を表示
    useEffect(() => {
        console.log('🔍 認証状態:', { isAuthenticated, authLoading });
        if (isAuthenticated) {
            console.log('✅ 既に認証済み - ダッシュボードへ遷移');
            navigate('/dashboard');
        }
    }, [isAuthenticated, authLoading, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        alert('submit!');
        console.log('📝 ログインフォーム送信:', { username, password: '***' });
        setLoading(true);

        try {
            const result = await login(username, password);
            console.log('📊 ログイン結果:', result);

            if (result.success) {
                toast.success('ログインに成功しました');
                console.log('✅ ログイン成功 - ダッシュボードへ遷移');
                navigate('/dashboard');
            } else {
                console.log('❌ ログイン失敗:', result.error);
                toast.error(result.error);
            }
        } catch (error) {
            console.error('💥 ログイン処理エラー:', error);
            alert(error.message || 'ログインに失敗しました');
            toast.error('ログインに失敗しました');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1>CPC管理サイト</h1>
                    <p>開催予定管理システム</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <div className="input-icon">
                            <FaUser className="icon" />
                            <input
                                type="text"
                                placeholder="ユーザー名"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <div className="input-icon">
                            <FaLock className="icon" />
                            <input
                                type="password"
                                placeholder="パスワード"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="login-button"
                        disabled={loading}
                    >
                        {loading ? (
                            <span>ログイン中...</span>
                        ) : (
                            <>
                                <FaSignInAlt className="icon" />
                                ログイン
                            </>
                        )}
                    </button>
                </form>

                <div className="login-footer">
                    <p>デフォルトアカウント</p>
                    <p>ユーザー名: admin / パスワード: admin123</p>

                    {/* デバッグ情報 */}
                    <button
                        type="button"
                        className="debug-button"
                        onClick={() => setShowDebug(!showDebug)}
                    >
                        <FaBug className="icon" />
                        デバッグ情報
                    </button>

                    {showDebug && (
                        <div className="debug-info">
                            <h4>デバッグ情報</h4>
                            <p>認証状態: {isAuthenticated ? '認証済み' : '未認証'}</p>
                            <p>ローディング: {authLoading ? '読み込み中' : '完了'}</p>
                            <p>トークン: {localStorage.getItem('token') ? '存在' : 'なし'}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;
