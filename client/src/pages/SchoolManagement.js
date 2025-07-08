import React, { useState, useEffect } from 'react';
import MasterTable from '../components/MasterTable';
import apiService from '../services/apiService';
import './MasterManagement.css';

const SchoolManagement = () => {
    const [schools, setSchools] = useState([]);
    const [municipalities, setMunicipalities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingSchool, setEditingSchool] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        municipalityId: '',
        schoolType: 'elementary',
        studentCount: '',
        principalName: '',
        contactInfo: '',
        notes: ''
    });

    // 列定義
    const columns = [
        { key: 'id', label: 'ID', sortable: true, className: 'text-center' },
        { key: 'name', label: '学校名', sortable: true },
        {
            key: 'schoolType',
            label: '学校種別',
            sortable: true,
            render: (value) => {
                const typeMap = {
                    elementary: '小学校',
                    junior_high: '中学校',
                    high: '高等学校',
                    special: '特別支援学校'
                };
                return typeMap[value] || value;
            }
        },
        {
            key: 'Municipality.name',
            label: '市区町村',
            sortable: true,
            render: (value, item) => item.Municipality?.name || '-'
        },
        {
            key: 'studentCount',
            label: '生徒数',
            sortable: true,
            className: 'text-right',
            render: (value) => value ? `${value}名` : '-'
        },
        { key: 'principalName', label: '校長名', sortable: true },
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
            key: 'schoolType',
            label: '学校種別',
            options: [
                { value: 'elementary', label: '小学校' },
                { value: 'junior_high', label: '中学校' },
                { value: 'high', label: '高等学校' },
                { value: 'special', label: '特別支援学校' }
            ]
        },
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
    const fetchSchools = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiService.get('/schools');
            setSchools(response.data);
        } catch (err) {
            setError('データの取得に失敗しました。');
            console.error('Failed to fetch schools:', err);
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
        fetchSchools();
        fetchMunicipalities();
    }, []);

    // フォームの初期化
    const resetForm = () => {
        setFormData({
            name: '',
            address: '',
            municipalityId: '',
            schoolType: 'elementary',
            studentCount: '',
            principalName: '',
            contactInfo: '',
            notes: ''
        });
        setEditingSchool(null);
        setShowForm(false);
    };

    // 新規追加
    const handleAdd = () => {
        resetForm();
        setShowForm(true);
    };

    // 編集
    const handleEdit = (school) => {
        setEditingSchool(school);
        setFormData({
            name: school.name || '',
            address: school.address || '',
            municipalityId: school.municipalityId || '',
            schoolType: school.schoolType || 'elementary',
            studentCount: school.studentCount || '',
            principalName: school.principalName || '',
            contactInfo: school.contactInfo || '',
            notes: school.notes || ''
        });
        setShowForm(true);
    };

    // 削除
    const handleDelete = async (school) => {
        if (!window.confirm(`${school.name}を削除してもよろしいですか？`)) {
            return;
        }

        try {
            await apiService.delete(`/schools/${school.id}`);
            setSchools(prev => prev.filter(s => s.id !== school.id));
        } catch (err) {
            alert('削除に失敗しました。');
            console.error('Failed to delete school:', err);
        }
    };

    // フォーム送信
    const handleSubmit = async (e) => {
        e.preventDefault();

        // バリデーション
        if (!formData.name.trim()) {
            alert('学校名を入力してください。');
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
                studentCount: formData.studentCount ? parseInt(formData.studentCount, 10) : null
            };

            if (editingSchool) {
                // 更新
                const response = await apiService.put(`/schools/${editingSchool.id}`, submitData);
                setSchools(prev =>
                    prev.map(s => s.id === editingSchool.id ? response.data : s)
                );
            } else {
                // 新規作成
                const response = await apiService.post('/schools', submitData);
                setSchools(prev => [...prev, response.data]);
            }

            resetForm();
        } catch (err) {
            alert('保存に失敗しました。');
            console.error('Failed to save school:', err);
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
                title="学校管理"
                data={schools}
                columns={columns}
                loading={loading}
                error={error}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onRefresh={fetchSchools}
                searchPlaceholder="学校名で検索..."
                filters={filters}
                pageSize={15}
            />

            {/* フォームモーダル */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>{editingSchool ? '学校編集' : '学校追加'}</h3>
                            <button className="close-btn" onClick={resetForm}>×</button>
                        </div>

                        <form onSubmit={handleSubmit} className="master-form">
                            <div className="form-group">
                                <label htmlFor="name">学校名 *</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="例: 大阪市立中央小学校"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="schoolType">学校種別</label>
                                <select
                                    id="schoolType"
                                    name="schoolType"
                                    value={formData.schoolType}
                                    onChange={handleInputChange}
                                >
                                    <option value="elementary">小学校</option>
                                    <option value="junior_high">中学校</option>
                                    <option value="high">高等学校</option>
                                    <option value="special">特別支援学校</option>
                                </select>
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
                                <label htmlFor="studentCount">生徒数</label>
                                <input
                                    type="number"
                                    id="studentCount"
                                    name="studentCount"
                                    value={formData.studentCount}
                                    onChange={handleInputChange}
                                    placeholder="例: 500"
                                    min="1"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="principalName">校長名</label>
                                <input
                                    type="text"
                                    id="principalName"
                                    name="principalName"
                                    value={formData.principalName}
                                    onChange={handleInputChange}
                                    placeholder="例: 田中 太郎"
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
                                    {editingSchool ? '更新' : '追加'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SchoolManagement;
