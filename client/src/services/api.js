import axios from 'axios';
import { toast } from 'react-toastify';

// ベースURL設定
const BASE_URL = process.env.NODE_ENV === 'production'
    ? '/api'
    : 'http://localhost:5000/api';

// axios インスタンス作成
const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// レスポンスインターセプター
api.interceptors.response.use(
    response => response,
    error => {
        console.error('API Error:', error);

        if (error.response) {
            const { status, data } = error.response;

            switch (status) {
                case 400:
                    if (data.errors && Array.isArray(data.errors)) {
                        data.errors.forEach(error => toast.error(error));
                    } else {
                        toast.error(data.error || 'リクエストエラーが発生しました');
                    }
                    break;
                case 404:
                    toast.error('リソースが見つかりません');
                    break;
                case 500:
                    toast.error('サーバーエラーが発生しました');
                    break;
                default:
                    toast.error('予期しないエラーが発生しました');
            }
        } else if (error.request) {
            toast.error('サーバーに接続できません');
        } else {
            toast.error('リクエストの設定でエラーが発生しました');
        }

        return Promise.reject(error);
    }
);

// API メソッド定義
export const eventApi = {
    getAll: (params = {}) => api.get('/events', { params }),
    getById: (id) => api.get(`/events/${id}`),
    create: (data) => api.post('/events', data),
    update: (id, data) => api.put(`/events/${id}`, data),
    delete: (id) => api.delete(`/events/${id}`),
    getStats: () => api.get('/events/stats/summary'),
    getCalendar: (year, month) => api.get(`/events/calendar/${year}/${month}`)
};

export const municipalityApi = {
    getAll: (params = {}) => api.get('/municipalities', { params }),
    getById: (id) => api.get(`/municipalities/${id}`),
    create: (data) => api.post('/municipalities', data),
    update: (id, data) => api.put(`/municipalities/${id}`, data),
    delete: (id) => api.delete(`/municipalities/${id}`),
    getByPrefecture: (prefecture) => api.get(`/municipalities/prefecture/${prefecture}`)
};

export const developmentAreaApi = {
    getAll: (params = {}) => api.get('/development-areas', { params }),
    getById: (id) => api.get(`/development-areas/${id}`),
    create: (data) => api.post('/development-areas', data),
    update: (id, data) => api.put(`/development-areas/${id}`, data),
    delete: (id) => api.delete(`/development-areas/${id}`)
};

export const venueHistoryApi = {
    getAll: (params = {}) => api.get('/venue-histories', { params }),
    getById: (id) => api.get(`/venue-histories/${id}`),
    create: (data) => api.post('/venue-histories', data),
    update: (id, data) => api.put(`/venue-histories/${id}`, data),
    delete: (id) => api.delete(`/venue-histories/${id}`),
    getRecommended: () => api.get('/venue-histories/recommended/list')
};

export const schoolApi = {
    getAll: (params = {}) => api.get('/schools', { params }),
    getById: (id) => api.get(`/schools/${id}`),
    create: (data) => api.post('/schools', data),
    update: (id, data) => api.put(`/schools/${id}`, data),
    delete: (id) => api.delete(`/schools/${id}`)
};

export const dashboardApi = {
    getStats: () => api.get('/dashboard/stats'),
    getNotifications: () => api.get('/dashboard/notifications'),
    getRecentActivity: () => api.get('/dashboard/recent-activity')
};

export default api;
