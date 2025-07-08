import React, { useState, useEffect } from 'react';
import MasterTable from '../components/MasterTable';
import apiService from '../services/apiService';
import './MasterManagement.css';

const DevelopmentAreaManagement = () => {
    const [developmentAreas, setDevelopmentAreas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingArea, setEditingArea] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        region: '',
        description: '',
        priority: 'medium',
        isActive: true,
        notes: ''
    });

    // 列定義
    const columns = [
        { key: 'id', label: 'ID', sortable: true, className: 'text-center' },
        { key: 'name', label: '開拓地域名', sortable: true },
        { key: 'region', label: '地域', sortable: true },
        { key: 'description', label: '説明', sortable: false },
        {
            key: 'priority',
            label: '優先度',
            sortable: true,
            render: (value) => {
                const priorityMap = {
                    high: '高',
                    medium: '中',
                    low: '低'
                };
                const className = `priority-${value}`;
                return <span className={className}>{priorityMap[value] || value}</span>;
            }
        },
        {
            key: 'isActive',
            label: 'ステータス',
            sortable: true,
            render: (value) => (
                <span className={value ? 'status-active' : 'status-inactive'}>
                    {value ? 'アクティブ' : '非アクティブ'}
                </span>
            )
        },
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
            key: 'region',
            label: '地域',
            options: [
                { value: '関西', label: '関西' },
                { value: '東海', label: '東海' }
            ]
        },
        {
            key: 'priority',
            label: '優先度',
            options: [
                { value: 'high', label: '高' },
                { value: 'medium', label: '中' },
                { value: 'low', label: '低' }
            ]
        },
        {
            key: 'isActive',
            label: 'ステータス',
            options: [
                { value: 'true', label: 'アクティブ' },
                { value: 'false', label: '非アクティブ' }
            ]
        }
    ];

    // データ取得
    const fetchDevelopmentAreas = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiService.get('/development-areas');
            setDevelopmentAreas(response.data);
        } catch (err) {
            setError('データの取得に失敗しました。');
            console.error('Failed to fetch development areas:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDevelopmentAreas();
    }, []);

    // フォームの初期化
    const resetForm = () => {
        setFormData({
            name: '',
            region: '',
            description: '',
            priority: 'medium',
            isActive: true,
            notes: ''
        });
        setEditingArea(null);
        setShowForm(false);
    };

    // 新規追加
    const handleAdd = () => {
        resetForm();
        setShowForm(true);
    };

    // 編集
    const handleEdit = (area) => {
        setEditingArea(area);
        setFormData({
            name: area.name || '',
            region: area.region || '',
            description: area.description || '',
            priority: area.priority || 'medium',
            isActive: area.isActive !== undefined ? area.isActive : true,
            notes: area.notes || ''
        });
        setShowForm(true);
    };

    // 削除
    const handleDelete = async (area) => {
        if (!window.confirm(`${area.name}を削除してもよろしいですか？`)) {
            return;
        }

        try {
            await apiService.delete(`/development-areas/${area.id}`);
            setDevelopmentAreas(prev => prev.filter(a => a.id !== area.id));
        } catch (err) {
            alert('削除に失敗しました。');
            console.error('Failed to delete development area:', err);
        }
    };

    // フォーム送信
    const handleSubmit = async (e) => {
        e.preventDefault();

        // バリデーション
        if (!formData.name.trim()) {
            alert('開拓地域名を入力してください。');
            return;
        }
        if (!formData.region.trim()) {
            alert('地域を選択してください。');
            return;
        }

        try {
            const submitData = {
                ...formData,
                isActive: Boolean(formData.isActive)
            };

            if (editingArea) {
                // 更新
                const response = await apiService.put(`/development-areas/${editingArea.id}`, submitData);
                setDevelopmentAreas(prev =>
                    prev.map(a => a.id === editingArea.id ? response.data : a)
                );
            } else {
                // 新規作成
                const response = await apiService.post('/development-areas', submitData);
                setDevelopmentAreas(prev => [...prev, response.data]);
            }

            resetForm();
        } catch (err) {
            alert('保存に失敗しました。');
            console.error('Failed to save development area:', err);
        }
    };

    // フォーム入力変更
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    return (
        <div className="master-management-container">
            <MasterTable
                title="開拓地域管理"
                data={developmentAreas}
                columns={columns}
                loading={loading}
                error={error}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onRefresh={fetchDevelopmentAreas}
                searchPlaceholder="開拓地域名で検索..."
                filters={filters}
                pageSize={15}
            />

            {/* フォームモーダル */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>{editingArea ? '開拓地域編集' : '開拓地域追加'}</h3>
                            <button className="close-btn" onClick={resetForm}>×</button>
                        </div>

                        <form onSubmit={handleSubmit} className="master-form">
                            <div className="form-group">
                                <label htmlFor="name">開拓地域名 *</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="例: 北摂エリア"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="region">地域 *</label>
                                <select
                                    id="region"
                                    name="region"
                                    value={formData.region}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">選択してください</option>
                                    <option value="関西">関西</option>
                                    <option value="東海">東海</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">説明</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows="3"
                                    placeholder="開拓地域の特徴や注意点を入力..."
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="priority">優先度</label>
                                <select
                                    id="priority"
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleInputChange}
                                >
                                    <option value="high">高</option>
                                    <option value="medium">中</option>
                                    <option value="low">低</option>
                                </select>
                            </div>

                            <div className="form-group checkbox-group">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleInputChange}
                                />
                                <label htmlFor="isActive">アクティブ</label>
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
                                    {editingArea ? '更新' : '追加'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DevelopmentAreaManagement;
