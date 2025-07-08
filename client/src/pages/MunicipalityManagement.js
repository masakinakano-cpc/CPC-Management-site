import React, { useState, useEffect } from 'react';
import MasterTable from '../components/MasterTable';
import apiService from '../services/apiService';
import './MasterManagement.css';

const MunicipalityManagement = () => {
    const [municipalities, setMunicipalities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingMunicipality, setEditingMunicipality] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        prefecture: '',
        region: '',
        population: '',
        notes: ''
    });

    // 列定義
    const columns = [
        { key: 'id', label: 'ID', sortable: true, className: 'text-center' },
        { key: 'name', label: '市区町村名', sortable: true },
        { key: 'prefecture', label: '都道府県', sortable: true },
        { key: 'region', label: '地域', sortable: true },
        {
            key: 'population',
            label: '人口',
            sortable: true,
            className: 'text-right',
            render: (value) => value ? value.toLocaleString() : '-'
        },
        {
            key: 'createdAt',
            label: '作成日',
            sortable: true,
            type: 'date'
        },
        {
            key: 'updatedAt',
            label: '更新日',
            sortable: true,
            type: 'date'
        }
    ];

    // フィルタ定義
    const filters = [
        {
            key: 'prefecture',
            label: '都道府県',
            options: [
                { value: '大阪府', label: '大阪府' },
                { value: '兵庫県', label: '兵庫県' },
                { value: '京都府', label: '京都府' },
                { value: '奈良県', label: '奈良県' },
                { value: '愛知県', label: '愛知県' }
            ]
        },
        {
            key: 'region',
            label: '地域',
            options: [
                { value: '関西', label: '関西' },
                { value: '東海', label: '東海' }
            ]
        }
    ];

    // データ取得
    const fetchMunicipalities = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiService.get('/municipalities');
            setMunicipalities(response.data);
        } catch (err) {
            setError('データの取得に失敗しました。');
            console.error('Failed to fetch municipalities:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMunicipalities();
    }, []);

    // フォームの初期化
    const resetForm = () => {
        setFormData({
            name: '',
            prefecture: '',
            region: '',
            population: '',
            notes: ''
        });
        setEditingMunicipality(null);
        setShowForm(false);
    };

    // 新規追加
    const handleAdd = () => {
        resetForm();
        setShowForm(true);
    };

    // 編集
    const handleEdit = (municipality) => {
        setEditingMunicipality(municipality);
        setFormData({
            name: municipality.name || '',
            prefecture: municipality.prefecture || '',
            region: municipality.region || '',
            population: municipality.population || '',
            notes: municipality.notes || ''
        });
        setShowForm(true);
    };

    // 削除
    const handleDelete = async (municipality) => {
        if (!window.confirm(`${municipality.name}を削除してもよろしいですか？`)) {
            return;
        }

        try {
            await apiService.delete(`/municipalities/${municipality.id}`);
            setMunicipalities(prev => prev.filter(m => m.id !== municipality.id));
        } catch (err) {
            alert('削除に失敗しました。');
            console.error('Failed to delete municipality:', err);
        }
    };

    // フォーム送信
    const handleSubmit = async (e) => {
        e.preventDefault();

        // バリデーション
        if (!formData.name.trim()) {
            alert('市区町村名を入力してください。');
            return;
        }
        if (!formData.prefecture.trim()) {
            alert('都道府県を選択してください。');
            return;
        }
        if (!formData.region.trim()) {
            alert('地域を選択してください。');
            return;
        }

        try {
            const submitData = {
                ...formData,
                population: formData.population ? parseInt(formData.population, 10) : null
            };

            if (editingMunicipality) {
                // 更新
                const response = await apiService.put(`/municipalities/${editingMunicipality.id}`, submitData);
                setMunicipalities(prev =>
                    prev.map(m => m.id === editingMunicipality.id ? response.data : m)
                );
            } else {
                // 新規作成
                const response = await apiService.post('/municipalities', submitData);
                setMunicipalities(prev => [...prev, response.data]);
            }

            resetForm();
        } catch (err) {
            alert('保存に失敗しました。');
            console.error('Failed to save municipality:', err);
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
                title="市区町村管理"
                data={municipalities}
                columns={columns}
                loading={loading}
                error={error}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onRefresh={fetchMunicipalities}
                searchPlaceholder="市区町村名で検索..."
                filters={filters}
                pageSize={15}
            />

            {/* フォームモーダル */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>{editingMunicipality ? '市区町村編集' : '市区町村追加'}</h3>
                            <button className="close-btn" onClick={resetForm}>×</button>
                        </div>

                        <form onSubmit={handleSubmit} className="master-form">
                            <div className="form-group">
                                <label htmlFor="name">市区町村名 *</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="例: 大阪市"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="prefecture">都道府県 *</label>
                                <select
                                    id="prefecture"
                                    name="prefecture"
                                    value={formData.prefecture}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">選択してください</option>
                                    <option value="大阪府">大阪府</option>
                                    <option value="兵庫県">兵庫県</option>
                                    <option value="京都府">京都府</option>
                                    <option value="奈良県">奈良県</option>
                                    <option value="愛知県">愛知県</option>
                                </select>
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
                                <label htmlFor="population">人口</label>
                                <input
                                    type="number"
                                    id="population"
                                    name="population"
                                    value={formData.population}
                                    onChange={handleInputChange}
                                    placeholder="例: 2700000"
                                    min="0"
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
                                    {editingMunicipality ? '更新' : '追加'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MunicipalityManagement;
