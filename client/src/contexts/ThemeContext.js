import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('cpc-theme');
        return savedTheme ? JSON.parse(savedTheme) : {
            header: {
                primary: '#00ff88',
                secondary: '#00cc6a',
                text: '#ffffff'
            },
            sidebar: {
                primary: '#00ff88',
                secondary: '#00cc6a',
                text: '#ffffff',
                background: '#1a1a1a'
            },
            background: {
                primary: '#f8f9fa',
                secondary: '#ffffff'
            }
        };
    });

    useEffect(() => {
        localStorage.setItem('cpc-theme', JSON.stringify(theme));

        // CSS変数を更新
        const root = document.documentElement;
        root.style.setProperty('--header-primary', theme.header.primary);
        root.style.setProperty('--header-secondary', theme.header.secondary);
        root.style.setProperty('--header-text', theme.header.text);
        root.style.setProperty('--sidebar-primary', theme.sidebar.primary);
        root.style.setProperty('--sidebar-secondary', theme.sidebar.secondary);
        root.style.setProperty('--sidebar-text', theme.sidebar.text);
        root.style.setProperty('--sidebar-background', theme.sidebar.background);
        root.style.setProperty('--background-primary', theme.background.primary);
        root.style.setProperty('--background-secondary', theme.background.secondary);
    }, [theme]);

    const updateTheme = (newTheme) => {
        setTheme(newTheme);
    };

    const resetTheme = () => {
        const defaultTheme = {
            header: {
                primary: '#00ff88',
                secondary: '#00cc6a',
                text: '#ffffff'
            },
            sidebar: {
                primary: '#00ff88',
                secondary: '#00cc6a',
                text: '#ffffff',
                background: '#1a1a1a'
            },
            background: {
                primary: '#f8f9fa',
                secondary: '#ffffff'
            }
        };
        setTheme(defaultTheme);
    };

    const value = {
        theme,
        updateTheme,
        resetTheme
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};
