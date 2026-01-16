// ===== AI Engine - Client-Side Intelligence Module =====

const AIEngine = {
    // Heuristic weights for focus score calculation
    WEIGHTS: {
        DEEP_WORK: 35,
        TASK_COMPLETION: 30,
        CONSISTENCY: 20,
        IDLE_PENALTY: -10,
        OVERDUE_PENALTY: -15
    },

    // Time-based productivity patterns
    PRODUCTIVITY_PATTERNS: {
        morning: { start: 6, end: 12, multiplier: 1.2, label: 'Morning Peak' },
        afternoon: { start: 12, end: 17, multiplier: 0.9, label: 'Afternoon Focus' },
        evening: { start: 17, end: 22, multiplier: 0.8, label: 'Evening Wind-down' },
        night: { start: 22, end: 6, multiplier: 0.6, label: 'Night Mode' }
    },

    // Calculate focus score using heuristic algorithm
    calculateFocusScore() {
        const todayStats = Storage.getTodayStats();
        const tasks = Storage.get(Storage.KEYS.TASKS) || [];
        const habits = Storage.get(Storage.KEYS.HABITS) || [];
        const profile = Storage.get(Storage.KEYS.USER_PROFILE);
        
        let score = 50; // Base score
        
        // Deep work contribution (based on focus sessions)
        const focusMinutes = todayStats.focusTime || 0;
        const deepWorkScore = Math.min(focusMinutes / 120, 1) * this.WEIGHTS.DEEP_WORK;
        
        // Task completion contribution
        const todayTasks = tasks.filter(t => this.isToday(t.createdAt) || this.isToday(t.completedAt));
        const completedToday = todayTasks.filter(t => t.completed && this.isToday(t.completedAt)).length;
        const totalTodayTasks = Math.max(todayTasks.length, 1);
        const taskScore = (completedToday / totalTodayTasks) * this.WEIGHTS.TASK_COMPLETION;
        
        // Consistency bonus (streak-based)
        const streakDays = profile?.streak || 0;
        const consistencyScore = Math.min(streakDays / 7, 1) * this.WEIGHTS.CONSISTENCY;
        
        // Idle penalty
        const idleMinutes = todayStats.idleTime || 0;
        const idlePenalty = Math.min(idleMinutes / 60, 1) * Math.abs(this.WEIGHTS.IDLE_PENALTY);
        
        // Overdue tasks penalty
        const overdueTasks = tasks.filter(t => !t.completed && t.deadline && new Date(t.deadline) < new Date());
        const overduePenalty = Math.min(overdueTasks.length * 3, Math.abs(this.WEIGHTS.OVERDUE_PENALTY));
        
        // Calculate final score
        score = score + deepWorkScore + taskScore + consistencyScore - idlePenalty - overduePenalty;
        score = Math.max(0, Math.min(100, Math.round(score)));
        
        // Store the calculated score
        Storage.updateTodayStats({ focusScore: score });
        
        return {
            total: score,
            breakdown: {
                deepWork: Math.round(deepWorkScore),
                taskCompletion: Math.round(taskScore),
                consistency: Math.round(consistencyScore),
                idlePenalty: Math.round(idlePenalty),
                overduePenalty: Math.round(overduePenalty)
            },
            metrics: {
                focusMinutes,
                completedTasks: completedToday,
                totalTasks: totalTodayTasks,
                streakDays,
                overdueTasks: overdueTasks.length
            }
        };
    },

    // Determine current mood based on multiple factors
    determineMood() {
        const focusData = this.calculateFocusScore();
        const hour = new Date().getHours();
        const todayStats = Storage.getTodayStats();
        
        // Factor in time of day
        const timeWeight = this.getTimeWeight();
        
        // Determine mood
        if (focusData.total >= 75 && todayStats.focusSessions >= 2) {
            return { mood: 'focused', label: 'Focused', color: 'purple', description: 'Deep in the zone!' };
        } else if (focusData.total >= 50 && hour >= 6 && hour <= 20) {
            return { mood: 'calm', label: 'Calm', color: 'green', description: 'Steady and productive' };
        } else if (focusData.metrics.overdueTasks > 2 || (hour >= 9 && hour <= 18 && focusData.total < 30)) {
            return { mood: 'alert', label: 'Alert', color: 'orange', description: 'Time to refocus!' };
        } else {
            return { mood: 'low', label: 'Low Energy', color: 'gray', description: 'Consider taking a break' };
        }
    },

    // Get productivity weight based on time of day
    getTimeWeight() {
        const hour = new Date().getHours();
        
        for (const [period, data] of Object.entries(this.PRODUCTIVITY_PATTERNS)) {
            if (period === 'night') {
                if (hour >= data.start || hour < data.end) return data;
            } else {
                if (hour >= data.start && hour < data.end) return data;
            }
        }
        return this.PRODUCTIVITY_PATTERNS.afternoon;
    },

    // AI-powered task prioritization
    prioritizeTasks(tasks) {
        const now = new Date();
        
        return tasks.map(task => {
            let urgencyScore = 0;
            
            // Priority weight
            const priorityWeights = { high: 30, medium: 20, low: 10 };
            urgencyScore += priorityWeights[task.priority] || 20;
            
            // Deadline proximity weight
            if (task.deadline) {
                const deadline = new Date(task.deadline);
                const hoursUntilDeadline = (deadline - now) / (1000 * 60 * 60);
                
                if (hoursUntilDeadline < 0) {
                    urgencyScore += 50; // Overdue
                } else if (hoursUntilDeadline < 24) {
                    urgencyScore += 40; // Due today
                } else if (hoursUntilDeadline < 72) {
                    urgencyScore += 25; // Due in 3 days
                } else if (hoursUntilDeadline < 168) {
                    urgencyScore += 15; // Due in a week
                }
            }
            
            // Age weight (older tasks get slight priority)
            const ageHours = (now - new Date(task.createdAt)) / (1000 * 60 * 60);
            if (ageHours > 48) urgencyScore += 10;
            
            return { ...task, urgencyScore };
        }).sort((a, b) => b.urgencyScore - a.urgencyScore);
    },

    // Generate AI insights based on user behavior
    generateInsights() {
        const focusData = this.calculateFocusScore();
        const tasks = Storage.get(Storage.KEYS.TASKS) || [];
        const habits = Storage.get(Storage.KEYS.HABITS) || [];
        const dailyStats = Storage.get(Storage.KEYS.DAILY_STATS) || {};
        const profile = Storage.get(Storage.KEYS.USER_PROFILE);
        const timeInfo = this.getTimeWeight();
        const insights = [];
        
        // Productivity time insight
        insights.push({
            type: 'info',
            icon: 'clock',
            title: 'Peak Productivity',
            message: `You're in your ${timeInfo.label} period. ${timeInfo.multiplier >= 1 ? 'Great time for deep work!' : 'Consider lighter tasks.'}`
        });
        
        // Focus score insight
        if (focusData.total >= 80) {
            insights.push({
                type: 'success',
                icon: 'trophy',
                title: 'Excellent Focus!',
                message: 'Your focus score is outstanding today. Keep up the momentum!'
            });
        } else if (focusData.total < 40) {
            insights.push({
                type: 'warning',
                icon: 'alert-triangle',
                title: 'Focus Needs Attention',
                message: 'Try a 25-minute focus session to boost your score.'
            });
        }
        
        // Overdue tasks insight
        const overdueTasks = tasks.filter(t => !t.completed && t.deadline && new Date(t.deadline) < new Date());
        if (overdueTasks.length > 0) {
            insights.push({
                type: 'warning',
                icon: 'alert-circle',
                title: `${overdueTasks.length} Overdue Task${overdueTasks.length > 1 ? 's' : ''}`,
                message: 'These tasks need immediate attention to improve your focus score.'
            });
        }
        
        // Streak insight
        if (profile?.streak >= 7) {
            insights.push({
                type: 'success',
                icon: 'flame',
                title: `${profile.streak} Day Streak!`,
                message: 'Amazing consistency! You\'re building great habits.'
            });
        }
        
        // Habit completion insight
        const todayHabitCompletions = this.getTodayHabitCompletions(habits);
        const habitPercentage = habits.length > 0 ? Math.round((todayHabitCompletions / habits.length) * 100) : 0;
        if (habits.length > 0 && habitPercentage < 50) {
            insights.push({
                type: 'info',
                icon: 'target',
                title: 'Habits Pending',
                message: `You've completed ${habitPercentage}% of today's habits. Keep going!`
            });
        }
        
        return insights;
    },

    // Get today's habit completions
    getTodayHabitCompletions(habits) {
        const today = new Date().toDateString();
        return habits.filter(h => h.completions && h.completions.includes(today)).length;
    },

    // Generate habit recommendations
    generateHabitRecommendations(habits) {
        const recommendations = [];
        const timeInfo = this.getTimeWeight();
        const hour = new Date().getHours();
        
        // Find weak habits (low completion rate)
        habits.forEach(habit => {
            const completionRate = this.calculateHabitCompletionRate(habit);
            if (completionRate < 50) {
                recommendations.push({
                    type: 'weak',
                    habit: habit.name,
                    message: `"${habit.name}" has a ${completionRate}% completion rate. Try setting a reminder!`
                });
            }
        });
        
        // Time-based recommendations
        if (hour >= 6 && hour < 10) {
            const morningHabits = habits.filter(h => h.preferredTime === 'morning');
            if (morningHabits.length > 0) {
                const incomplete = morningHabits.filter(h => !h.completions?.includes(new Date().toDateString()));
                if (incomplete.length > 0) {
                    recommendations.push({
                        type: 'timing',
                        message: `Great time to complete your morning habits: ${incomplete.map(h => h.name).join(', ')}`
                    });
                }
            }
        }
        
        // Suggest new habits if few exist
        if (habits.length < 3) {
            recommendations.push({
                type: 'suggestion',
                message: 'Consider adding more habits! Experts recommend 3-5 daily habits for optimal productivity.'
            });
        }
        
        return recommendations;
    },

    // Calculate habit completion rate
    calculateHabitCompletionRate(habit) {
        if (!habit.completions || habit.completions.length === 0) return 0;
        
        const createdDate = new Date(habit.createdAt);
        const today = new Date();
        const daysSinceCreation = Math.max(1, Math.ceil((today - createdDate) / (1000 * 60 * 60 * 24)));
        const completionRate = Math.round((habit.completions.length / daysSinceCreation) * 100);
        
        return Math.min(100, completionRate);
    },

    // Helper to check if a date is today
    isToday(dateString) {
        if (!dateString) return false;
        return new Date(dateString).toDateString() === new Date().toDateString();
    },

    // Generate response for AI Assistant
    generateResponse(query, context) {
        const q = query.toLowerCase();
        const focusData = this.calculateFocusScore();
        const mood = this.determineMood();
        const tasks = Storage.get(Storage.KEYS.TASKS) || [];
        const habits = Storage.get(Storage.KEYS.HABITS) || [];
        const profile = Storage.get(Storage.KEYS.USER_PROFILE);
        
        // Productivity queries
        if (q.includes('productivity') || q.includes('how am i doing') || q.includes('my progress')) {
            return this.getProductivityResponse(focusData, tasks, habits);
        }
        
        // Focus queries
        if (q.includes('focus') || q.includes('what should i')) {
            return this.getFocusRecommendation(focusData, tasks);
        }
        
        // Habit queries
        if (q.includes('habit')) {
            return this.getHabitAnalysis(habits);
        }
        
        // Task queries
        if (q.includes('task') || q.includes('to do') || q.includes('todo')) {
            return this.getTaskAnalysis(tasks);
        }
        
        // Tip requests
        if (q.includes('tip') || q.includes('advice') || q.includes('suggest')) {
            return this.getProductivityTip(focusData, mood);
        }
        
        // Greeting
        if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
            return this.getGreeting(mood, profile);
        }
        
        // Default response
        return this.getContextualResponse(focusData, mood, tasks, habits);
    },

    getProductivityResponse(focusData, tasks, habits) {
        const activeTasks = tasks.filter(t => !t.completed).length;
        const completedToday = tasks.filter(t => t.completed && this.isToday(t.completedAt)).length;
        
        return `📊 **Your Productivity Analysis**\n\n` +
            `• Focus Score: **${focusData.total}/100** ${focusData.total >= 70 ? '🎯' : focusData.total >= 40 ? '📈' : '⚠️'}\n` +
            `• Tasks Completed Today: **${completedToday}**\n` +
            `• Active Tasks: **${activeTasks}**\n` +
            `• Current Streak: **${focusData.metrics.streakDays} days**\n\n` +
            `${focusData.total >= 70 ? 'Excellent work! You\'re in the productivity zone.' : 
               focusData.total >= 40 ? 'Good progress! A focus session could boost your score.' : 
               'Consider starting a focus session to improve your productivity.'}`;
    },

    getFocusRecommendation(focusData, tasks) {
        const prioritized = this.prioritizeTasks(tasks.filter(t => !t.completed));
        const topTask = prioritized[0];
        
        if (!topTask) {
            return '✅ Great job! You have no pending tasks. Consider adding new goals or taking a well-deserved break.';
        }
        
        const urgencyLabel = topTask.urgencyScore > 60 ? '🔴 Urgent' : 
                            topTask.urgencyScore > 40 ? '🟡 Important' : '🟢 Normal';
        
        return `🎯 **Focus Recommendation**\n\n` +
            `Your highest priority task is:\n` +
            `**"${topTask.title}"** ${urgencyLabel}\n\n` +
            `${topTask.deadline ? `⏰ Due: ${new Date(topTask.deadline).toLocaleDateString()}\n` : ''}` +
            `I recommend starting a 25-minute focus session on this task.\n\n` +
            `_Based on deadline proximity, priority level, and task age._`;
    },

    getHabitAnalysis(habits) {
        if (habits.length === 0) {
            return '📋 You haven\'t set up any habits yet. Building consistent habits is key to long-term productivity. Try adding 2-3 daily habits to get started!';
        }
        
        const today = new Date().toDateString();
        const completed = habits.filter(h => h.completions?.includes(today)).length;
        const rates = habits.map(h => ({
            name: h.name,
            rate: this.calculateHabitCompletionRate(h)
        }));
        
        const bestHabit = rates.reduce((a, b) => a.rate > b.rate ? a : b);
        const weakHabit = rates.reduce((a, b) => a.rate < b.rate ? a : b);
        
        return `🔥 **Habit Analysis**\n\n` +
            `• Today's Progress: **${completed}/${habits.length}** habits completed\n` +
            `• Strongest Habit: **${bestHabit.name}** (${bestHabit.rate}% completion)\n` +
            `• Needs Attention: **${weakHabit.name}** (${weakHabit.rate}% completion)\n\n` +
            `_Tip: Try habit stacking - attach weaker habits to stronger ones!_`;
    },

    getTaskAnalysis(tasks) {
        const active = tasks.filter(t => !t.completed);
        const completed = tasks.filter(t => t.completed);
        const overdue = active.filter(t => t.deadline && new Date(t.deadline) < new Date());
        
        const byPriority = {
            high: active.filter(t => t.priority === 'high').length,
            medium: active.filter(t => t.priority === 'medium').length,
            low: active.filter(t => t.priority === 'low').length
        };
        
        return `📝 **Task Analysis**\n\n` +
            `• Total Tasks: **${tasks.length}** (${completed.length} completed)\n` +
            `• Active Tasks: **${active.length}**\n` +
            `  - High Priority: ${byPriority.high}\n` +
            `  - Medium Priority: ${byPriority.medium}\n` +
            `  - Low Priority: ${byPriority.low}\n` +
            `${overdue.length > 0 ? `• ⚠️ Overdue: **${overdue.length}** tasks need attention\n` : ''}` +
            `\n_Use the AI re-prioritize feature to optimize your task order!_`;
    },

    getProductivityTip(focusData, mood) {
        const tips = [
            '🎯 Try the 2-minute rule: If a task takes less than 2 minutes, do it now!',
            '⏰ Time-block your day: Assign specific hours to specific tasks.',
            '🧘 Take regular breaks: The Pomodoro technique suggests 5-min breaks every 25 minutes.',
            '📱 Reduce distractions: Put your phone in another room during focus time.',
            '✅ Start with your hardest task when energy is highest (usually morning).',
            '📝 Write tomorrow\'s tasks today: Start each day with a clear plan.',
            '🎵 Try focus music or white noise to improve concentration.',
            '💪 Small wins build momentum: Complete easy tasks to build motivation.',
            '🌙 Prioritize sleep: Well-rested minds focus 50% better.',
            '📊 Review weekly: Track what works and adjust your approach.'
        ];
        
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        
        let contextTip = '';
        if (focusData.total < 40) {
            contextTip = '\n\n💡 **Personalized for you:** Your focus score is low. Start with just one 25-minute session to build momentum.';
        } else if (mood.mood === 'alert') {
            contextTip = '\n\n💡 **Personalized for you:** You seem to have overdue tasks. Tackle the most urgent one first!';
        }
        
        return randomTip + contextTip;
    },

    getGreeting(mood, profile) {
        const hour = new Date().getHours();
        const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
        const streak = profile?.streak || 0;
        
        return `${timeGreeting}! 👋\n\n` +
            `I'm your AI productivity assistant. Current status:\n` +
            `• Mood: **${mood.label}** - ${mood.description}\n` +
            `• Streak: **${streak} days**\n\n` +
            `How can I help you be more productive today?`;
    },

    getContextualResponse(focusData, mood, tasks, habits) {
        const responses = [
            `I'm here to help! You can ask me about your productivity, tasks, habits, or request tips. Your current focus score is ${focusData.total}/100.`,
            `Looking at your data, ${mood.mood === 'focused' ? 'you\'re doing great!' : 'there\'s room for improvement'}. Try asking "What should I focus on?" for personalized recommendations.`,
            `I analyze your behavior patterns to provide insights. Ask me about your productivity, and I'll give you a detailed breakdown.`
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }
};
