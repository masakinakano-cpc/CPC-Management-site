import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { FaPalette, FaUndo, FaSave, FaEye } from 'react-icons/fa';
import './Settings.css';

const Settings = () => {
    const { theme, updateTheme, resetTheme } = useTheme();
    const [localTheme, setLocalTheme] = useState(theme);
    const [isPreviewMode, setIsPreviewMode] = useState(false);

    const handleColorChange = (section, property, value) => {
        setLocalTheme(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [property]: value
            }
        }));
    };

    const handleSave = () => {
        updateTheme(localTheme);
        setIsPreviewMode(false);
    };

    const handleReset = () => {
        resetTheme();
        setLocalTheme(theme);
        setIsPreviewMode(false);
    };

    const handlePreview = () => {
        if (isPreviewMode) {
            updateTheme(theme); // 元に戻す
        } else {
            updateTheme(localTheme); // プレビュー表示
        }
        setIsPreviewMode(!isPreviewMode);
    };

    const presetThemes = [
        {
            name: '蛍光グリーン',
            theme: {
                header: { primary: '#00ff88', secondary: '#00cc6a', text: '#ffffff' },
                sidebar: { primary: '#00ff88', secondary: '#00cc6a', text: '#ffffff', background: '#1a1a1a' },
                background: { primary: '#f8f9fa', secondary: '#ffffff' }
            }
        },
        {
            name: 'ブルー',
            theme: {
                header: { primary: '#3498db', secondary: '#2980b9', text: '#ffffff' },
                sidebar: { primary: '#3498db', secondary: '#2980b9', text: '#ffffff', background: '#2c3e50' },
                background: { primary: '#f8f9fa', secondary: '#ffffff' }
            }
        },
        {
            name: 'パープル',
            theme: {
                header: { primary: '#9b59b6', secondary: '#8e44ad', text: '#ffffff' },
                sidebar: { primary: '#9b59b6', secondary: '#8e44ad', text: '#ffffff', background: '#2c3e50' },
                background: { primary: '#f8f9fa', secondary: '#ffffff' }
            }
        },
        {
            name: 'オレンジ',
            theme: {
                header: { primary: '#e67e22', secondary: '#d35400', text: '#ffffff' },
                sidebar: { primary: '#e67e22', secondary: '#d35400', text: '#ffffff', background: '#2c3e50' },
                background: { primary: '#f8f9fa', secondary: '#ffffff' }
            }
        }
    ];

    return (
        <div className="settings-container">
            <div className="settings-header">
                <h1><FaPalette /> テーマ設定</h1>
                <p>ヘッダーやサイドバーの色をカスタマイズできます</p>
            </div>

            <div className="settings-content">
                <div className="settings-section">
                    <h2>プリセットテーマ</h2>
                    <div className="preset-themes">
                        {presetThemes.map((preset, index) => (
                            <button
                                key={index}
                                className="preset-theme-btn"
                                onClick={() => setLocalTheme(preset.theme)}
                                style={{
                                    background: `linear-gradient(135deg, ${preset.theme.header.primary}, ${preset.theme.header.secondary})`
                                }}
                            >
                                {preset.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="settings-section">
                    <h2>カスタムカラー</h2>

                    <div className="color-settings">
                        <div className="color-group">
                            <h3>ヘッダー</h3>
                            <div className="color-inputs">
                                <div className="color-input">
                                    <label>プライマリカラー</label>
                                    <div className="color-input-group">
                                        <input
                                            type="color"
                                            value={localTheme.header.primary}
                                            onChange={(e) => handleColorChange('header', 'primary', e.target.value)}
                                        />
                                        <input
                                            type="text"
                                            value={localTheme.header.primary}
                                            onChange={(e) => handleColorChange('header', 'primary', e.target.value)}
                                            placeholder="#00ff88"
                                        />
                                    </div>
                                </div>
                                <div className="color-input">
                                    <label>セカンダリカラー</label>
                                    <div className="color-input-group">
                                        <input
                                            type="color"
                                            value={localTheme.header.secondary}
                                            onChange={(e) => handleColorChange('header', 'secondary', e.target.value)}
                                        />
                                        <input
                                            type="text"
                                            value={localTheme.header.secondary}
                                            onChange={(e) => handleColorChange('header', 'secondary', e.target.value)}
                                            placeholder="#00cc6a"
                                        />
                                    </div>
                                </div>
                                <div className="color-input">
                                    <label>テキストカラー</label>
                                    <div className="color-input-group">
                                        <input
                                            type="color"
                                            value={localTheme.header.text}
                                            onChange={(e) => handleColorChange('header', 'text', e.target.value)}
                                        />
                                        <input
                                            type="text"
                                            value={localTheme.header.text}
                                            onChange={(e) => handleColorChange('header', 'text', e.target.value)}
                                            placeholder="#ffffff"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="color-group">
                            <h3>サイドバー</h3>
                            <div className="color-inputs">
                                <div className="color-input">
                                    <label>プライマリカラー</label>
                                    <div className="color-input-group">
                                        <input
                                            type="color"
                                            value={localTheme.sidebar.primary}
                                            onChange={(e) => handleColorChange('sidebar', 'primary', e.target.value)}
                                        />
                                        <input
                                            type="text"
                                            value={localTheme.sidebar.primary}
                                            onChange={(e) => handleColorChange('sidebar', 'primary', e.target.value)}
                                            placeholder="#00ff88"
                                        />
                                    </div>
                                </div>
                                <div className="color-input">
                                    <label>セカンダリカラー</label>
                                    <div className="color-input-group">
                                        <input
                                            type="color"
                                            value={localTheme.sidebar.secondary}
                                            onChange={(e) => handleColorChange('sidebar', 'secondary', e.target.value)}
                                        />
                                        <input
                                            type="text"
                                            value={localTheme.sidebar.secondary}
                                            onChange={(e) => handleColorChange('sidebar', 'secondary', e.target.value)}
                                            placeholder="#00cc6a"
                                        />
                                    </div>
                                </div>
                                <div className="color-input">
                                    <label>テキストカラー</label>
                                    <div className="color-input-group">
                                        <input
                                            type="color"
                                            value={localTheme.sidebar.text}
                                            onChange={(e) => handleColorChange('sidebar', 'text', e.target.value)}
                                        />
                                        <input
                                            type="text"
                                            value={localTheme.sidebar.text}
                                            onChange={(e) => handleColorChange('sidebar', 'text', e.target.value)}
                                            placeholder="#ffffff"
                                        />
                                    </div>
                                </div>
                                <div className="color-input">
                                    <label>背景カラー</label>
                                    <div className="color-input-group">
                                        <input
                                            type="color"
                                            value={localTheme.sidebar.background}
                                            onChange={(e) => handleColorChange('sidebar', 'background', e.target.value)}
                                        />
                                        <input
                                            type="text"
                                            value={localTheme.sidebar.background}
                                            onChange={(e) => handleColorChange('sidebar', 'background', e.target.value)}
                                            placeholder="#1a1a1a"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="color-group">
                            <h3>背景</h3>
                            <div className="color-inputs">
                                <div className="color-input">
                                    <label>プライマリ背景</label>
                                    <div className="color-input-group">
                                        <input
                                            type="color"
                                            value={localTheme.background.primary}
                                            onChange={(e) => handleColorChange('background', 'primary', e.target.value)}
                                        />
                                        <input
                                            type="text"
                                            value={localTheme.background.primary}
                                            onChange={(e) => handleColorChange('background', 'primary', e.target.value)}
                                            placeholder="#f8f9fa"
                                        />
                                    </div>
                                </div>
                                <div className="color-input">
                                    <label>セカンダリ背景</label>
                                    <div className="color-input-group">
                                        <input
                                            type="color"
                                            value={localTheme.background.secondary}
                                            onChange={(e) => handleColorChange('background', 'secondary', e.target.value)}
                                        />
                                        <input
                                            type="text"
                                            value={localTheme.background.secondary}
                                            onChange={(e) => handleColorChange('background', 'secondary', e.target.value)}
                                            placeholder="#ffffff"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="settings-actions">
                    <button className="btn btn-preview" onClick={handlePreview}>
                        <FaEye /> {isPreviewMode ? 'プレビュー終了' : 'プレビュー'}
                    </button>
                    <button className="btn btn-reset" onClick={handleReset}>
                        <FaUndo /> リセット
                    </button>
                    <button className="btn btn-save" onClick={handleSave}>
                        <FaSave /> 保存
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
