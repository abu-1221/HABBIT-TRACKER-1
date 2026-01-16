// ===== Notifications Module - Push Notification System =====

const NotificationsModule = {
    permission: 'default',
    scheduledNotifications: [],

    async init() {
        await this.requestPermission();
        this.scheduleHabitNotifications();
        this.scheduleTaskReminders();
        
        // Re-schedule every hour
        setInterval(() => {
            this.scheduleHabitNotifications();
            this.scheduleTaskReminders();
        }, 60 * 60 * 1000);
    },

    async requestPermission() {
        if (!('Notification' in window)) {
            console.log('This browser does not support notifications');
            return false;
        }

        if (Notification.permission === 'granted') {
            this.permission = 'granted';
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            this.permission = permission;
            
            if (permission === 'granted') {
                this.showWelcomeNotification();
                return true;
            }
        }

        return false;
    },

    showWelcomeNotification() {
        this.showNotification(
            '🎉 Notifications Enabled!',
            'You\'ll now receive reminders for your habits and tasks.',
            'welcome'
        );
    },

    showNotification(title, body, tag = 'default', data = {}) {
        if (this.permission !== 'granted') {
            console.log('Notification permission not granted');
            return;
        }

        const options = {
            body,
            icon: './icon-192.png',
            badge: './icon-192.png',
            tag,
            vibrate: [200, 100, 200],
            requireInteraction: false,
            data,
            actions: [
                {
                    action: 'complete',
                    title: '✅ Mark Complete'
                },
                {
                    action: 'dismiss',
                    title: 'Dismiss'
                }
            ]
        };

        // Use service worker if available, otherwise use standard notification
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(title, options);
            });
        } else {
            new Notification(title, options);
        }
    },

    scheduleHabitNotifications() {
        const habits = Storage.get(Storage.KEYS.HABITS) || [];
        const today = new Date();
        const todayStr = today.toDateString();
        
        habits.forEach(habit => {
            // Skip if already completed today
            if (habit.completions?.includes(todayStr)) {
                return;
            }

            // Check if habit is due today
            const dayOfWeek = today.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            
            let isDueToday = false;
            if (habit.frequency === 'daily') isDueToday = true;
            if (habit.frequency === 'weekdays' && !isWeekend) isDueToday = true;
            if (habit.frequency === 'weekends' && isWeekend) isDueToday = true;
            
            if (!isDueToday) return;

            // Schedule notification if specific time is set
            if (habit.specificTime) {
                this.scheduleTimeBasedNotification(habit);
            } else {
                // Schedule based on time of day
                this.scheduleGeneralNotification(habit);
            }
        });
    },

    scheduleTimeBasedNotification(habit) {
        const now = new Date();
        const [hours, minutes] = habit.specificTime.split(':').map(Number);
        
        const scheduledTime = new Date();
        scheduledTime.setHours(hours, minutes, 0, 0);
        
        // If time has passed today, skip
        if (scheduledTime <= now) {
            return;
        }

        const timeUntil = scheduledTime - now;
        
        // Schedule notification
        setTimeout(() => {
            this.showNotification(
                `⏰ Time for: ${habit.name}`,
                `It's ${habit.specificTime}! Time to complete your habit.`,
                `habit-${habit.id}`,
                { type: 'habit', id: habit.id }
            );
        }, timeUntil);
    },

    scheduleGeneralNotification(habit) {
        const now = new Date();
        const hour = now.getHours();
        
        let notifyHour = 9; // Default
        
        switch (habit.preferredTime) {
            case 'morning':
                notifyHour = hour < 9 ? 9 : null;
                break;
            case 'afternoon':
                notifyHour = hour < 14 ? 14 : null;
                break;
            case 'evening':
                notifyHour = hour < 18 ? 18 : null;
                break;
            default:
                notifyHour = null; // Don't notify for 'anytime'
        }

        if (notifyHour) {
            const scheduledTime = new Date();
            scheduledTime.setHours(notifyHour, 0, 0, 0);
            
            if (scheduledTime > now) {
                const timeUntil = scheduledTime - now;
                
                setTimeout(() => {
                    this.showNotification(
                        `🔥 Habit Reminder: ${habit.name}`,
                        `Don't break your ${habit.streak || 0} day streak!`,
                        `habit-${habit.id}`,
                        { type: 'habit', id: habit.id }
                    );
                }, timeUntil);
            }
        }
    },

    scheduleTaskReminders() {
        const tasks = Storage.get(Storage.KEYS.TASKS) || [];
        const now = new Date();
        
        tasks.forEach(task => {
            if (task.completed || !task.deadline) return;
            
            const deadline = new Date(task.deadline);
            const timeUntil = deadline - now;
            
            // Notify 1 day before deadline
            const oneDayBefore = timeUntil - (24 * 60 * 60 * 1000);
            if (oneDayBefore > 0 && oneDayBefore < 60 * 60 * 1000) { // Within next hour
                setTimeout(() => {
                    this.showNotification(
                        `📌 Task Due Tomorrow: ${task.title}`,
                        `Priority: ${task.priority.toUpperCase()}`,
                        `task-${task.id}`,
                        { type: 'task', id: task.id }
                    );
                }, oneDayBefore);
            }
            
            // Notify 1 hour before deadline
            const oneHourBefore = timeUntil - (60 * 60 * 1000);
            if (oneHourBefore > 0 && oneHourBefore < 60 * 60 * 1000) {
                setTimeout(() => {
                    this.showNotification(
                        `⚠️ Task Due Soon: ${task.title}`,
                        `Due in 1 hour! Priority: ${task.priority.toUpperCase()}`,
                        `task-${task.id}`,
                        { type: 'task', id: task.id }
                    );
                }, oneHourBefore);
            }
            
            // Notify when overdue
            if (timeUntil < 0 && Math.abs(timeUntil) < 60 * 60 * 1000) {
                this.showNotification(
                    `🚨 Task Overdue: ${task.title}`,
                    `This task is now overdue!`,
                    `task-${task.id}`,
                    { type: 'task', id: task.id }
                );
            }
        });
    },

    // Daily morning summary
    showDailySummary() {
        const habits = HabitsModule.getTodayHabits?.() || [];
        const tasks = Storage.get(Storage.KEYS.TASKS) || [];
        const activeTasks = tasks.filter(t => !t.completed).length;
        
        this.showNotification(
            '🌅 Good Morning!',
            `You have ${habits.length} habits and ${activeTasks} tasks today.`,
            'daily-summary'
        );
    },

    // End of day reminder
    showEndOfDayReminder() {
        const habits = Storage.get(Storage.KEYS.HABITS) || [];
        const today = new Date().toDateString();
        
        const pending = habits.filter(h => {
            const todayHabits = HabitsModule.getTodayHabits?.() || [];
            return todayHabits.some(th => th.id === h.id) && !h.completions?.includes(today);
        }).length;
        
        if (pending > 0) {
            this.showNotification(
                '🌙 Before You Sleep...',
                `You have ${pending} habit${pending > 1 ? 's' : ''} left to complete today!`,
                'end-of-day'
            );
        }
    },

    // Schedule daily notifications
    scheduleDailyNotifications() {
        const now = new Date();
        
        // Morning summary at 8 AM
        const morning = new Date();
        morning.setHours(8, 0, 0, 0);
        if (morning > now) {
            setTimeout(() => this.showDailySummary(), morning - now);
        }
        
        // Evening reminder at 9 PM
        const evening = new Date();
        evening.setHours(21, 0, 0, 0);
        if (evening > now) {
            setTimeout(() => this.showEndOfDayReminder(), evening - now);
        }
    }
};
