import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import EventList from './pages/EventList';
import EventForm from './pages/EventForm';
import EventDetail from './pages/EventDetail';
import EventCalendar from './pages/EventCalendar';
import MunicipalityManagement from './pages/MunicipalityManagement';
import DevelopmentAreaManagement from './pages/DevelopmentAreaManagement';
import VenueHistoryManagement from './pages/VenueHistoryManagement';
import SchoolManagement from './pages/SchoolManagement';

// Styles
import './App.css';

function App() {
    return (
        <Router>
            <div className="App">
                <Header />
                <div className="app-container">
                    <Sidebar />
                    <main className="main-content">
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/dashboard" element={<Dashboard />} />

                            {/* 開催予定関連 */}
                            <Route path="/events" element={<EventList />} />
                            <Route path="/events/new" element={<EventForm />} />
                            <Route path="/events/:id" element={<EventDetail />} />
                            <Route path="/events/:id/edit" element={<EventForm />} />

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
                            <Route path="/reports" element={<div className="page-placeholder">レポート（実装中）</div>} />
                        </Routes>
                    </main>
                </div>
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
    );
}

export default App;
