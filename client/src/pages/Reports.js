import React, { useState, useEffect } from 'react';
import { FaChartBar, FaDownload, FaCalendarAlt, FaMapMarkerAlt, FaUsers, FaFileExport, FaFilter } from 'react-icons/fa';
import { dashboardAPI, exportAPI } from '../services/apiService';

const Reports = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState(null);
    const [monthlyEvents, setMonthlyEvents] = useState([]);
    const [regionalDistribution, setRegionalDistribution] = useState([]);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [reportType, setReportType] = useState('overview');

    // レポートデータ取得
    const fetchReportData = async () => {
        try {
            setLoading(true);
            const [statsData, monthlyData, regionalData] = await Promise.all([
                dashboardAPI.getStats(),
                dashboardAPI.getMonthlyEvents(),
                dashboardAPI.getRegionalDistribution()
            ]);

            setStats(statsData);
            setMonthlyEvents(monthlyData.monthlyEvents || []);
            setRegionalDistribution(regionalData.regionalData || []);
        } catch (error) {
            console.error('レポートデータ取得エラー:', error);
            setError('レポートデータの取得に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReportData();
    }, []);

    // エクスポート機能
    const handleExport = async (type) => {
        try {
            const params = {
                year: selectedYear,
                month: selectedMonth,
                type: reportType
            };

            const exportUrl = exportAPI.exportCSV(type, params);

            // ダウンロードリンクを作成
            const link = document.createElement('a');
            link.href = exportUrl;
            link.download = `${type}_report_${selectedYear}_${selectedMonth}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('エクスポートエラー:', error);
            setError('エクスポートに失敗しました');
        }
    };

    // 統計カード
    const StatCard = ({ title, value, icon, color, change }) => (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    {change && (
                        <p className={`text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {change > 0 ? '+' : ''}{change}% 前月比
                        </p>
                    )}
                </div>
                <div className={`p-3 rounded-full ${color}`}>
                    {icon}
                </div>
            </div>
        </div>
    );

    // 月次イベントグラフ
    const MonthlyEventsChart = () => {
        const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
        const currentYearData = monthlyEvents.filter(item => item.year === selectedYear);

        const chartData = months.map((month, index) => {
            const monthData = currentYearData.find(item => item.month === index + 1);
            return {
                month,
                count: monthData ? monthData.count : 0,
                lines: monthData ? monthData.totalLines : 0
            };
        });

        const maxCount = Math.max(...chartData.map(d => d.count));
        const maxLines = Math.max(...chartData.map(d => d.lines));

        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">月次イベント統計 ({selectedYear}年)</h3>
                <div className="space-y-4">
                    {chartData.map((data, index) => (
                        <div key={index} className="flex items-center space-x-4">
                            <div className="w-12 text-sm text-gray-600">{data.month}</div>
                            <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-500 h-2 rounded-full"
                                            style={{ width: `${(data.count / maxCount) * 100}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-sm text-gray-600 w-12 text-right">
                                        {data.count}件
                                    </span>
                                </div>
                                <div className="flex items-center space-x-2 mt-1">
                                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-green-500 h-2 rounded-full"
                                            style={{ width: `${(data.lines / maxLines) * 100}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-sm text-gray-600 w-12 text-right">
                                        {data.lines}行
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // 地域別分布
    const RegionalDistributionChart = () => {
        const sortedData = [...regionalDistribution].sort((a, b) => b.count - a.count).slice(0, 10);
        const maxCount = Math.max(...sortedData.map(d => d.count));

        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">地域別イベント分布（上位10地域）</h3>
                <div className="space-y-3">
                    {sortedData.map((region, index) => (
                        <div key={index} className="flex items-center space-x-4">
                            <div className="w-8 text-sm text-gray-600">{index + 1}</div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-medium text-gray-800">
                                        {region.prefectureName} {region.name}
                                    </span>
                                    <span className="text-sm text-gray-600">
                                        {region.count}件 ({region.totalLines}行)
                                    </span>
                                </div>
                                <div className="bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-purple-500 h-2 rounded-full"
                                        style={{ width: `${(region.count / maxCount) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    <FaChartBar className="inline mr-3 text-green-500" />
                    レポート・分析
                </h1>
                <p className="text-gray-600">イベント統計と分析データを確認できます</p>
            </div>

            {/* エラー表示 */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                    {error}
                </div>
            )}

            {/* フィルター・エクスポート */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* 年選択 */}
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                <option key={year} value={year}>{year}年</option>
                            ))}
                        </select>

                        {/* 月選択 */}
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                <option key={month} value={month}>{month}月</option>
                            ))}
                        </select>

                        {/* レポートタイプ */}
                        <select
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                            <option value="overview">概要レポート</option>
                            <option value="detailed">詳細レポート</option>
                            <option value="regional">地域別レポート</option>
                        </select>
                    </div>

                    {/* エクスポートボタン */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleExport('events')}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                        >
                            <FaDownload />
                            イベントCSV
                        </button>
                        <button
                            onClick={() => handleExport('regional')}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                        >
                            <FaFileExport />
                            地域別CSV
                        </button>
                    </div>
                </div>
            </div>

            {/* 統計カード */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="今月のイベント数"
                        value={stats.currentMonthEvents || 0}
                        icon={<FaCalendarAlt className="text-white" />}
                        color="bg-blue-500"
                    />
                    <StatCard
                        title="総イベント数"
                        value={stats.totalEvents || 0}
                        icon={<FaChartBar className="text-white" />}
                        color="bg-green-500"
                    />
                    <StatCard
                        title="対象地域数"
                        value={stats.activeMunicipalities || 0}
                        icon={<FaMapMarkerAlt className="text-white" />}
                        color="bg-purple-500"
                    />
                    <StatCard
                        title="総参加者数"
                        value={stats.totalParticipants || 0}
                        icon={<FaUsers className="text-white" />}
                        color="bg-orange-500"
                    />
                </div>
            )}

            {/* グラフ・チャート */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MonthlyEventsChart />
                <RegionalDistributionChart />
            </div>

            {/* 詳細統計テーブル */}
            <div className="mt-8 bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">詳細統計</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    地域
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    イベント数
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    総参加者数
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    平均参加者数
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    成功率
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {regionalDistribution.slice(0, 10).map((region, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {region.prefectureName} {region.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {region.count}件
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {region.totalLines || 0}行
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {region.count > 0 ? Math.round((region.totalLines || 0) / region.count) : 0}行/件
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            95%
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

export default Reports;
