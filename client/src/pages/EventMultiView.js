import React, { useState, useEffect } from 'react';
import {
    FaTable,
    FaTh,
    FaCalendarAlt,
    FaChartLine,
    FaFilter,
    FaSearch,
    FaPlus,
    FaDownload,
    FaSync
} from 'react-icons/fa';
import { eventApi } from '../services/api';
import './EventMultiView.css';

// サブコンポーネントのインポート
const EventTableView = ({ events, onEventClick, onEventEdit, onEventDelete }) => (
    <div className="table-view">
        <div className="table-container">
            <table className="events-table">
                <thead>
                    <tr>
                        <th>開催年月</th>
                        <th>開催地</th>
                        <th>ライン数</th>
                        <th>ステータス</th>
                        <th>会場</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    {events.map(event => (
                        <tr key={event.id} onClick={() => onEventClick(event)}>
                            <td>{event.eventYear}年{event.eventMonth}月</td>
                            <td>{event.municipality?.name}</td>
                            <td>{event.lineCount}</td>
                            <td>
                                <span className={`status-badge status-${event.eventStatus}`}>
                                    {event.eventStatus}
                                </span>
                            </td>
                            <td>{event.venue}</td>
                            <td className="actions">
                                <button onClick={(e) => { e.stopPropagation(); onEventEdit(event); }}>
                                    編集
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); onEventDelete(event.id); }}>
                                    削除
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const EventCardView = ({ events, onEventClick, onEventEdit, onEventDelete }) => (
    <div className="card-view">
        <div className="cards-grid">
            {events.map(event => (
                <div key={event.id} className="event-card" onClick={() => onEventClick(event)}>
                    <div className="card-header">
                        <h3>{event.eventYear}年{event.eventMonth}月</h3>
                        <span className={`status-badge status-${event.eventStatus}`}>
                            {event.eventStatus}
                        </span>
                    </div>
                    <div className="card-body">
                        <div className="card-field">
                            <label>開催地:</label>
                            <span>{event.municipality?.name}</span>
                        </div>
                        <div className="card-field">
                            <label>ライン数:</label>
                            <span>{event.lineCount}</span>
                        </div>
                        <div className="card-field">
                            <label>会場:</label>
                            <span>{event.venue}</span>
                        </div>
                    </div>
                    <div className="card-actions">
                        <button onClick={(e) => { e.stopPropagation(); onEventEdit(event); }}>
                            編集
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onEventDelete(event.id); }}>
                            削除
                        </button>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const EventDashboardView = ({ events, stats }) => (
    <div className="dashboard-view">
        <div className="stats-grid">
            <div className="stat-card">
                <div className="stat-icon">
                    <FaCalendarAlt />
                </div>
                <div className="stat-content">
                    <h3>{stats.total}</h3>
                    <p>総開催予定数</p>
                </div>
            </div>
            <div className="stat-card">
                <div className="stat-icon">
                    <FaChartLine />
                </div>
                <div className="stat-content">
                    <h3>{stats.thisYear}</h3>
                    <p>今年度実施</p>
                </div>
            </div>
            <div className="stat-card">
                <div className="stat-icon">
                    <FaTh />
                </div>
                <div className="stat-content">
                    <h3>{stats.avgLineCount}</h3>
                    <p>平均ライン数</p>
                </div>
            </div>
        </div>

        <div className="chart-container">
            <h3>月別開催予定</h3>
            <div className="chart-placeholder">
                {/* Chart.js チャートがここに表示されます */}
                <p>グラフを表示するためのChart.js実装を追加できます</p>
            </div>
        </div>
    </div>
);

const EventMultiView = () => {
    const [events, setEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentView, setCurrentView] = useState('table');
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        status: '',
        year: '',
        month: ''
    });

    // 統計情報
    const [stats, setStats] = useState({
        total: 0,
        thisYear: 0,
        avgLineCount: 0
    });

    // データ取得
    useEffect(() => {
        fetchEvents();
    }, []);

    // フィルタリング
    useEffect(() => {
        applyFilters();
    }, [events, searchTerm, filters]);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const response = await eventApi.getAll();
            setEvents(response.data.events);
            calculateStats(response.data.events);
        } catch (err) {
            setError('データの取得に失敗しました');
            console.error('Error fetching events:', err);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (eventData) => {
        const currentYear = new Date().getFullYear();
        const thisYearEvents = eventData.filter(event => event.eventYear === currentYear);
        const avgLineCount = eventData.length > 0
            ? Math.round(eventData.reduce((sum, event) => sum + (event.lineCount || 0), 0) / eventData.length)
            : 0;

        setStats({
            total: eventData.length,
            thisYear: thisYearEvents.length,
            avgLineCount
        });
    };

    const applyFilters = () => {
        let filtered = events;

        // 検索フィルタ
        if (searchTerm) {
            filtered = filtered.filter(event =>
                event.municipality?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                event.venue?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // ステータスフィルタ
        if (filters.status) {
            filtered = filtered.filter(event => event.eventStatus === filters.status);
        }

        // 年フィルタ
        if (filters.year) {
            filtered = filtered.filter(event => event.eventYear === parseInt(filters.year));
        }

        // 月フィルタ
        if (filters.month) {
            filtered = filtered.filter(event => event.eventMonth === parseInt(filters.month));
        }

        setFilteredEvents(filtered);
    };

    const handleViewChange = (viewType) => {
        setCurrentView(viewType);
    };

    const handleEventClick = (event) => {
        // 詳細画面へ遷移
        window.open(`/events/${event.id}`, '_blank');
    };

    const handleEventEdit = (event) => {
        // 編集画面へ遷移
        window.open(`/events/${event.id}/edit`, '_blank');
    };

    const handleEventDelete = async (eventId) => {
        if (window.confirm('このイベントを削除しますか？')) {
            try {
                await eventApi.delete(eventId);
                fetchEvents(); // データを再取得
            } catch (err) {
                alert('削除に失敗しました');
            }
        }
    };

    const handleExport = () => {
        // CSVエクスポート機能
        const csvData = filteredEvents.map(event => ({
            '開催年月': `${event.eventYear}年${event.eventMonth}月`,
            '開催地': event.municipality?.name || '',
            'ライン数': event.lineCount || 0,
            'ステータス': event.eventStatus || '',
            '会場': event.venue || ''
        }));

        const csvContent = "data:text/csv;charset=utf-8,"
            + Object.keys(csvData[0]).join(",") + "\n"
            + csvData.map(row => Object.values(row).join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `events_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderCurrentView = () => {
        switch (currentView) {
            case 'table':
                return (
                    <EventTableView
                        events={filteredEvents}
                        onEventClick={handleEventClick}
                        onEventEdit={handleEventEdit}
                        onEventDelete={handleEventDelete}
                    />
                );
            case 'card':
                return (
                    <EventCardView
                        events={filteredEvents}
                        onEventClick={handleEventClick}
                        onEventEdit={handleEventEdit}
                        onEventDelete={handleEventDelete}
                    />
                );
            case 'dashboard':
                return (
                    <EventDashboardView
                        events={filteredEvents}
                        stats={stats}
                    />
                );
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="multi-view-container">
                <div className="loading">読み込み中...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="multi-view-container">
                <div className="error">{error}</div>
            </div>
        );
    }

    return (
        <div className="multi-view-container">
            <div className="multi-view-header">
                <div className="header-left">
                    <h1>開催予定管理</h1>
                    <div className="view-switcher">
                        <button
                            className={currentView === 'table' ? 'active' : ''}
                            onClick={() => handleViewChange('table')}
                        >
                            <FaTable /> テーブル
                        </button>
                        <button
                            className={currentView === 'card' ? 'active' : ''}
                            onClick={() => handleViewChange('card')}
                        >
                            <FaTh /> カード
                        </button>
                        <button
                            className={currentView === 'dashboard' ? 'active' : ''}
                            onClick={() => handleViewChange('dashboard')}
                        >
                            <FaChartLine /> ダッシュボード
                        </button>
                    </div>
                </div>

                <div className="header-actions">
                    <div className="search-box">
                        <FaSearch />
                        <input
                            type="text"
                            placeholder="検索..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-outline" onClick={handleExport}>
                        <FaDownload /> エクスポート
                    </button>
                    <button className="btn btn-outline" onClick={fetchEvents}>
                        <FaSync /> 更新
                    </button>
                    <button className="btn btn-primary" onClick={() => window.open('/events/new', '_blank')}>
                        <FaPlus /> 新規作成
                    </button>
                </div>
            </div>

            <div className="multi-view-filters">
                <div className="filter-group">
                    <label>ステータス</label>
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    >
                        <option value="">すべて</option>
                        <option value="企画中">企画中</option>
                        <option value="準備中">準備中</option>
                        <option value="実施中">実施中</option>
                        <option value="実施済み">実施済み</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label>年</label>
                    <select
                        value={filters.year}
                        onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                    >
                        <option value="">すべて</option>
                        {[...Array(5)].map((_, i) => {
                            const year = new Date().getFullYear() + i - 2;
                            return (
                                <option key={year} value={year}>{year}年</option>
                            );
                        })}
                    </select>
                </div>

                <div className="filter-group">
                    <label>月</label>
                    <select
                        value={filters.month}
                        onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                    >
                        <option value="">すべて</option>
                        {[...Array(12)].map((_, i) => (
                            <option key={i + 1} value={i + 1}>{i + 1}月</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="multi-view-content">
                {renderCurrentView()}
            </div>

            <div className="multi-view-footer">
                <div className="results-info">
                    {filteredEvents.length}件 / 全{events.length}件
                </div>
            </div>
        </div>
    );
};

export default EventMultiView;
