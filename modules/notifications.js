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
        
        // Schedule 5-minute pre-reminder
        const fiveMinBefore = timeUntil - (5 * 60 * 1000);
        if (fiveMinBefore > 0) {
            setTimeout(() => {
                this.showNotification(
                    `⏱️ Coming Up: ${habit.name}`,
                    `In 5 minutes at ${habit.specificTime}. Get ready!`,
                    `habit-pre-${habit.id}`,
                    { type: 'habit', id: habit.id, pre: true }
                );
            }, fiveMinBefore);
        }
        
        // Schedule main notification
        setTimeout(() => {
            this.showNotification(
                `⏰ Time for: ${habit.name}`,
                `It's ${habit.specificTime}! Time to complete your habit.`,
                `habit-${habit.id}`,
                { type: 'habit', id: habit.id }
            );
            
            // Schedule follow-up if not completed after 10 minutes
            setTimeout(() => {
                const today = new Date().toDateString();
                const habits = Storage.get(Storage.KEYS.HABITS) || [];
                const habitData = habits.find(h => h.id === habit.id);
                
                if (habitData && !habitData.completions?.includes(today)) {
                    this.showNotification(
                        `🔔 Reminder: ${habit.name}`,
                        `Haven't completed yet. Don't break your streak!`,
                        `habit-reminder-${habit.id}`,
                        { type: 'habit', id: habit.id, reminder: true }
                    );
                }
            }, 10 * 60 * 1000);
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
            if (oneDayBefore > 0 && oneDayBefore < 60 * 60 * 1000) {
                setTimeout(() => {
                    this.showNotification(
                        `📌 Task Due Tomorrow: ${task.title}`,
                        `Priority: ${task.priority.toUpperCase()}. Complete it soon!`,
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
                        `Only 1 hour left! Priority: ${task.priority.toUpperCase()}`,
                        `task-${task.id}`,
                        { type: 'task', id: task.id }
                    );
                }, oneHourBefore);
            }
            
            // Notify 5 minutes before deadline
            const fiveMinBefore = timeUntil - (5 * 60 * 1000);
            if (fiveMinBefore > 0 && fiveMinBefore < 60 * 60 * 1000) {
                setTimeout(() => {
                    this.showNotification(
                        `🚨 URGENT: ${task.title}`,
                        `Due in 5 minutes! Complete NOW!`,
                        `task-urgent-${task.id}`,
                        { type: 'task', id: task.id, urgent: true }
                    );
                }, fiveMinBefore);
            }
            
            // Notify when overdue
            if (timeUntil < 0 && Math.abs(timeUntil) < 60 * 60 * 1000) {
                this.showNotification(
                    `🚨 Task Overdue: ${task.title}`,
                    `This task is now overdue! Complete ASAP!`,
                    `task-overdue-${task.id}`,
                    { type: 'task', id: task.id, overdue: true }
                );
            }
        });
    },

    // Show next upcoming event
    showNextEvent() {
        const habits = Storage.get(Storage.KEYS.HABITS) || [];
        const tasks = Storage.get(Storage.KEYS.TASKS) || [];
        const now = new Date();
        const today = now.toDateString();
        
        // Find next habit
        let nextHabit = null;
        let nextHabitTime = null;
        
        habits.forEach(habit => {
            if (habit.completions?.includes(today)) return; // Already completed
            
            if (habit.specificTime) {
                const [hours, minutes] = habit.specificTime.split(':').map(Number);
                const habitTime = new Date();
                habitTime.setHours(hours, minutes, 0, 0);
                
                if (habitTime > now) {
                    if (!nextHabitTime || habitTime < nextHabitTime) {
                        nextHabitTime = habitTime;
                        nextHabit = habit;
                    }
                }
            }
        });
        
        // Find next task
        let nextTask = null;
        let nextTaskTime = null;
        
        tasks.forEach(task => {
            if (task.completed || !task.deadline) return;
            
            const deadline = new Date(task.deadline);
            if (deadline > now) {
                if (!nextTaskTime || deadline < nextTaskTime) {
                    nextTaskTime = deadline;
                    nextTask = task;
                }
            }
        });
        
        // Show next event
        if (nextHabit && (!nextTask || nextHabitTime < nextTaskTime)) {
            const timeUntil = Math.floor((nextHabitTime - now) / (60 * 1000));
            return {
                type: 'habit',
                name: nextHabit.name,
                time: nextHabit.specificTime,
                minutesUntil: timeUntil
            };
        } else if (nextTask) {
            const timeUntil = Math.floor((nextTaskTime - now) / (60 * 1000));
            return {
                type: 'task',
                name: nextTask.title,
                deadline: nextTask.deadline,
                minutesUntil: timeUntil
            };
        }
        
        return null;
    },

    // Notify about next event after completion
    notifyNextEvent(completedType, completedItem) {
        const nextEvent = this.showNextEvent();
        
        if (nextEvent) {
            setTimeout(() => {
                if (nextEvent.type === 'habit') {
                    this.showNotification(
                        `✅ Great! Next up: ${nextEvent.name}`,
                        `Scheduled at ${nextEvent.time} (in ${nextEvent.minutesUntil} min)`,
                        'next-event',
                        { type: 'next-event', data: nextEvent }
                    );
                } else {
                    const hours = Math.floor(nextEvent.minutesUntil / 60);
                    const mins = nextEvent.minutesUntil % 60;
                    const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
                    
                    this.showNotification(
                        `✅ Great! Next task: ${nextEvent.name}`,
                        `Due in ${timeStr}`,
                        'next-event',
                        { type: 'next-event', data: nextEvent }
                    );
                }
            }, 2000); // Small delay after completion
        } else {
            // No more events today
            setTimeout(() => {
                this.showNotification(
                    `🎉 All Done for Today!`,
                    `You've completed everything! Great job!`,
                    'all-done',
                    { type: 'completion' }
                );
            }, 2000);
        }
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
