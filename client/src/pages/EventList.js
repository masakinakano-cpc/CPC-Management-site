import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    FaPlus,
    FaEdit,
    FaEye,
    FaTrash,
    FaSearch,
    FaFilter,
    FaCalendarAlt,
    FaMapMarkerAlt,
    FaSort,
    FaSortUp,
    FaSortDown
} from 'react-icons/fa';
import { eventApi } from '../services/api';
import './EventList.css';

const EventList = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        eventStatus: '',
        eventYear: new Date().getFullYear(),
        eventMonth: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
    });
    const [sortConfig, setSortConfig] = useState({
        key: 'eventYear',
        direction: 'desc'
    });
    const [viewMode, setViewMode] = useState('table'); // 'table' | 'card'

    useEffect(() => {
        loadEvents();
    }, [filters, pagination.page, sortConfig]);

    const loadEvents = async () => {
        try {
            setLoading(true);
            const params = {
                ...filters,
                page: pagination.page,
                limit: pagination.limit,
                sortBy: sortConfig.key,
                sortOrder: sortConfig.direction
            };

            const response = await eventApi.getAll(params);
            setEvents(response.data.events);
            setPagination(prev => ({
                ...prev,
                total: response.data.pagination.total,
                totalPages: response.data.pagination.totalPages
            }));
        } catch (error) {
            console.error('Failed to load events:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handlePageChange = (page) => {
        setPagination(prev => ({ ...prev, page }));
    };

    const handleDelete = async (id) => {
        if (!window.confirm('この開催予定を削除しますか？')) return;

        try {
            await eventApi.delete(id);
            loadEvents();
        } catch (error) {
            console.error('Failed to delete event:', error);
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            '企画中': { class: 'planning', label: '企画中' },
            '準備中': { class: 'preparing', label: '準備中' },
            '実施済み': { class: 'completed', label: '実施済み' },
            '過去開催': { class: 'past', label: '過去開催' },
            '中止': { class: 'cancelled', label: '中止' }
        };

        const config = statusConfig[status] || { class: 'default', label: status };
        return <span className={`status-badge ${config.class}`}>{config.label}</span>;
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <FaSort />;
        return sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />;
    };

    const renderTableView = () => (
        <div className="table-container">
            <table className="events-table">
                <thead>
                    <tr>
                        <th onClick={() => handleSort('eventYear')} className="sortable">
                            開催年月 {getSortIcon('eventYear')}
                        </th>
                        <th onClick={() => handleSort('municipality.name')} className="sortable">
                            開催地 {getSortIcon('municipality.name')}
                        </th>
                        <th onClick={() => handleSort('lineCount')} className="sortable">
                            ライン数 {getSortIcon('lineCount')}
                        </th>
                        <th onClick={() => handleSort('eventStatus')} className="sortable">
                            ステータス {getSortIcon('eventStatus')}
                        </th>
                        <th onClick={() => handleSort('venue')} className="sortable">
                            会場 {getSortIcon('venue')}
                        </th>
                        <th onClick={() => handleSort('flyerDistributionStartDate')} className="sortable">
                            チラシ配布日 {getSortIcon('flyerDistributionStartDate')}
                        </th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    {events.map((event) => (
                        <tr key={event.id}>
                            <td>
                                <div className="date-cell">
                                    <FaCalendarAlt className="date-icon" />
                                    {event.eventYear}年{event.eventMonth}月
                                </div>
                            </td>
                            <td>
                                <div className="location-cell">
                                    <FaMapMarkerAlt className="location-icon" />
                                    {event.municipality?.name}
                                    <span className="prefecture">{event.municipality?.prefectureName}</span>
                                </div>
                            </td>
                            <td className="line-count">{event.lineCount}</td>
                            <td>{getStatusBadge(event.eventStatus)}</td>
                            <td className="venue-name">{event.venue}</td>
                            <td className="flyer-date">
                                {event.flyerDistributionStartDate
                                    ? new Date(event.flyerDistributionStartDate).toLocaleDateString('ja-JP')
                                    : '-'
                                }
                            </td>
                            <td>
                                <div className="action-buttons">
                                    <Link
                                        to={`/events/${event.id}`}
                                        className="btn btn-outline btn-sm"
                                        title="詳細表示"
                                    >
                                        <FaEye />
                                    </Link>
                                    <Link
                                        to={`/events/${event.id}/edit`}
                                        className="btn btn-primary btn-sm"
                                        title="編集"
                                    >
                                        <FaEdit />
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(event.id)}
                                        className="btn btn-danger btn-sm"
                                        title="削除"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderCardView = () => (
        <div className="cards-grid">
            {events.map((event) => (
                <div key={event.id} className="event-card">
                    <div className="card-header">
                        <div className="event-date">
                            <FaCalendarAlt />
                            {event.eventYear}年{event.eventMonth}月
                        </div>
                        {getStatusBadge(event.eventStatus)}
                    </div>

                    <div className="card-body">
                        <div className="location">
                            <FaMapMarkerAlt />
                            <span>{event.municipality?.name}</span>
                            <small>{event.municipality?.prefectureName}</small>
                        </div>

                        <div className="event-details">
                            <div className="detail-item">
                                <label>ライン数:</label>
                                <span>{event.lineCount}</span>
                            </div>
                            <div className="detail-item">
                                <label>会場:</label>
                                <span>{event.venue}</span>
                            </div>
                            <div className="detail-item">
                                <label>チラシ配布:</label>
                                <span>
                                    {event.flyerDistributionStartDate
                                        ? new Date(event.flyerDistributionStartDate).toLocaleDateString('ja-JP')
                                        : '-'
                                    }
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="card-footer">
                        <div className="action-buttons">
                            <Link
                                to={`/events/${event.id}`}
                                className="btn btn-outline btn-sm"
                            >
                                <FaEye /> 詳細
                            </Link>
                            <Link
                                to={`/events/${event.id}/edit`}
                                className="btn btn-primary btn-sm"
                            >
                                <FaEdit /> 編集
                            </Link>
                            <button
                                onClick={() => handleDelete(event.id)}
                                className="btn btn-danger btn-sm"
                            >
                                <FaTrash /> 削除
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderPagination = () => {
        const pages = [];
        const maxVisiblePages = 5;
        const startPage = Math.max(1, pagination.page - Math.floor(maxVisiblePages / 2));
        const endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);

        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => handlePageChange(i)}
                    className={`pagination-btn ${i === pagination.page ? 'active' : ''}`}
                >
                    {i}
                </button>
            );
        }

        return (
            <div className="pagination">
                <button
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.page === 1}
                    className="pagination-btn"
                >
                    最初
                </button>
                <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="pagination-btn"
                >
                    前へ
                </button>
                {pages}
                <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="pagination-btn"
                >
                    次へ
                </button>
                <button
                    onClick={() => handlePageChange(pagination.totalPages)}
                    disabled={pagination.page === pagination.totalPages}
                    className="pagination-btn"
                >
                    最後
                </button>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="event-list">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>開催予定を読み込み中...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="event-list">
            <div className="page-header">
                <h1>開催予定一覧</h1>
                <div className="header-actions">
                    <Link to="/events/new" className="btn btn-primary">
                        <FaPlus /> 新規開催予定
                    </Link>
                </div>
            </div>

            {/* フィルター */}
            <div className="filters-panel">
                <div className="filter-group">
                    <div className="search-box">
                        <FaSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="会場名、開催地で検索..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            className="form-control"
                        />
                    </div>
                </div>

                <div className="filter-group">
                    <select
                        value={filters.eventStatus}
                        onChange={(e) => handleFilterChange('eventStatus', e.target.value)}
                        className="form-control"
                    >
                        <option value="">すべてのステータス</option>
                        <option value="企画中">企画中</option>
                        <option value="準備中">準備中</option>
                        <option value="実施済み">実施済み</option>
                        <option value="過去開催">過去開催</option>
                        <option value="中止">中止</option>
                    </select>
                </div>

                <div className="filter-group">
                    <select
                        value={filters.eventYear}
                        onChange={(e) => handleFilterChange('eventYear', e.target.value)}
                        className="form-control"
                    >
                        <option value="">すべての年</option>
                        {[2024, 2023, 2022].map(year => (
                            <option key={year} value={year}>{year}年</option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <select
                        value={filters.eventMonth}
                        onChange={(e) => handleFilterChange('eventMonth', e.target.value)}
                        className="form-control"
                    >
                        <option value="">すべての月</option>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                            <option key={month} value={month}>{month}月</option>
                        ))}
                    </select>
                </div>

                <div className="view-mode-toggle">
                    <button
                        onClick={() => setViewMode('table')}
                        className={`btn btn-outline ${viewMode === 'table' ? 'active' : ''}`}
                    >
                        テーブル
                    </button>
                    <button
                        onClick={() => setViewMode('card')}
                        className={`btn btn-outline ${viewMode === 'card' ? 'active' : ''}`}
                    >
                        カード
                    </button>
                </div>
            </div>

            {/* 結果情報 */}
            <div className="results-info">
                <span>
                    {pagination.total}件中 {(pagination.page - 1) * pagination.limit + 1}-
                    {Math.min(pagination.page * pagination.limit, pagination.total)}件を表示
                </span>
            </div>

            {/* コンテンツ */}
            <div className="events-content">
                {events.length === 0 ? (
                    <div className="no-events">
                        <p>開催予定が見つかりません</p>
                        <Link to="/events/new" className="btn btn-primary">
                            <FaPlus /> 新規開催予定を作成
                        </Link>
                    </div>
                ) : (
                    <>
                        {viewMode === 'table' ? renderTableView() : renderCardView()}
                        {pagination.totalPages > 1 && renderPagination()}
                    </>
                )}
            </div>
        </div>
    );
};

export default EventList;
