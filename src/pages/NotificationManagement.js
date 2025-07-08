import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaEnvelope, FaCog, FaPlay, FaHistory, FaUsers, FaEye } from 'react-icons/fa';
import apiService from '../services/apiService';

const NotificationManagement = () => {
    const [settings, setSettings] = useState(null);
    const [recipients, setRecipients] = useState([]);
    const [targetEvents, setTargetEvents] = useState({});
    const [loading, setLoading] = useState(false);
    const [customNotification, setCustomNotification] = useState({
        subject: '',
        message: '',
        recipients: []
    });

    useEffect(() => {
        fetchSettings();
        fetchRecipients();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await apiService.get('/notifications/settings');
            if (response.success) {
                setSettings(response.data);
            }
        } catch (error) {
            console.error('設定取得エラー:', error);
            toast.error('設定の取得に失敗しました');
        }
    };

    const fetchRecipients = async () => {
        try {
            const response = await apiService.get('/notifications/recipients');
            if (response.success) {
                setRecipients(response.data);
            }
        } catch (error) {
            console.error('通知先取得エラー:', error);
            toast.error('通知先の取得に失敗しました');
        }
    };

    const fetchTargetEvents = async (type) => {
        try {
            const response = await apiService.get(`/notifications/target-events?type=${type}`);
            if (response.success) {
                setTargetEvents(prev => ({
                    ...prev,
                    [type]: response.data
                }));
            }
        } catch (error) {
            console.error('対象イベント取得エラー:', error);
            toast.error('対象イベントの取得に失敗しました');
        }
    };

    const executeNotification = async (type) => {
        setLoading(true);
        try {
            let endpoint = '';
            let message = '';

            switch (type) {
                case 'flyer-distribution':
                    endpoint = '/notifications/flyer-distribution';
                    message = 'チラシ配布通知を実行しました';
                    break;
                case 'overdue':
                    endpoint = '/notifications/overdue';
                    message = '期日過ぎ通知を実行しました';
                    break;
                case 'three-month-reminder':
                    endpoint = '/notifications/three-month-reminder';
                    message = '3ヶ月前リマインダーを実行しました';
                    break;
                default:
                    throw new Error('無効な通知タイプです');
            }

            const response = await apiService.post(endpoint);
            if (response.success) {
                toast.success(message);
                // 対象イベントを再取得
                fetchTargetEvents(type);
            }
        } catch (error) {
            console.error('通知実行エラー:', error);
            toast.error('通知の実行に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    const sendCustomNotification = async () => {
        if (!customNotification.subject || !customNotification.message) {
            toast.error('件名とメッセージは必須です');
            return;
        }

        setLoading(true);
        try {
            const response = await apiService.post('/notifications/custom', {
                subject: customNotification.subject,
                message: customNotification.message,
                recipients: customNotification.recipients.length > 0 ? customNotification.recipients : null
            });

            if (response.success) {
                toast.success('カスタム通知を送信しました');
                setCustomNotification({
                    subject: '',
                    message: '',
                    recipients: []
                });
            }
        } catch (error) {
            console.error('カスタム通知送信エラー:', error);
            toast.error('カスタム通知の送信に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    const sendTestEmail = async () => {
        const testEmail = prompt('テスト用メールアドレスを入力してください:');
        if (!testEmail) return;

        setLoading(true);
        try {
            const response = await apiService.post('/notifications/test', { email: testEmail });
            if (response.success) {
                toast.success('テストメールを送信しました');
            }
        } catch (error) {
            console.error('テストメール送信エラー:', error);
            toast.error('テストメールの送信に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    const getNotificationTypeInfo = (type) => {
        switch (type) {
            case 'flyer-distribution':
                return {
                    title: 'チラシ配布通知',
                    description: '1週間以内にチラシ配布が予定されているイベント',
                    color: 'blue'
                };
            case 'overdue':
                return {
                    title: '期日過ぎ通知',
                    description: '開催予定日が過ぎているイベント',
                    color: 'red'
                };
            case 'three-month-reminder':
                return {
                    title: '3ヶ月前リマインダー',
                    description: '3ヶ月後に開催予定のイベント',
                    color: 'yellow'
                };
            default:
                return { title: '', description: '', color: 'gray' };
        }
    };

    if (!settings) {
        return <div className="flex justify-center items-center h-64">読み込み中...</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    <FaEnvelope className="inline mr-2" />
                    通知管理
                </h1>
                <p className="text-gray-600">メール通知の設定と管理を行います</p>
            </div>

            {/* 通知設定 */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    <FaCog className="inline mr-2" />
                    通知設定
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            メールサービス
                        </label>
                        <p className="text-gray-900">{settings.mailService}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            メールアドレス
                        </label>
                        <p className="text-gray-900">{settings.mailUser}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            パスワード
                        </label>
                        <p className="text-gray-900">{settings.mailPass}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            設定状況
                        </label>
                        <span className={`px-2 py-1 rounded text-sm ${settings.isConfigured
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                            {settings.isConfigured ? '設定済み' : '未設定'}
                        </span>
                    </div>
                </div>
                <div className="mt-4">
                    <button
                        onClick={sendTestEmail}
                        disabled={!settings.isConfigured || loading}
                        className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
                    >
                        テストメール送信
                    </button>
                </div>
            </div>

            {/* 自動通知 */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    <FaPlay className="inline mr-2" />
                    自動通知
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['flyer-distribution', 'overdue', 'three-month-reminder'].map(type => {
                        const info = getNotificationTypeInfo(type);
                        const events = targetEvents[type];

                        return (
                            <div key={type} className="border rounded-lg p-4">
                                <h3 className="font-semibold text-gray-800 mb-2">{info.title}</h3>
                                <p className="text-sm text-gray-600 mb-3">{info.description}</p>

                                <div className="flex items-center justify-between mb-3">
                                    <button
                                        onClick={() => fetchTargetEvents(type)}
                                        className="text-blue-500 hover:text-blue-600 text-sm"
                                    >
                                        <FaEye className="inline mr-1" />
                                        対象確認
                                    </button>
                                    {events && (
                                        <span className="text-sm text-gray-500">
                                            {events.count}件
                                        </span>
                                    )}
                                </div>

                                <button
                                    onClick={() => executeNotification(type)}
                                    disabled={!settings.isConfigured || loading}
                                    className={`w-full px-3 py-2 rounded text-sm font-medium ${info.color === 'blue' ? 'bg-blue-500 hover:bg-blue-600' :
                                            info.color === 'red' ? 'bg-red-500 hover:bg-red-600' :
                                                'bg-yellow-500 hover:bg-yellow-600'
                                        } text-white disabled:bg-gray-400`}
                                >
                                    実行
                                </button>

                                {events && events.events && events.events.length > 0 && (
                                    <div className="mt-3">
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">対象イベント:</h4>
                                        <div className="max-h-32 overflow-y-auto">
                                            {events.events.slice(0, 5).map(event => (
                                                <div key={event.id} className="text-xs text-gray-600 mb-1">
                                                    {event.eventYear}年{event.eventMonth}月 - {event.municipalityName}
                                                </div>
                                            ))}
                                            {events.events.length > 5 && (
                                                <div className="text-xs text-gray-500">
                                                    他{events.events.length - 5}件...
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* カスタム通知 */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    <FaEnvelope className="inline mr-2" />
                    カスタム通知
                </h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            件名 *
                        </label>
                        <input
                            type="text"
                            value={customNotification.subject}
                            onChange={(e) => setCustomNotification(prev => ({
                                ...prev,
                                subject: e.target.value
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="通知の件名を入力"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            メッセージ *
                        </label>
                        <textarea
                            value={customNotification.message}
                            onChange={(e) => setCustomNotification(prev => ({
                                ...prev,
                                message: e.target.value
                            }))}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="通知メッセージを入力"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            送信先（空欄の場合は全管理者）
                        </label>
                        <select
                            multiple
                            value={customNotification.recipients}
                            onChange={(e) => setCustomNotification(prev => ({
                                ...prev,
                                recipients: Array.from(e.target.selectedOptions, option => option.value)
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {recipients.map(user => (
                                <option key={user.id} value={user.email}>
                                    {user.lastName} {user.firstName} ({user.email}) - {user.role}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            Ctrl/Cmd + クリックで複数選択
                        </p>
                    </div>

                    <button
                        onClick={sendCustomNotification}
                        disabled={!settings.isConfigured || loading || !customNotification.subject || !customNotification.message}
                        className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-2 rounded"
                    >
                        送信
                    </button>
                </div>
            </div>

            {/* 通知先一覧 */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    <FaUsers className="inline mr-2" />
                    通知先一覧
                </h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    名前
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    メールアドレス
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    役割
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {recipients.map(user => (
                                <tr key={user.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {user.lastName} {user.firstName}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {user.email}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className={`px-2 py-1 rounded text-xs ${user.role === 'admin'
                                                ? 'bg-red-100 text-red-800'
                                                : 'bg-blue-100 text-blue-800'
                                            }`}>
                                            {user.role === 'admin' ? '管理者' : '一般'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default NotificationManagement;
