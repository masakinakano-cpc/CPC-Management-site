import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaBell, FaUser, FaCog, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import './Header.css';

const Header = () => {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        toast.success('ログアウトしました');
        navigate('/login');
        setShowUserMenu(false);
    };

    const toggleUserMenu = () => {
        setShowUserMenu(!showUserMenu);
    };

    return (
        <header className="header">
            <div className="header-container">
                <div className="header-left">
                    <Link to="/" className="logo">
                        <h1>開催予定管理システム</h1>
                    </Link>
                </div>

                <div className="header-center">
                    <nav className="main-nav">
                        <Link to="/dashboard" className="nav-link">
                            ダッシュボード
                        </Link>
                        <Link to="/events" className="nav-link">
                            開催予定
                        </Link>
                        <Link to="/calendar" className="nav-link">
                            カレンダー
                        </Link>
                        <Link to="/reports" className="nav-link">
                            レポート
                        </Link>
                    </nav>
                </div>

                <div className="header-right">
                    <div className="header-actions">
                        <button className="icon-button notification-button">
                            <FaBell />
                            <span className="notification-badge">3</span>
                        </button>

                        <div className="user-menu">
                            <button
                                className="icon-button user-button"
                                onClick={toggleUserMenu}
                            >
                                <FaUser />
                            </button>
                            {showUserMenu && (
                                <div className="user-dropdown">
                                    <div className="user-info">
                                        <div className="user-name">{user?.username || '管理者'}</div>
                                        <div className="user-role">{user?.role === 'admin' ? 'システム管理者' : '一般ユーザー'}</div>
                                    </div>
                                    <div className="dropdown-divider"></div>
                                    <Link to="/settings" className="dropdown-item">
                                        <FaCog className="dropdown-icon" />
                                        設定
                                    </Link>
                                    <button
                                        className="dropdown-item"
                                        onClick={handleLogout}
                                    >
                                        <FaSignOutAlt className="dropdown-icon" />
                                        ログアウト
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
