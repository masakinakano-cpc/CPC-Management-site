import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import timelinePlugin from '@fullcalendar/timeline';
import interactionPlugin from '@fullcalendar/interaction';
import multiMonthPlugin from '@fullcalendar/multimonth';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import apiService from '../services/apiService';
import EventForm from './EventForm';
import './EventCalendar.css';

const EventCalendar = () => {
    const [events, setEvents] = useState([]);
    const [calendarEvents, setCalendarEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewType, setViewType] = useState('dayGridMonth');
    const [showEventForm, setShowEventForm] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [initialEventData, setInitialEventData] = useState(null);

    const calendarRef = useRef(null);

    // イベントデータの取得
    const fetchEvents = async () => {
        try {
            setLoading(true);
            const response = await apiService.getEvents();
            setEvents(response.data);
            convertEventsForCalendar(response.data);
        } catch (err) {
            setError('イベントデータの取得に失敗しました');
            console.error('Error fetching events:', err);
        } finally {
            setLoading(false);
        }
    };

    // イベントデータをFullCalendar用に変換
    const convertEventsForCalendar = (eventData) => {
        const converted = eventData.map(event => {
            // ステータスによる色分け
            let backgroundColor = '#3788d8';
            switch (event.status) {
                case '構想':
                    backgroundColor = '#95a5a6';
                    break;
                case '実施予定':
                    backgroundColor = '#f39c12';
                    break;
                case '準備着手中':
                    backgroundColor = '#e67e22';
                    break;
                case '実施中':
                    backgroundColor = '#27ae60';
                    break;
                case '実施済み':
                    backgroundColor = '#2c3e50';
                    break;
                case '中止':
                    backgroundColor = '#e74c3c';
                    break;
                default:
                    backgroundColor = '#3788d8';
            }

            return {
                id: event.id,
                title: `${event.DevelopmentArea?.name || '未設定'} (${event.lineCount || 0}名)`,
                start: event.startDate,
                end: event.endDate,
                backgroundColor,
                borderColor: backgroundColor,
                textColor: '#ffffff',
                extendedProps: {
                    event: event,
                    status: event.status,
                    region: event.DevelopmentArea?.name || '未設定',
                    lineCount: event.lineCount || 0,
                    venue: event.VenueHistory?.name || '未設定',
                    municipality: event.Municipality?.name || '未設定'
                }
            };
        });
        setCalendarEvents(converted);
    };

    // カレンダービューの変更
    const handleViewChange = (view) => {
        setViewType(view);
        if (calendarRef.current) {
            calendarRef.current.getApi().changeView(view);
        }
    };

    // イベントクリック処理
    const handleEventClick = (clickInfo) => {
        const event = clickInfo.event.extendedProps.event;
        setSelectedEvent(event);
        setInitialEventData({
            ...event,
            startDate: event.startDate,
            endDate: event.endDate
        });
        setShowEventForm(true);
    };

    // 日付クリック処理（新規イベント作成）
    const handleDateClick = (dateInfo) => {
        const startDate = format(dateInfo.date, 'yyyy-MM-dd');
        const endDate = startDate; // デフォルトで同日

        setSelectedEvent(null);
        setInitialEventData({
            startDate,
            endDate,
            status: '構想'
        });
        setShowEventForm(true);
    };

    // イベントドロップ処理（日付変更）
    const handleEventDrop = async (dropInfo) => {
        try {
            const event = dropInfo.event.extendedProps.event;
            const newStartDate = format(dropInfo.event.start, 'yyyy-MM-dd');
            const daysDiff = Math.round((dropInfo.event.start - parseISO(event.startDate)) / (1000 * 60 * 60 * 24));
            const newEndDate = format(new Date(parseISO(event.endDate).getTime() + daysDiff * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');

            await apiService.updateEvent(event.id, {
                ...event,
                startDate: newStartDate,
                endDate: newEndDate
            });

            // データを再取得
            fetchEvents();
        } catch (err) {
            console.error('Error updating event:', err);
            dropInfo.revert(); // エラー時は元に戻す
            setError('イベントの更新に失敗しました');
        }
    };

    // イベントリサイズ処理（期間変更）
    const handleEventResize = async (resizeInfo) => {
        try {
            const event = resizeInfo.event.extendedProps.event;
            const newEndDate = format(resizeInfo.event.end || resizeInfo.event.start, 'yyyy-MM-dd');

            await apiService.updateEvent(event.id, {
                ...event,
                endDate: newEndDate
            });

            // データを再取得
            fetchEvents();
        } catch (err) {
            console.error('Error updating event:', err);
            resizeInfo.revert(); // エラー時は元に戻す
            setError('イベントの更新に失敗しました');
        }
    };

    // イベントフォーム保存処理
    const handleEventSave = () => {
        fetchEvents(); // データを再取得
        setShowEventForm(false);
        setSelectedEvent(null);
        setInitialEventData(null);
    };

    // イベントフォームキャンセル処理
    const handleEventCancel = () => {
        setShowEventForm(false);
        setSelectedEvent(null);
        setInitialEventData(null);
    };

    // 今日に移動
    const goToToday = () => {
        if (calendarRef.current) {
            calendarRef.current.getApi().today();
        }
    };

    // 前の期間に移動
    const goToPrev = () => {
        if (calendarRef.current) {
            calendarRef.current.getApi().prev();
        }
    };

    // 次の期間に移動
    const goToNext = () => {
        if (calendarRef.current) {
            calendarRef.current.getApi().next();
        }
    };

    // コンポーネント初期化
    useEffect(() => {
        fetchEvents();
    }, []);

    if (loading) {
        return (
            <div className="calendar-container">
                <div className="loading">読み込み中...</div>
            </div>
        );
    }

    return (
        <div className="calendar-container">
            <div className="calendar-header">
                <div className="calendar-title">
                    <h1>開催予定カレンダー</h1>
                    <div className="calendar-stats">
                        総イベント数: {events.length}件
                    </div>
                </div>

                <div className="calendar-controls">
                    <div className="view-buttons">
                        <button
                            className={viewType === 'dayGridMonth' ? 'active' : ''}
                            onClick={() => handleViewChange('dayGridMonth')}
                        >
                            月表示
                        </button>
                        <button
                            className={viewType === 'multiMonthYear' ? 'active' : ''}
                            onClick={() => handleViewChange('multiMonthYear')}
                        >
                            年表示
                        </button>
                        <button
                            className={viewType === 'timelineYear' ? 'active' : ''}
                            onClick={() => handleViewChange('timelineYear')}
                        >
                            ガントチャート
                        </button>
                    </div>

                    <div className="navigation-buttons">
                        <button onClick={goToPrev}>前へ</button>
                        <button onClick={goToToday}>今日</button>
                        <button onClick={goToNext}>次へ</button>
                    </div>
                </div>
            </div>

            <div className="calendar-legend">
                <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#95a5a6' }}></span>
                    <span>構想</span>
                </div>
                <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#f39c12' }}></span>
                    <span>実施予定</span>
                </div>
                <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#e67e22' }}></span>
                    <span>準備着手中</span>
                </div>
                <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#27ae60' }}></span>
                    <span>実施中</span>
                </div>
                <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#2c3e50' }}></span>
                    <span>実施済み</span>
                </div>
                <div className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: '#e74c3c' }}></span>
                    <span>中止</span>
                </div>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                    <button onClick={() => setError(null)}>×</button>
                </div>
            )}

            <div className="calendar-wrapper">
                <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, timelinePlugin, interactionPlugin, multiMonthPlugin]}
                    initialView={viewType}
                    locale="ja"
                    headerToolbar={false} // カスタムヘッダーを使用
                    events={calendarEvents}
                    editable={true}
                    droppable={true}
                    eventClick={handleEventClick}
                    dateClick={handleDateClick}
                    eventDrop={handleEventDrop}
                    eventResize={handleEventResize}
                    height="auto"
                    dayMaxEvents={3}
                    eventDisplay="block"
                    eventTextColor="#ffffff"
                    views={{
                        multiMonthYear: {
                            type: 'multiMonth',
                            duration: { months: 12 },
                            multiMonthMaxColumns: 4
                        },
                        timelineYear: {
                            type: 'timeline',
                            duration: { months: 12 },
                            slotDuration: { months: 1 }
                        }
                    }}
                    eventContent={(eventInfo) => {
                        const { region, lineCount, venue } = eventInfo.event.extendedProps;
                        return (
                            <div className="event-content">
                                <div className="event-title">{region}</div>
                                <div className="event-details">
                                    <span className="line-count">{lineCount}名</span>
                                    {viewType === 'timelineYear' && (
                                        <span className="venue-name">{venue}</span>
                                    )}
                                </div>
                            </div>
                        );
                    }}
                />
            </div>

            {showEventForm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <EventForm
                            event={selectedEvent}
                            initialData={initialEventData}
                            onSave={handleEventSave}
                            onCancel={handleEventCancel}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventCalendar;
