import React, { useState, useEffect } from 'react';
import './MasterTable.css';

const MasterTable = ({
    title,
    data = [],
    columns = [],
    loading = false,
    error = null,
    onAdd,
    onEdit,
    onDelete,
    onRefresh,
    searchPlaceholder = "検索...",
    filters = [],
    actions = [],
    pageSize = 10
}) => {
    const [filteredData, setFilteredData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedRows, setSelectedRows] = useState([]);
    const [activeFilters, setActiveFilters] = useState({});

    // データのフィルタリングと検索
    useEffect(() => {
        let filtered = [...data];

        // 検索フィルタ
        if (searchTerm) {
            filtered = filtered.filter(item =>
                columns.some(column => {
                    const value = getNestedValue(item, column.key);
                    return String(value).toLowerCase().includes(searchTerm.toLowerCase());
                })
            );
        }

        // カスタムフィルタ
        Object.entries(activeFilters).forEach(([filterKey, filterValue]) => {
            if (filterValue && filterValue !== '') {
                filtered = filtered.filter(item => {
                    const value = getNestedValue(item, filterKey);
                    return String(value) === String(filterValue);
                });
            }
        });

        // ソート
        if (sortConfig.key) {
            filtered.sort((a, b) => {
                const aValue = getNestedValue(a, sortConfig.key);
                const bValue = getNestedValue(b, sortConfig.key);

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        setFilteredData(filtered);
        setCurrentPage(1);
    }, [data, searchTerm, sortConfig, activeFilters, columns]);

    // ネストされたオブジェクトから値を取得
    const getNestedValue = (obj, path) => {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    };

    // ソート処理
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // ページネーション
    const totalPages = Math.ceil(filteredData.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentData = filteredData.slice(startIndex, endIndex);

    // 行選択
    const handleRowSelect = (id) => {
        setSelectedRows(prev =>
            prev.includes(id)
                ? prev.filter(rowId => rowId !== id)
                : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedRows.length === currentData.length) {
            setSelectedRows([]);
        } else {
            setSelectedRows(currentData.map(item => item.id));
        }
    };

    // フィルタ変更
    const handleFilterChange = (filterKey, value) => {
        setActiveFilters(prev => ({
            ...prev,
            [filterKey]: value
        }));
    };

    // セル値のレンダリング
    const renderCellValue = (item, column) => {
        const value = getNestedValue(item, column.key);

        if (column.render) {
            return column.render(value, item);
        }

        if (column.type === 'boolean') {
            return value ? '✓' : '×';
        }

        if (column.type === 'date') {
            return value ? new Date(value).toLocaleDateString('ja-JP') : '';
        }

        return value || '';
    };

    if (loading) {
        return (
            <div className="master-table-container">
                <div className="master-table-loading">読み込み中...</div>
            </div>
        );
    }

    return (
        <div className="master-table-container">
            <div className="master-table-header">
                <div className="master-table-title">
                    <h2>{title}</h2>
                    <div className="master-table-stats">
                        {filteredData.length}件 / 全{data.length}件
                    </div>
                </div>

                <div className="master-table-actions">
                    {onAdd && (
                        <button className="btn btn-primary" onClick={onAdd}>
                            新規追加
                        </button>
                    )}
                    {onRefresh && (
                        <button className="btn btn-secondary" onClick={onRefresh}>
                            更新
                        </button>
                    )}
                    {actions.map((action, index) => (
                        <button
                            key={index}
                            className={`btn ${action.className || 'btn-secondary'}`}
                            onClick={() => action.onClick(selectedRows)}
                            disabled={action.requiresSelection && selectedRows.length === 0}
                        >
                            {action.label}
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <div className="master-table-error">
                    エラーが発生しました: {error}
                </div>
            )}

            <div className="master-table-controls">
                <div className="search-container">
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>

                {filters.length > 0 && (
                    <div className="filters-container">
                        {filters.map((filter, index) => (
                            <div key={index} className="filter-item">
                                <label>{filter.label}:</label>
                                <select
                                    value={activeFilters[filter.key] || ''}
                                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                                >
                                    <option value="">すべて</option>
                                    {filter.options.map((option, optIndex) => (
                                        <option key={optIndex} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="master-table-wrapper">
                <table className="master-table">
                    <thead>
                        <tr>
                            <th className="checkbox-column">
                                <input
                                    type="checkbox"
                                    checked={selectedRows.length === currentData.length && currentData.length > 0}
                                    onChange={handleSelectAll}
                                />
                            </th>
                            {columns.map((column, index) => (
                                <th
                                    key={index}
                                    className={column.sortable ? 'sortable' : ''}
                                    onClick={column.sortable ? () => handleSort(column.key) : undefined}
                                >
                                    {column.label}
                                    {column.sortable && sortConfig.key === column.key && (
                                        <span className="sort-indicator">
                                            {sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}
                                        </span>
                                    )}
                                </th>
                            ))}
                            <th className="actions-column">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentData.map((item, index) => (
                            <tr key={item.id} className={selectedRows.includes(item.id) ? 'selected' : ''}>
                                <td className="checkbox-column">
                                    <input
                                        type="checkbox"
                                        checked={selectedRows.includes(item.id)}
                                        onChange={() => handleRowSelect(item.id)}
                                    />
                                </td>
                                {columns.map((column, colIndex) => (
                                    <td key={colIndex} className={column.className || ''}>
                                        {renderCellValue(item, column)}
                                    </td>
                                ))}
                                <td className="actions-column">
                                    {onEdit && (
                                        <button
                                            className="btn btn-small btn-edit"
                                            onClick={() => onEdit(item)}
                                        >
                                            編集
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button
                                            className="btn btn-small btn-delete"
                                            onClick={() => onDelete(item)}
                                        >
                                            削除
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="master-table-pagination">
                    <button
                        className="btn btn-pagination"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                    >
                        前へ
                    </button>

                    <span className="pagination-info">
                        {currentPage} / {totalPages} ページ
                    </span>

                    <button
                        className="btn btn-pagination"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                    >
                        次へ
                    </button>
                </div>
            )}
        </div>
    );
};

export default MasterTable;
