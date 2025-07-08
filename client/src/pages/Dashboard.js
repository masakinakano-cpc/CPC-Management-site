import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    FaCalendarAlt,
    FaMapMarkerAlt,
    FaBuilding,
    FaSchool,
    FaArrowUp,
    FaArrowDown,
    FaBell,
    FaPlus,
    FaChartLine
} from 'react-icons/fa';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { dashboardApi } from '../services/api';
import './Dashboard.css';

// Chart.js登録
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const [statsRes, notificationsRes, recentRes] = await Promise.all([
                dashboardApi.getStats(),
                dashboardApi.getNotifications(),
                dashboardApi.getRecentActivity()
            ]);

            setStats(statsRes.data);
            setNotifications(notificationsRes.data);
            setRecentActivity(recentRes.data);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat('ja-JP').format(num || 0);
    };

    const getStatusColor = (status) => {
        const colors = {
            '企画中': '#FFA500',
            '準備中': '#FFD700',
            '実施済み': '#32CD32',
            '過去開催': '#87CEEB',
            '中止': '#FF6B6B'
        };
        return colors[status] || '#999999';
    };

    if (loading) {
        return (
            <div className="dashboard">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>ダッシュボードを読み込み中...</p>
                </div>
            </div>
        );
    }

    // グラフデータの準備
    const monthlyLinesData = {
        labels: stats?.monthlyLines?.map(item => `${item.eventYear}年${item.eventMonth}月`) || [],
        datasets: [
            {
                label: 'ライン数',
                data: stats?.monthlyLines?.map(item => item.totalLines) || [],
                borderColor: '#2196F3',
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                tension: 0.4,
                fill: true
            }
        ]
    };

    const statusStatsData = {
        labels: stats?.statusStats?.map(item => item.eventStatus) || [],
        datasets: [
            {
                data: stats?.statusStats?.map(item => item.count) || [],
                backgroundColor: stats?.statusStats?.map(item => getStatusColor(item.eventStatus)) || [],
                borderWidth: 2,
                borderColor: '#fff'
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom'
            }
        }
    };

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>ダッシュボード</h1>
                <div className="dashboard-actions">
                    <Link to="/events/new" className="btn btn-primary">
                        <FaPlus /> 新規開催予定
                    </Link>
                </div>
            </div>

            {/* 統計カード */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">
                        <FaCalendarAlt />
                    </div>
                    <div className="stat-content">
                        <h3>{formatNumber(stats?.basicStats?.totalEvents)}</h3>
                        <p>総開催予定数</p>
                        <div className="stat-change positive">
                            <FaArrowUp />
                            今年: {formatNumber(stats?.basicStats?.thisYearEvents)}
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <FaMapMarkerAlt />
                    </div>
                    <div className="stat-content">
                        <h3>{formatNumber(stats?.basicStats?.totalMunicipalities)}</h3>
                        <p>登録市区町村数</p>
                        <div className="stat-change">
                            対応地域数
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <FaChartLine />
                    </div>
                    <div className="stat-content">
                        <h3>{formatNumber(stats?.basicStats?.thisYearLines)}</h3>
                        <p>今年のライン数</p>
                        <div className="stat-change positive">
                            <FaArrowUp />
                            今月: {formatNumber(stats?.basicStats?.thisMonthEvents)}件
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <FaBell />
                    </div>
                    <div className="stat-content">
                        <h3>{formatNumber(stats?.basicStats?.nextMonthEvents)}</h3>
                        <p>来月の開催予定</p>
                        <div className="stat-change">
                            準備が必要
                        </div>
                    </div>
                </div>
            </div>

            {/* チャートセクション */}
            <div className="charts-grid">
                <div className="chart-card">
                    <div className="chart-header">
                        <h3>月別ライン数推移</h3>
                    </div>
                    <div className="chart-container">
                        <Line data={monthlyLinesData} options={chartOptions} />
                    </div>
                </div>

                <div className="chart-card">
                    <div className="chart-header">
                        <h3>開催ステータス別分布</h3>
                    </div>
                    <div className="chart-container">
                        <Doughnut data={statusStatsData} options={chartOptions} />
                    </div>
                </div>
            </div>

            {/* 通知とアクティビティ */}
            <div className="dashboard-bottom">
                <div className="notifications-card">
                    <div className="card-header">
                        <h3>
                            <FaBell />
                            通知・アラート
                        </h3>
                    </div>
                    <div className="notifications-list">
                        {notifications.upcomingFlyerEvents?.length > 0 ? (
                            <>
                                <h4>チラシ配布予定</h4>
                                {notifications.upcomingFlyerEvents.map((event, index) => (
                                    <div key={index} className="notification-item urgent">
                                        <div className="notification-content">
                                            <span className="notification-title">
                                                {event.municipality?.name} - チラシ配布開始
                                            </span>
                                            <span className="notification-date">
                                                {new Date(event.flyerDistributionStartDate).toLocaleDateString('ja-JP')}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </>
                        ) : (
                            <div className="no-notifications">
                                現在、緊急の通知はありません
                            </div>
                        )}
                    </div>
                </div>

                <div className="recent-activity-card">
                    <div className="card-header">
                        <h3>最近の活動</h3>
                        <Link to="/events" className="view-all-link">
                            すべて表示
                        </Link>
                    </div>
                    <div className="activity-list">
                        {recentActivity.slice(0, 5).map((event, index) => (
                            <div key={index} className="activity-item">
                                <div className="activity-content">
                                    <span className="activity-title">
                                        {event.municipality?.name} - {event.eventYear}年{event.eventMonth}月
                                    </span>
                                    <span className="activity-status">
                                        {event.eventStatus}
                                    </span>
                                </div>
                                <div className="activity-meta">
                                    <span className="activity-lines">
                                        {event.lineCount}ライン
                                    </span>
                                    <span className="activity-date">
                                        {new Date(event.updatedAt).toLocaleDateString('ja-JP')}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
