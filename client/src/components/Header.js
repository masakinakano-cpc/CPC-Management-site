import React from 'react';
import { Link } from 'react-router-dom';
import { FaBell, FaUser, FaCog } from 'react-icons/fa';
import './Header.css';

const Header = () => {
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
                            <button className="icon-button user-button">
                                <FaUser />
                            </button>
                            <div className="user-dropdown">
                                <div className="user-info">
                                    <div className="user-name">管理者</div>
                                    <div className="user-role">システム管理者</div>
                                </div>
                                <div className="dropdown-divider"></div>
                                <button className="dropdown-item">
                                    <FaCog className="dropdown-icon" />
                                    設定
                                </button>
                                <button className="dropdown-item">
                                    ログアウト
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
