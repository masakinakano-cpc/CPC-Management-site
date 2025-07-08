import React, { useState, useEffect } from 'react';
import MasterTable from '../components/MasterTable';
import apiService from '../services/apiService';
import './MasterManagement.css';

const VenueHistoryManagement = () => {
    const [venueHistories, setVenueHistories] = useState([]);
    const [municipalities, setMunicipalities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingVenue, setEditingVenue] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        municipalityId: '',
        capacity: '',
        facilities: '',
        accessInfo: '',
        contactInfo: '',
        notes: ''
    });

    // 列定義
    const columns = [
        { key: 'id', label: 'ID', sortable: true, className: 'text-center' },
        { key: 'name', label: '会場名', sortable: true },
        { key: 'address', label: '住所', sortable: false },
        {
            key: 'Municipality.name',
            label: '市区町村',
            sortable: true,
            render: (value, item) => item.Municipality?.name || '-'
        },
        {
            key: 'capacity',
            label: '定員',
            sortable: true,
            className: 'text-right',
            render: (value) => value ? `${value}名` : '-'
        },
        { key: 'facilities', label: '設備', sortable: false },
        {
            key: 'createdAt',
            label: '作成日',
            sortable: true,
            type: 'date'
        }
    ];

    // フィルタ定義
    const filters = [
        {
            key: 'Municipality.name',
            label: '市区町村',
            options: municipalities.map(m => ({
                value: m.name,
                label: m.name
            }))
        }
    ];

    // データ取得
    const fetchVenueHistories = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiService.get('/venue-histories');
            setVenueHistories(response.data);
        } catch (err) {
            setError('データの取得に失敗しました。');
            console.error('Failed to fetch venue histories:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMunicipalities = async () => {
        try {
            const response = await apiService.get('/municipalities');
            setMunicipalities(response.data);
        } catch (err) {
            console.error('Failed to fetch municipalities:', err);
        }
    };

    useEffect(() => {
        fetchVenueHistories();
        fetchMunicipalities();
    }, []);

    // フォームの初期化
    const resetForm = () => {
        setFormData({
            name: '',
            address: '',
            municipalityId: '',
            capacity: '',
            facilities: '',
            accessInfo: '',
            contactInfo: '',
            notes: ''
        });
        setEditingVenue(null);
        setShowForm(false);
    };

    // 新規追加
    const handleAdd = () => {
        resetForm();
        setShowForm(true);
    };

    // 編集
    const handleEdit = (venue) => {
        setEditingVenue(venue);
        setFormData({
            name: venue.name || '',
            address: venue.address || '',
            municipalityId: venue.municipalityId || '',
            capacity: venue.capacity || '',
            facilities: venue.facilities || '',
            accessInfo: venue.accessInfo || '',
            contactInfo: venue.contactInfo || '',
            notes: venue.notes || ''
        });
        setShowForm(true);
    };

    // 削除
    const handleDelete = async (venue) => {
        if (!window.confirm(`${venue.name}を削除してもよろしいですか？`)) {
            return;
        }

        try {
            await apiService.delete(`/venue-histories/${venue.id}`);
            setVenueHistories(prev => prev.filter(v => v.id !== venue.id));
        } catch (err) {
            alert('削除に失敗しました。');
            console.error('Failed to delete venue history:', err);
        }
    };

    // フォーム送信
    const handleSubmit = async (e) => {
        e.preventDefault();

        // バリデーション
        if (!formData.name.trim()) {
            alert('会場名を入力してください。');
            return;
        }
        if (!formData.address.trim()) {
            alert('住所を入力してください。');
            return;
        }
        if (!formData.municipalityId) {
            alert('市区町村を選択してください。');
            return;
        }

        try {
            const submitData = {
                ...formData,
                municipalityId: parseInt(formData.municipalityId, 10),
                capacity: formData.capacity ? parseInt(formData.capacity, 10) : null
            };

            if (editingVenue) {
                // 更新
                const response = await apiService.put(`/venue-histories/${editingVenue.id}`, submitData);
                setVenueHistories(prev =>
                    prev.map(v => v.id === editingVenue.id ? response.data : v)
                );
            } else {
                // 新規作成
                const response = await apiService.post('/venue-histories', submitData);
                setVenueHistories(prev => [...prev, response.data]);
            }

            resetForm();
        } catch (err) {
            alert('保存に失敗しました。');
            console.error('Failed to save venue history:', err);
        }
    };

    // フォーム入力変更
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="master-management-container">
            <MasterTable
                title="会場履歴管理"
                data={venueHistories}
                columns={columns}
                loading={loading}
                error={error}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onRefresh={fetchVenueHistories}
                searchPlaceholder="会場名で検索..."
                filters={filters}
                pageSize={15}
            />

            {/* フォームモーダル */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>{editingVenue ? '会場履歴編集' : '会場履歴追加'}</h3>
                            <button className="close-btn" onClick={resetForm}>×</button>
                        </div>

                        <form onSubmit={handleSubmit} className="master-form">
                            <div className="form-group">
                                <label htmlFor="name">会場名 *</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="例: 大阪市立中央会館"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="address">住所 *</label>
                                <input
                                    type="text"
                                    id="address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="例: 大阪市中央区本町1-1-1"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="municipalityId">市区町村 *</label>
                                <select
                                    id="municipalityId"
                                    name="municipalityId"
                                    value={formData.municipalityId}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">選択してください</option>
                                    {municipalities.map(municipality => (
                                        <option key={municipality.id} value={municipality.id}>
                                            {municipality.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="capacity">定員</label>
                                <input
                                    type="number"
                                    id="capacity"
                                    name="capacity"
                                    value={formData.capacity}
                                    onChange={handleInputChange}
                                    placeholder="例: 50"
                                    min="1"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="facilities">設備</label>
                                <textarea
                                    id="facilities"
                                    name="facilities"
                                    value={formData.facilities}
                                    onChange={handleInputChange}
                                    rows="3"
                                    placeholder="例: プロジェクター、マイク、Wi-Fi完備"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="accessInfo">アクセス情報</label>
                                <textarea
                                    id="accessInfo"
                                    name="accessInfo"
                                    value={formData.accessInfo}
                                    onChange={handleInputChange}
                                    rows="3"
                                    placeholder="例: 地下鉄本町駅から徒歩5分"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="contactInfo">連絡先</label>
                                <textarea
                                    id="contactInfo"
                                    name="contactInfo"
                                    value={formData.contactInfo}
                                    onChange={handleInputChange}
                                    rows="2"
                                    placeholder="例: 06-1234-5678"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="notes">備考</label>
                                <textarea
                                    id="notes"
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    rows="3"
                                    placeholder="必要に応じて備考を入力..."
                                />
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                                    キャンセル
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingVenue ? '更新' : '追加'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VenueHistoryManagement;
