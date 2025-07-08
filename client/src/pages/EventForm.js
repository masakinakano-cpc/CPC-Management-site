import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FaSave,
    FaArrowLeft,
    FaCalendarAlt,
    FaMapMarkerAlt,
    FaUsers,
    FaClipboard,
    FaExclamationTriangle
} from 'react-icons/fa';
import { eventApi, municipalityApi, developmentAreaApi, venueHistoryApi, schoolApi } from '../services/api';
import { toast } from 'react-toastify';
import './EventForm.css';

const EventForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = Boolean(id);

    const [formData, setFormData] = useState({
        eventYear: new Date().getFullYear(),
        eventMonth: new Date().getMonth() + 1,
        lineCount: '',
        eventStatus: '企画中',
        flyerDistributionStartDate: '',
        venue: '',
        notes: '',
        municipalityId: '',
        developmentAreaId: '',
        venueHistoryId: '',
        schoolId: ''
    });

    const [loading, setLoading] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});

    // 選択肢データ
    const [municipalities, setMunicipalities] = useState([]);
    const [developmentAreas, setDevelopmentAreas] = useState([]);
    const [venueHistories, setVenueHistories] = useState([]);
    const [schools, setSchools] = useState([]);

    useEffect(() => {
        loadSelectOptions();
        if (isEditing) {
            loadEvent();
        }
    }, [id, isEditing]);

    const loadSelectOptions = async () => {
        try {
            const [municipalitiesRes, developmentAreasRes, venueHistoriesRes, schoolsRes] = await Promise.all([
                municipalityApi.getAll(),
                developmentAreaApi.getAll(),
                venueHistoryApi.getAll(),
                schoolApi.getAll()
            ]);

            setMunicipalities(municipalitiesRes.data.municipalities || []);
            setDevelopmentAreas(developmentAreasRes.data.developmentAreas || []);
            setVenueHistories(venueHistoriesRes.data.venueHistories || []);
            setSchools(schoolsRes.data.schools || []);
        } catch (error) {
            console.error('Failed to load select options:', error);
            toast.error('選択肢の読み込みに失敗しました');
        }
    };

    const loadEvent = async () => {
        try {
            setLoading(true);
            const response = await eventApi.getById(id);
            const event = response.data;

            setFormData({
                eventYear: event.eventYear,
                eventMonth: event.eventMonth,
                lineCount: event.lineCount,
                eventStatus: event.eventStatus,
                flyerDistributionStartDate: event.flyerDistributionStartDate
                    ? new Date(event.flyerDistributionStartDate).toISOString().split('T')[0]
                    : '',
                venue: event.venue || '',
                notes: event.notes || '',
                municipalityId: event.municipalityId || '',
                developmentAreaId: event.developmentAreaId || '',
                venueHistoryId: event.venueHistoryId || '',
                schoolId: event.schoolId || ''
            });
        } catch (error) {
            console.error('Failed to load event:', error);
            toast.error('開催予定の読み込みに失敗しました');
            navigate('/events');
        } finally {
            setLoading(false);
        }
    };

    const validateForm = () => {
        const errors = {};

        if (!formData.eventYear) {
            errors.eventYear = '開催年は必須です';
        }
        if (!formData.eventMonth) {
            errors.eventMonth = '開催月は必須です';
        }
        if (!formData.lineCount) {
            errors.lineCount = 'ライン数は必須です';
        } else if (formData.lineCount < 1 || formData.lineCount > 999) {
            errors.lineCount = 'ライン数は1〜999の範囲で入力してください';
        }
        if (!formData.eventStatus) {
            errors.eventStatus = 'ステータスは必須です';
        }
        if (!formData.municipalityId) {
            errors.municipalityId = '開催地は必須です';
        }
        if (!formData.venue) {
            errors.venue = '会場は必須です';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // リアルタイムバリデーション
        if (validationErrors[name]) {
            setValidationErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('入力内容にエラーがあります');
            return;
        }

        try {
            setSaveLoading(true);
            const submitData = {
                ...formData,
                lineCount: parseInt(formData.lineCount),
                flyerDistributionStartDate: formData.flyerDistributionStartDate || null,
                municipalityId: formData.municipalityId || null,
                developmentAreaId: formData.developmentAreaId || null,
                venueHistoryId: formData.venueHistoryId || null,
                schoolId: formData.schoolId || null
            };

            if (isEditing) {
                await eventApi.update(id, submitData);
                toast.success('開催予定を更新しました');
            } else {
                await eventApi.create(submitData);
                toast.success('開催予定を作成しました');
            }

            navigate('/events');
        } catch (error) {
            console.error('Failed to save event:', error);
            toast.error(isEditing ? '更新に失敗しました' : '作成に失敗しました');
        } finally {
            setSaveLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/events');
    };

    // 推奨会場の取得
    const getRecommendedVenues = () => {
        return venueHistories.filter(venue => venue.isRecommended).slice(0, 5);
    };

    if (loading) {
        return (
            <div className="event-form">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>開催予定を読み込み中...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="event-form">
            <div className="form-header">
                <div className="header-left">
                    <button onClick={handleCancel} className="btn btn-outline">
                        <FaArrowLeft /> 戻る
                    </button>
                    <h1>{isEditing ? '開催予定編集' : '新規開催予定'}</h1>
                </div>
                <div className="header-actions">
                    <button
                        onClick={handleSubmit}
                        disabled={saveLoading}
                        className="btn btn-primary"
                    >
                        {saveLoading ? (
                            <>
                                <div className="spinner-sm"></div>
                                保存中...
                            </>
                        ) : (
                            <>
                                <FaSave /> 保存
                            </>
                        )}
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="event-form-content">
                <div className="form-grid">
                    {/* 基本情報 */}
                    <div className="form-section">
                        <h2>
                            <FaCalendarAlt />
                            基本情報
                        </h2>

                        <div className="form-row">
                            <div className="form-group">
                                <label>開催年 *</label>
                                <select
                                    name="eventYear"
                                    value={formData.eventYear}
                                    onChange={handleInputChange}
                                    className={`form-control ${validationErrors.eventYear ? 'error' : ''}`}
                                >
                                    {[2024, 2025, 2026].map(year => (
                                        <option key={year} value={year}>{year}年</option>
                                    ))}
                                </select>
                                {validationErrors.eventYear && (
                                    <span className="error-message">
                                        <FaExclamationTriangle />
                                        {validationErrors.eventYear}
                                    </span>
                                )}
                            </div>

                            <div className="form-group">
                                <label>開催月 *</label>
                                <select
                                    name="eventMonth"
                                    value={formData.eventMonth}
                                    onChange={handleInputChange}
                                    className={`form-control ${validationErrors.eventMonth ? 'error' : ''}`}
                                >
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                        <option key={month} value={month}>{month}月</option>
                                    ))}
                                </select>
                                {validationErrors.eventMonth && (
                                    <span className="error-message">
                                        <FaExclamationTriangle />
                                        {validationErrors.eventMonth}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>ライン数 *</label>
                                <input
                                    type="number"
                                    name="lineCount"
                                    value={formData.lineCount}
                                    onChange={handleInputChange}
                                    min="1"
                                    max="999"
                                    className={`form-control ${validationErrors.lineCount ? 'error' : ''}`}
                                    placeholder="ライン数を入力"
                                />
                                {validationErrors.lineCount && (
                                    <span className="error-message">
                                        <FaExclamationTriangle />
                                        {validationErrors.lineCount}
                                    </span>
                                )}
                            </div>

                            <div className="form-group">
                                <label>ステータス *</label>
                                <select
                                    name="eventStatus"
                                    value={formData.eventStatus}
                                    onChange={handleInputChange}
                                    className={`form-control ${validationErrors.eventStatus ? 'error' : ''}`}
                                >
                                    <option value="企画中">企画中</option>
                                    <option value="準備中">準備中</option>
                                    <option value="実施済み">実施済み</option>
                                    <option value="過去開催">過去開催</option>
                                    <option value="中止">中止</option>
                                </select>
                                {validationErrors.eventStatus && (
                                    <span className="error-message">
                                        <FaExclamationTriangle />
                                        {validationErrors.eventStatus}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>チラシ配布開始日</label>
                            <input
                                type="date"
                                name="flyerDistributionStartDate"
                                value={formData.flyerDistributionStartDate}
                                onChange={handleInputChange}
                                className="form-control"
                            />
                        </div>
                    </div>

                    {/* 開催地情報 */}
                    <div className="form-section">
                        <h2>
                            <FaMapMarkerAlt />
                            開催地情報
                        </h2>

                        <div className="form-group">
                            <label>開催地 *</label>
                            <select
                                name="municipalityId"
                                value={formData.municipalityId}
                                onChange={handleInputChange}
                                className={`form-control ${validationErrors.municipalityId ? 'error' : ''}`}
                            >
                                <option value="">選択してください</option>
                                {municipalities.map(municipality => (
                                    <option key={municipality.id} value={municipality.id}>
                                        {municipality.name} ({municipality.prefectureName})
                                    </option>
                                ))}
                            </select>
                            {validationErrors.municipalityId && (
                                <span className="error-message">
                                    <FaExclamationTriangle />
                                    {validationErrors.municipalityId}
                                </span>
                            )}
                        </div>

                        <div className="form-group">
                            <label>会場 *</label>
                            <input
                                type="text"
                                name="venue"
                                value={formData.venue}
                                onChange={handleInputChange}
                                className={`form-control ${validationErrors.venue ? 'error' : ''}`}
                                placeholder="会場名を入力"
                            />
                            {validationErrors.venue && (
                                <span className="error-message">
                                    <FaExclamationTriangle />
                                    {validationErrors.venue}
                                </span>
                            )}
                        </div>

                        <div className="form-group">
                            <label>開拓地域</label>
                            <select
                                name="developmentAreaId"
                                value={formData.developmentAreaId}
                                onChange={handleInputChange}
                                className="form-control"
                            >
                                <option value="">選択してください</option>
                                {developmentAreas.map(area => (
                                    <option key={area.id} value={area.id}>
                                        {area.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* 関連情報 */}
                    <div className="form-section">
                        <h2>
                            <FaUsers />
                            関連情報
                        </h2>

                        <div className="form-group">
                            <label>会場履歴</label>
                            <select
                                name="venueHistoryId"
                                value={formData.venueHistoryId}
                                onChange={handleInputChange}
                                className="form-control"
                            >
                                <option value="">選択してください</option>
                                {venueHistories.map(venue => (
                                    <option key={venue.id} value={venue.id}>
                                        {venue.venueName} ({venue.capacity}人収容)
                                        {venue.isRecommended && ' ⭐'}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>学校</label>
                            <select
                                name="schoolId"
                                value={formData.schoolId}
                                onChange={handleInputChange}
                                className="form-control"
                            >
                                <option value="">選択してください</option>
                                {schools.map(school => (
                                    <option key={school.id} value={school.id}>
                                        {school.schoolName} ({school.cityName})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* 備考 */}
                    <div className="form-section full-width">
                        <h2>
                            <FaClipboard />
                            備考
                        </h2>

                        <div className="form-group">
                            <label>備考</label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                className="form-control"
                                rows="4"
                                placeholder="備考を入力"
                            />
                        </div>
                    </div>
                </div>

                {/* 推奨会場情報 */}
                {getRecommendedVenues().length > 0 && (
                    <div className="recommended-venues">
                        <h3>推奨会場</h3>
                        <div className="venues-grid">
                            {getRecommendedVenues().map(venue => (
                                <div key={venue.id} className="venue-card">
                                    <h4>{venue.venueName}</h4>
                                    <p className="venue-address">{venue.address}</p>
                                    <div className="venue-details">
                                        <span className="venue-capacity">収容人数: {venue.capacity}人</span>
                                        <span className="venue-type">{venue.venueType}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({
                                            ...prev,
                                            venue: venue.venueName,
                                            venueHistoryId: venue.id
                                        }))}
                                        className="btn btn-outline btn-sm"
                                    >
                                        この会場を選択
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
};

export default EventForm;
