import { toast } from 'react-toastify';

const API_BASE_URL = 'http://localhost:5001/api';

// 認証トークンを取得する関数
const getAuthToken = () => {
    return localStorage.getItem('token');
};

// 共通のAPI呼び出し関数
const apiCall = async (endpoint, options = {}) => {
    alert('リクエスト先: ' + API_BASE_URL + endpoint);
    try {
        const token = getAuthToken();
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        // トークンがある場合は認証ヘッダーを追加
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers,
            ...options,
        });

        // 401エラーの場合は認証エラーとして処理
        if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
            throw new Error('認証が必要です');
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        alert('fetchエラー: ' + error);
        console.error('API call failed:', error);
        if (error.message !== '認証が必要です') {
            toast.error(`API呼び出しエラー: ${error.message}`);
            alert(error.message || 'API呼び出しエラー');
        }
        throw error;
    }
};

// イベント関連API
export const eventAPI = {
    // イベント一覧取得
    getAll: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiCall(`/events${queryString ? `?${queryString}` : ''}`);
    },

    // イベント詳細取得
    getById: (id) => apiCall(`/events/${id}`),

    // イベント作成
    create: (data) => apiCall('/events', {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    // イベント更新
    update: (id, data) => apiCall(`/events/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),

    // イベント削除
    delete: (id) => apiCall(`/events/${id}`, {
        method: 'DELETE',
    }),
};

// ダッシュボード関連API
export const dashboardAPI = {
    // 統計データ取得
    getStats: () => apiCall('/dashboard/stats'),

    // 月次イベント統計
    getMonthlyEvents: () => apiCall('/dashboard/monthly-events'),

    // 地域別分布
    getRegionalDistribution: () => apiCall('/dashboard/regional-distribution'),
};

// 市区町村関連API
export const municipalityAPI = {
    // 市区町村一覧取得
    getAll: () => apiCall('/municipalities'),

    // 市区町村作成
    create: (data) => apiCall('/municipalities', {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    // 市区町村更新
    update: (id, data) => apiCall(`/municipalities/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),

    // 市区町村削除
    delete: (id) => apiCall(`/municipalities/${id}`, {
        method: 'DELETE',
    }),
};

// 開拓地域関連API
export const developmentAreaAPI = {
    // 開拓地域一覧取得
    getAll: () => apiCall('/development-areas'),

    // 開拓地域作成
    create: (data) => apiCall('/development-areas', {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    // 開拓地域更新
    update: (id, data) => apiCall(`/development-areas/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),

    // 開拓地域削除
    delete: (id) => apiCall(`/development-areas/${id}`, {
        method: 'DELETE',
    }),
};

// 学校関連API
export const schoolAPI = {
    // 学校一覧取得
    getAll: () => apiCall('/schools'),

    // 学校作成
    create: (data) => apiCall('/schools', {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    // 学校更新
    update: (id, data) => apiCall(`/schools/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),

    // 学校削除
    delete: (id) => apiCall(`/schools/${id}`, {
        method: 'DELETE',
    }),
};

// 会場履歴関連API
export const venueHistoryAPI = {
    // 会場履歴一覧取得
    getAll: () => apiCall('/venue-histories'),

    // 会場履歴作成
    create: (data) => apiCall('/venue-histories', {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    // 会場履歴更新
    update: (id, data) => apiCall(`/venue-histories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),

    // 会場履歴削除
    delete: (id) => apiCall(`/venue-histories/${id}`, {
        method: 'DELETE',
    }),
};

// Googleドライブ関連API
export const googleDriveAPI = {
    // 連携状態確認
    getStatus: () => apiCall('/google-drive/status'),

    // 手動レポート生成
    generateReport: () => apiCall('/google-drive/generate-report', {
        method: 'POST',
    }),

    // 集計データ取得
    getSummaryData: () => apiCall('/google-drive/summary-data'),
};

// 認証・ユーザー管理関連API
export const authAPI = {
    // ログイン
    login: (credentials) => apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
    }),

    // ユーザー登録
    register: (userData) => apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
    }),

    // 現在のユーザー情報取得
    getCurrentUser: () => apiCall('/auth/me'),

    // ユーザー一覧取得（管理者のみ）
    getUsers: () => apiCall('/auth/users'),

    // ユーザー更新（管理者のみ）
    updateUser: (id, userData) => apiCall(`/auth/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(userData),
    }),

    // ユーザー削除（管理者のみ）
    deleteUser: (id) => apiCall(`/auth/users/${id}`, {
        method: 'DELETE',
    }),
};

// エクスポート関連API
export const exportAPI = {
    // CSVエクスポート
    exportCSV: (type, params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return `${API_BASE_URL}/export/${type}${queryString ? `?${queryString}` : ''}`;
    },
};

export default {
    eventAPI,
    dashboardAPI,
    municipalityAPI,
    developmentAreaAPI,
    schoolAPI,
    venueHistoryAPI,
    googleDriveAPI,
    authAPI,
    exportAPI,
};
