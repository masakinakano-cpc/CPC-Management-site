import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    FaTachometerAlt,
    FaCalendarAlt,
    FaMapMarkerAlt,
    FaBuilding,
    FaSchool,
    FaChartBar,
    FaPlus,
    FaChevronDown,
    FaChevronRight
} from 'react-icons/fa';
import './Sidebar.css';

const Sidebar = () => {
    const location = useLocation();
    const [expandedMenu, setExpandedMenu] = useState('events');

    const toggleMenu = (menuKey) => {
        setExpandedMenu(expandedMenu === menuKey ? null : menuKey);
    };

    const isActive = (path) => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    const menuItems = [
        {
            key: 'dashboard',
            title: 'ダッシュボード',
            icon: <FaTachometerAlt />,
            path: '/dashboard'
        },
        {
            key: 'events',
            title: '開催予定管理',
            icon: <FaCalendarAlt />,
            items: [
                { title: '開催予定一覧', path: '/events' },
                { title: '新規開催予定', path: '/events/new' },
                { title: 'カレンダー表示', path: '/calendar' }
            ]
        },
        {
            key: 'masters',
            title: 'マスタ管理',
            icon: <FaBuilding />,
            items: [
                { title: '市区町村', path: '/masters/municipalities' },
                { title: '開拓地域', path: '/masters/development-areas' },
                { title: '実施リスト', path: '/masters/venue-histories' },
                { title: '全国小学校', path: '/masters/schools' }
            ]
        },
        {
            key: 'reports',
            title: 'レポート・分析',
            icon: <FaChartBar />,
            path: '/reports'
        }
    ];

    const renderMenuItem = (item) => {
        if (item.items) {
            const hasActiveChild = item.items.some(child => isActive(child.path));
            const isExpanded = expandedMenu === item.key;

            return (
                <div key={item.key} className="menu-item-group">
                    <button
                        className={`menu-item expandable ${hasActiveChild ? 'active' : ''}`}
                        onClick={() => toggleMenu(item.key)}
                    >
                        <span className="menu-icon">{item.icon}</span>
                        <span className="menu-title">{item.title}</span>
                        <span className="expand-icon">
                            {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
                        </span>
                    </button>

                    {isExpanded && (
                        <div className="submenu">
                            {item.items.map((subItem, index) => (
                                <Link
                                    key={index}
                                    to={subItem.path}
                                    className={`submenu-item ${isActive(subItem.path) ? 'active' : ''}`}
                                >
                                    {subItem.title}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <Link
                key={item.key}
                to={item.path}
                className={`menu-item ${isActive(item.path) ? 'active' : ''}`}
            >
                <span className="menu-icon">{item.icon}</span>
                <span className="menu-title">{item.title}</span>
            </Link>
        );
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <h3>メニュー</h3>
            </div>

            <nav className="sidebar-nav">
                {menuItems.map(renderMenuItem)}
            </nav>

            <div className="sidebar-footer">
                <Link to="/events/new" className="quick-action-button">
                    <FaPlus />
                    <span>新規開催予定</span>
                </Link>
            </div>
        </aside>
    );
};

export default Sidebar;
