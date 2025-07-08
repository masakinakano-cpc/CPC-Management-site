import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Contexts
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';

// Components
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EventList from './pages/EventList';
import EventForm from './pages/EventForm';
import EventDetail from './pages/EventDetail';
import EventCalendar from './pages/EventCalendar';
import EventMultiView from './pages/EventMultiView';
import MunicipalityManagement from './pages/MunicipalityManagement';
import DevelopmentAreaManagement from './pages/DevelopmentAreaManagement';
import VenueHistoryManagement from './pages/VenueHistoryManagement';
import SchoolManagement from './pages/SchoolManagement';
import NotificationManagement from './pages/NotificationManagement';
import UserManagement from './pages/UserManagement';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

// Styles
import './App.css';

function App() {
    return (
        <AuthProvider>
            <ThemeProvider>
                <Router>
                    <div className="App">
                        <Routes>
                            {/* ログイン画面（認証不要） */}
                            <Route path="/login" element={<Login />} />

                            {/* ルートパス - 認証状態に応じてリダイレクト */}
                            <Route path="/" element={
                                <ProtectedRoute>
                                    <Navigate to="/dashboard" replace />
                                </ProtectedRoute>
                            } />

                            {/* 保護されたルート（認証必要） */}
                            <Route path="/*" element={
                                <ProtectedRoute>
                                    <>
                                        <Header />
                                        <div className="app-container">
                                            <Sidebar />
                                            <main className="main-content">
                                                <Routes>
                                                    <Route path="/dashboard" element={<Dashboard />} />

                                                    {/* 開催予定関連 */}
                                                    <Route path="/events" element={<EventList />} />
                                                    <Route path="/events/new" element={<EventForm />} />
                                                    <Route path="/events/:id" element={<EventDetail />} />
                                                    <Route path="/events/:id/edit" element={<EventForm />} />

                                                    {/* マルチビュー */}
                                                    <Route path="/multi-view" element={<EventMultiView />} />

                                                    {/* カレンダー */}
                                                    <Route path="/calendar" element={<EventCalendar />} />
                                                    <Route path="/masters/municipalities" element={<MunicipalityManagement />} />
                                                    <Route path="/masters/development-areas" element={<DevelopmentAreaManagement />} />
                                                    <Route path="/masters/venue-histories" element={<VenueHistoryManagement />} />
                                                    <Route path="/masters/schools" element={<SchoolManagement />} />

                                                    {/* マスタ管理 */}
                                                    <Route path="/municipalities" element={<div className="page-placeholder">市区町村（実装中）</div>} />
                                                    <Route path="/development-areas" element={<div className="page-placeholder">開拓地域（実装中）</div>} />
                                                    <Route path="/venue-histories" element={<div className="page-placeholder">実施リスト（実装中）</div>} />
                                                    <Route path="/schools" element={<div className="page-placeholder">全国小学校（実装中）</div>} />

                                                    {/* レポート */}
                                                    <Route path="/reports" element={<Reports />} />

                                                    {/* 通知管理 */}
                                                    <Route path="/notifications" element={<NotificationManagement />} />

                                                    {/* ユーザー管理 */}
                                                    <Route path="/users" element={<UserManagement />} />

                                                    {/* 設定 */}
                                                    <Route path="/settings" element={<Settings />} />
                                                </Routes>
                                            </main>
                                        </div>
                                    </>
                                </ProtectedRoute>
                            } />
                        </Routes>

                        <ToastContainer
                            position="top-right"
                            autoClose={3000}
                            hideProgressBar={false}
                            newestOnTop={false}
                            closeOnClick
                            rtl={false}
                            pauseOnFocusLoss
                            draggable
                            pauseOnHover
                        />
                    </div>
                </Router>
            </ThemeProvider>
        </AuthProvider>
    );
}

export default App;
