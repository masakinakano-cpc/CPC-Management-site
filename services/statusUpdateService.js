const { Event } = require('../models');

class StatusUpdateService {
    /**
     * 全イベントのステータスを現在の日付に基づいて自動更新
     */
    static async updateAllEventStatuses() {
        try {
            console.log('Starting automatic status update...');

            const events = await Event.findAll({
                where: {
                    eventStatus: {
                        [require('sequelize').Op.notIn]: ['実施済み', '中止']
                    }
                }
            });

            let updatedCount = 0;
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth() + 1;

            for (const event of events) {
                let newStatus = event.eventStatus;

                // 該当月の場合（実施中に変更）
                if (event.eventYear === currentYear && event.eventMonth === currentMonth) {
                    if (['構想', '実施予定', '準備着手中'].includes(event.eventStatus)) {
                        newStatus = '実施中';
                    }
                }
                // 該当月が過ぎた場合（実施済みに変更）
                else if (event.eventYear < currentYear ||
                    (event.eventYear === currentYear && event.eventMonth < currentMonth)) {
                    if (['構想', '実施予定', '準備着手中', '実施中'].includes(event.eventStatus)) {
                        newStatus = '実施済み';
                    }
                }

                if (newStatus !== event.eventStatus) {
                    await event.update({ eventStatus: newStatus });
                    updatedCount++;
                    console.log(`Updated event ${event.id}: ${event.eventStatus} → ${newStatus}`);
                }
            }

            console.log(`Status update completed. Updated ${updatedCount} events.`);
            return { updatedCount, totalChecked: events.length };

        } catch (error) {
            console.error('Error in status update:', error);
            throw error;
        }
    }

    /**
     * 3ヶ月前のリマインド対象イベントを検索
     */
    static async findEventsForReminder() {
        try {
            const now = new Date();
            const threeMonthsLater = new Date();
            threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

            const targetYear = threeMonthsLater.getFullYear();
            const targetMonth = threeMonthsLater.getMonth() + 1;

            // 前年の同月に実施済みのイベント
            const lastYearEvents = await Event.findAll({
                where: {
                    eventYear: targetYear - 1,
                    eventMonth: targetMonth,
                    eventStatus: '実施済み'
                },
                include: [
                    { association: 'Municipality' },
                    { association: 'DevelopmentArea' },
                    { association: 'VenueHistory' }
                ]
            });

            console.log(`Found ${lastYearEvents.length} events for reminder (3 months ahead)`);
            return lastYearEvents;

        } catch (error) {
            console.error('Error finding reminder events:', error);
            throw error;
        }
    }

    /**
     * 次年度開催候補を自動生成
     */
    static async generateNextYearCandidates() {
        try {
            console.log('Generating next year candidates...');

            const reminderEvents = await this.findEventsForReminder();
            const newCandidates = [];

            for (const lastYearEvent of reminderEvents) {
                const nextYear = lastYearEvent.eventYear + 1;

                // 既に次年度の候補が存在するかチェック
                const existingCandidate = await Event.findOne({
                    where: {
                        eventYear: nextYear,
                        eventMonth: lastYearEvent.eventMonth,
                        municipalityId: lastYearEvent.municipalityId
                    }
                });

                if (!existingCandidate) {
                    // 新しい候補を作成
                    const candidateData = {
                        eventYear: nextYear,
                        eventMonth: lastYearEvent.eventMonth,
                        lineCount: lastYearEvent.lineCount, // 前年度のライン数を引き継ぎ
                        eventStatus: '構想',
                        municipalityId: lastYearEvent.municipalityId,
                        developmentAreaId: lastYearEvent.developmentAreaId,
                        venueHistoryId: lastYearEvent.venueHistoryId, // 会場も引き継ぎ
                        remarks: `前年度開催実績に基づく自動生成候補（${lastYearEvent.eventYear}年${lastYearEvent.eventMonth}月開催実績）`
                    };

                    const newCandidate = await Event.create(candidateData);
                    newCandidates.push(newCandidate);

                    console.log(`Generated candidate: ${nextYear}年${lastYearEvent.eventMonth}月 at ${lastYearEvent.Municipality?.name}`);
                }
            }

            console.log(`Generated ${newCandidates.length} new candidates for next year`);
            return newCandidates;

        } catch (error) {
            console.error('Error generating next year candidates:', error);
            throw error;
        }
    }
}

module.exports = StatusUpdateService;
