import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    FaArrowLeft,
    FaEdit,
    FaTrash,
    FaCalendarAlt,
    FaMapMarkerAlt,
    FaUsers,
    FaClipboard,
    FaBuilding,
    FaSchool,
    FaChartLine,
    FaExclamationTriangle
} from 'react-icons/fa';
import { eventApi } from '../services/api';
import { toast } from 'react-toastify';
import './EventDetail.css';

const EventDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        loadEvent();
    }, [id]);

    const loadEvent = async () => {
        try {
            setLoading(true);
            const response = await eventApi.getById(id);
            setEvent(response.data);
        } catch (error) {
            console.error('Failed to load event:', error);
            toast.error('開催予定の読み込みに失敗しました');
            navigate('/events');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('この開催予定を削除しますか？\n削除すると元に戻せません。')) {
            return;
        }

        try {
            setDeleteLoading(true);
            await eventApi.delete(id);
            toast.success('開催予定を削除しました');
            navigate('/events');
        } catch (error) {
            console.error('Failed to delete event:', error);
            toast.error('削除に失敗しました');
        } finally {
            setDeleteLoading(false);
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

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="event-detail">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>開催予定を読み込み中...</p>
                </div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="event-detail">
                <div className="error-message">
                    <FaExclamationTriangle />
                    <p>開催予定が見つかりません</p>
                    <Link to="/events" className="btn btn-primary">
                        一覧に戻る
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="event-detail">
            <div className="detail-header">
                <div className="header-left">
                    <Link to="/events" className="btn btn-outline">
                        <FaArrowLeft /> 一覧に戻る
                    </Link>
                    <div className="event-title">
                        <h1>{event.eventYear}年{event.eventMonth}月 開催予定</h1>
                        <div className="event-subtitle">
                            <span className="location">
                                <FaMapMarkerAlt />
                                {event.municipality?.name}
                            </span>
                            {getStatusBadge(event.eventStatus)}
                        </div>
                    </div>
                </div>
                <div className="header-actions">
                    <Link to={`/events/${event.id}/edit`} className="btn btn-primary">
                        <FaEdit /> 編集
                    </Link>
                    <button
                        onClick={handleDelete}
                        disabled={deleteLoading}
                        className="btn btn-danger"
                    >
                        {deleteLoading ? (
                            <>
                                <div className="spinner-sm"></div>
                                削除中...
                            </>
                        ) : (
                            <>
                                <FaTrash /> 削除
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="detail-content">
                <div className="detail-grid">
                    {/* 基本情報 */}
                    <div className="detail-section">
                        <h2>
                            <FaCalendarAlt />
                            基本情報
                        </h2>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>開催年月</label>
                                <span className="value highlight">
                                    {event.eventYear}年{event.eventMonth}月
                                </span>
                            </div>
                            <div className="info-item">
                                <label>ライン数</label>
                                <span className="value line-count">
                                    {event.lineCount}
                                </span>
                            </div>
                            <div className="info-item">
                                <label>ステータス</label>
                                <span className="value">
                                    {getStatusBadge(event.eventStatus)}
                                </span>
                            </div>
                            <div className="info-item">
                                <label>チラシ配布開始日</label>
                                <span className="value">
                                    {formatDate(event.flyerDistributionStartDate)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 開催地情報 */}
                    <div className="detail-section">
                        <h2>
                            <FaMapMarkerAlt />
                            開催地情報
                        </h2>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>開催地</label>
                                <span className="value">
                                    {event.municipality?.name}
                                    <small>{event.municipality?.prefectureName}</small>
                                </span>
                            </div>
                            <div className="info-item">
                                <label>地方</label>
                                <span className="value">
                                    {event.municipality?.regionName}
                                </span>
                            </div>
                            <div className="info-item">
                                <label>人口カテゴリ</label>
                                <span className="value">
                                    {event.municipality?.populationCategory}
                                </span>
                            </div>
                            <div className="info-item">
                                <label>会場</label>
                                <span className="value venue-name">
                                    {event.venue}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 開拓地域情報 */}
                    {event.developmentArea && (
                        <div className="detail-section">
                            <h2>
                                <FaChartLine />
                                開拓地域情報
                            </h2>
                            <div className="info-grid">
                                <div className="info-item">
                                    <label>開拓地域</label>
                                    <span className="value">
                                        {event.developmentArea.name}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <label>開拓ステータス</label>
                                    <span className="value">
                                        {event.developmentArea.developmentStatus}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <label>目標ライン数</label>
                                    <span className="value">
                                        {event.developmentArea.targetLineCount}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <label>現在ライン数</label>
                                    <span className="value">
                                        {event.developmentArea.currentLineCount}
                                    </span>
                                </div>
                            </div>
                            {event.developmentArea.description && (
                                <div className="description">
                                    <label>説明</label>
                                    <p>{event.developmentArea.description}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 会場履歴情報 */}
                    {event.venueHistory && (
                        <div className="detail-section">
                            <h2>
                                <FaBuilding />
                                会場履歴情報
                            </h2>
                            <div className="info-grid">
                                <div className="info-item">
                                    <label>会場名</label>
                                    <span className="value">
                                        {event.venueHistory.venueName}
                                        {event.venueHistory.isRecommended && (
                                            <span className="recommended">⭐ 推奨</span>
                                        )}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <label>住所</label>
                                    <span className="value">
                                        {event.venueHistory.address}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <label>収容人数</label>
                                    <span className="value">
                                        {event.venueHistory.capacity}人
                                    </span>
                                </div>
                                <div className="info-item">
                                    <label>会場タイプ</label>
                                    <span className="value">
                                        {event.venueHistory.venueType}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <label>最終使用日</label>
                                    <span className="value">
                                        {formatDate(event.venueHistory.lastUsedDate)}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <label>満足度</label>
                                    <span className="value">
                                        {'★'.repeat(event.venueHistory.satisfaction)}
                                        {'☆'.repeat(5 - event.venueHistory.satisfaction)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 学校情報 */}
                    {event.school && (
                        <div className="detail-section">
                            <h2>
                                <FaSchool />
                                学校情報
                            </h2>
                            <div className="info-grid">
                                <div className="info-item">
                                    <label>学校名</label>
                                    <span className="value">
                                        {event.school.schoolName}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <label>住所</label>
                                    <span className="value">
                                        {event.school.address}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <label>生徒数</label>
                                    <span className="value">
                                        {event.school.studentCount}人
                                    </span>
                                </div>
                                <div className="info-item">
                                    <label>学校タイプ</label>
                                    <span className="value">
                                        {event.school.schoolType}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <label>施設</label>
                                    <span className="value">
                                        {event.school.hasGym && '体育館 '}
                                        {event.school.hasAuditorium && '講堂'}
                                        {!event.school.hasGym && !event.school.hasAuditorium && '-'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 備考 */}
                    {event.notes && (
                        <div className="detail-section full-width">
                            <h2>
                                <FaClipboard />
                                備考
                            </h2>
                            <div className="notes-content">
                                <p>{event.notes}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* 関連統計 */}
                <div className="statistics-section">
                    <h2>
                        <FaUsers />
                        関連統計
                    </h2>
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-label">開催回数</div>
                            <div className="stat-value">{event.eventCount || 0}</div>
                            <div className="stat-unit">回</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">累計ライン数</div>
                            <div className="stat-value">{event.totalLineCount || 0}</div>
                            <div className="stat-unit">ライン</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">平均ライン数</div>
                            <div className="stat-value">{event.avgLineCount || 0}</div>
                            <div className="stat-unit">ライン</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">進捗率</div>
                            <div className="stat-value">
                                {event.developmentArea
                                    ? Math.round((event.developmentArea.currentLineCount / event.developmentArea.targetLineCount) * 100)
                                    : 0
                                }
                            </div>
                            <div className="stat-unit">%</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetail;
