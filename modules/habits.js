// ===== Habits Module - Habit Intelligence System =====

const HabitsModule = {
    init() {
        this.renderHabitsSection();
        this.bindEvents();
    },

    renderHabitsSection() {
        const section = document.createElement('section');
        section.id = 'habits-section';
        section.className = 'section';
        section.innerHTML = `
            <div class="habits-container">
                <div class="habits-header">
                    <div class="streak-display glass-card">
                        <div class="streak-flame"><i data-lucide="flame"></i></div>
                        <div class="streak-info">
                            <span class="streak-number" id="habit-streak">0</span>
                            <span class="streak-text">Day Streak</span>
                        </div>
                    </div>
                    <button id="add-habit-btn" class="btn btn-primary">
                        <i data-lucide="plus"></i>
                        New Habit
                    </button>
                </div>

                <div class="habit-suggestions glass-card" id="habit-suggestions">
                    <div class="widget-header">
                        <h3><i data-lucide="lightbulb"></i>AI Habit Recommendations</h3>
                    </div>
                    <div class="suggestions-list" id="habit-suggestions-list">
                        <p class="loading-text">Analyzing your habit patterns...</p>
                    </div>
                </div>

                <div class="habits-list-container">
                    <h3 class="section-title">Your Habits</h3>
                    <div class="habits-list" id="habits-list"></div>
                </div>

                <div class="habit-analytics">
                    <div class="habit-heatmap glass-card">
                        <div class="widget-header">
                            <h3>Habit Consistency Heatmap</h3>
                        </div>
                        <div class="heatmap-container" id="habit-heatmap"></div>
                        <div class="heatmap-legend">
                            <span>Less</span>
                            <div class="legend-squares">
                                <div class="legend-square l0"></div>
                                <div class="legend-square l1"></div>
                                <div class="legend-square l2"></div>
                                <div class="legend-square l3"></div>
                                <div class="legend-square l4"></div>
                            </div>
                            <span>More</span>
                        </div>
                    </div>

                    <div class="habit-chart glass-card">
                        <div class="widget-header">
                            <h3>Completion Rate</h3>
                        </div>
                        <div class="chart-container">
                            <canvas id="habit-completion-chart"></canvas>
                        </div>
                    </div>
                </div>

                <div class="habits-empty hidden" id="habits-empty">
                    <div class="empty-illustration"><i data-lucide="target"></i></div>
                    <h3>Build Better Habits</h3>
                    <p>Start tracking your daily habits to build a consistent routine.</p>
                    <button class="btn btn-primary" id="empty-add-habit">
                        <i data-lucide="plus"></i>
                        Create Your First Habit
                    </button>
                </div>
            </div>
        `;
        
        document.getElementById('content-wrapper').appendChild(section);
        this.renderHabitModal();
        lucide.createIcons();
    },

    renderHabitModal() {
        const modal = document.createElement('div');
        modal.id = 'habit-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content glass-card">
                <div class="modal-header">
                    <h2 id="habit-modal-title">Add New Habit</h2>
                    <button class="modal-close" id="close-habit-modal"><i data-lucide="x"></i></button>
                </div>
                <form id="habit-form" class="modal-form">
                    <input type="hidden" id="habit-id">
                    <div class="form-group">
                        <label for="habit-name">Habit Name</label>
                        <input type="text" id="habit-name" placeholder="e.g., Morning Exercise" required>
                    </div>
                    <div class="form-group">
                        <label>Icon</label>
                        <div class="icon-picker" id="habit-icon-picker">
                            <button type="button" class="icon-option active" data-icon="sun"><i data-lucide="sun"></i></button>
                            <button type="button" class="icon-option" data-icon="book"><i data-lucide="book"></i></button>
                            <button type="button" class="icon-option" data-icon="dumbbell"><i data-lucide="dumbbell"></i></button>
                            <button type="button" class="icon-option" data-icon="droplet"><i data-lucide="droplet"></i></button>
                            <button type="button" class="icon-option" data-icon="brain"><i data-lucide="brain"></i></button>
                            <button type="button" class="icon-option" data-icon="heart"><i data-lucide="heart"></i></button>
                            <button type="button" class="icon-option" data-icon="moon"><i data-lucide="moon"></i></button>
                            <button type="button" class="icon-option" data-icon="coffee"><i data-lucide="coffee"></i></button>
                        </div>
                        <input type="hidden" id="habit-icon" value="sun">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="habit-frequency">Frequency</label>
                            <select id="habit-frequency">
                                <option value="daily">Daily</option>
                                <option value="weekdays">Weekdays</option>
                                <option value="weekends">Weekends</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="habit-specific-time">Specific Time (Optional)</label>
                            <input type="time" id="habit-specific-time" placeholder="Set reminder time">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="habit-time">Time of Day</label>
                        <select id="habit-time">
                            <option value="morning">Morning (6 AM - 12 PM)</option>
                            <option value="afternoon">Afternoon (12 PM - 5 PM)</option>
                            <option value="evening">Evening (5 PM - 9 PM)</option>
                            <option value="anytime">Anytime</option>
                        </select>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" id="cancel-habit">Cancel</button>
                        <button type="submit" class="btn btn-primary"><i data-lucide="check"></i>Save Habit</button>
                    </div>
                </form>
            </div>
        `;
        
        document.getElementById('modals-container').appendChild(modal);
        lucide.createIcons();
    },

    bindEvents() {
        // Add habit buttons
        document.getElementById('add-habit-btn')?.addEventListener('click', () => this.openModal());
        document.getElementById('empty-add-habit')?.addEventListener('click', () => this.openModal());

        // Modal controls
        document.getElementById('close-habit-modal')?.addEventListener('click', () => this.closeModal());
        document.getElementById('cancel-habit')?.addEventListener('click', () => this.closeModal());
        document.querySelector('#habit-modal .modal-overlay')?.addEventListener('click', () => this.closeModal());

        // Icon picker
        document.querySelectorAll('#habit-icon-picker .icon-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('#habit-icon-picker .icon-option').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                document.getElementById('habit-icon').value = e.currentTarget.dataset.icon;
            });
        });

        // Form submission
        document.getElementById('habit-form')?.addEventListener('submit', (e) => this.handleSubmit(e));
    },

    openModal(habit = null) {
        const modal = document.getElementById('habit-modal');
        const title = document.getElementById('habit-modal-title');
        const form = document.getElementById('habit-form');
        
        if (habit) {
            title.textContent = 'Edit Habit';
            document.getElementById('habit-id').value = habit.id;
            document.getElementById('habit-name').value = habit.name;
            document.getElementById('habit-frequency').value = habit.frequency;
            document.getElementById('habit-time').value = habit.preferredTime;
            document.getElementById('habit-specific-time').value = habit.specificTime || '';
            document.getElementById('habit-icon').value = habit.icon;
            
            document.querySelectorAll('#habit-icon-picker .icon-option').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.icon === habit.icon);
            });
        } else {
            title.textContent = 'Add New Habit';
            form.reset();
            document.getElementById('habit-id').value = '';
            document.getElementById('habit-icon').value = 'sun';
            document.querySelectorAll('#habit-icon-picker .icon-option').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.icon === 'sun');
            });
        }
        
        modal.classList.add('active');
    },

    closeModal() {
        document.getElementById('habit-modal').classList.remove('active');
    },

    handleSubmit(e) {
        e.preventDefault();
        
        const id = document.getElementById('habit-id').value;
        const habitData = {
            name: document.getElementById('habit-name').value.trim(),
            icon: document.getElementById('habit-icon').value,
            frequency: document.getElementById('habit-frequency').value,
            preferredTime: document.getElementById('habit-time').value,
            specificTime: document.getElementById('habit-specific-time').value || null
        };
        
        if (id) {
            this.updateHabit(id, habitData);
        } else {
            this.addHabit(habitData);
        }
        
        this.closeModal();
    },

    addHabit(habitData) {
        const habits = Storage.get(Storage.KEYS.HABITS) || [];
        const newHabit = {
            id: Date.now().toString(),
            ...habitData,
            createdAt: new Date().toISOString(),
            completions: [],
            streak: 0
        };
        
        habits.push(newHabit);
        Storage.set(Storage.KEYS.HABITS, habits);
        
        this.renderHabits();
        App.showToast('Habit created! Start building your streak.', 'success');
        App.updateDashboard();
    },

    updateHabit(id, habitData) {
        const habits = Storage.get(Storage.KEYS.HABITS) || [];
        const index = habits.findIndex(h => h.id === id);
        
        if (index !== -1) {
            habits[index] = { ...habits[index], ...habitData };
            Storage.set(Storage.KEYS.HABITS, habits);
            this.renderHabits();
            App.showToast('Habit updated!', 'success');
        }
    },

    deleteHabit(id) {
        if (!confirm('Are you sure you want to delete this habit?')) return;
        
        let habits = Storage.get(Storage.KEYS.HABITS) || [];
        habits = habits.filter(h => h.id !== id);
        Storage.set(Storage.KEYS.HABITS, habits);
        
        this.renderHabits();
        App.showToast('Habit deleted', 'info');
        App.updateDashboard();
    },

    toggleComplete(id) {
        const habits = Storage.get(Storage.KEYS.HABITS) || [];
        const habit = habits.find(h => h.id === id);
        const today = new Date().toDateString();
        
        if (habit) {
            if (!habit.completions) habit.completions = [];
            
            const todayIndex = habit.completions.indexOf(today);
            if (todayIndex === -1) {
                habit.completions.push(today);
                this.updateStreak(habit);
                
                const stats = Storage.getTodayStats();
                Storage.updateTodayStats({ habitsCompleted: (stats.habitsCompleted || 0) + 1 });
                
                App.showToast(`${habit.name} completed! 🔥`, 'success');
                
                // Show next event notification
                if (typeof NotificationsModule !== 'undefined') {
                    NotificationsModule.notifyNextEvent('habit', habit);
                }
            } else {
                habit.completions.splice(todayIndex, 1);
                App.showToast('Habit unmarked', 'info');
            }
            
            Storage.set(Storage.KEYS.HABITS, habits);
            this.renderHabits();
            App.updateDashboard();
        }
    },

    updateStreak(habit) {
        const today = new Date();
        let streak = 0;
        
        for (let i = 0; i < 365; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() - i);
            const dateStr = checkDate.toDateString();
            
            if (habit.completions.includes(dateStr)) {
                streak++;
            } else if (i > 0) {
                break;
            }
        }
        
        habit.streak = streak;
    },

    renderHabits() {
        const habits = Storage.get(Storage.KEYS.HABITS) || [];
        const list = document.getElementById('habits-list');
        const empty = document.getElementById('habits-empty');
        const suggestions = document.getElementById('habit-suggestions');
        const profile = Storage.get(Storage.KEYS.USER_PROFILE);
        
        document.getElementById('habit-streak').textContent = profile?.streak || 0;
        
        if (habits.length === 0) {
            list.classList.add('hidden');
            empty.classList.remove('hidden');
            suggestions.classList.add('hidden');
        } else {
            list.classList.remove('hidden');
            empty.classList.add('hidden');
            suggestions.classList.remove('hidden');
            
            const today = new Date().toDateString();
            list.innerHTML = habits.map(habit => this.renderHabitCard(habit, today)).join('');
            
            lucide.createIcons();
            
            // Bind events
            list.querySelectorAll('.habit-card').forEach(card => {
                const id = card.dataset.id;
                card.querySelector('.habit-check')?.addEventListener('click', () => this.toggleComplete(id));
                card.querySelector('.edit-habit')?.addEventListener('click', () => {
                    const habit = habits.find(h => h.id === id);
                    this.openModal(habit);
                });
                card.querySelector('.delete-habit')?.addEventListener('click', () => this.deleteHabit(id));
            });
            
            this.renderSuggestions(habits);
            this.renderHeatmap(habits);
            this.renderCompletionChart(habits);
        }
    },

    renderHabitCard(habit, today) {
        const isCompleted = habit.completions?.includes(today);
        const completionRate = AIEngine.calculateHabitCompletionRate(habit);
        const timeDisplay = habit.specificTime 
            ? `⏰ ${habit.specificTime}` 
            : habit.preferredTime;
        
        return `
            <div class="habit-card glass-card ${isCompleted ? 'completed' : ''}" data-id="${habit.id}">
                <div class="habit-check-wrapper">
                    <button class="habit-check ${isCompleted ? 'checked' : ''}">
                        <i data-lucide="${isCompleted ? 'check-circle-2' : 'circle'}"></i>
                    </button>
                </div>
                <div class="habit-icon-display">
                    <i data-lucide="${habit.icon}"></i>
                </div>
                <div class="habit-info">
                    <h4 class="habit-name">${habit.name}</h4>
                    <div class="habit-meta">
                        <span class="habit-frequency">${habit.frequency}</span>
                        <span class="habit-time">${timeDisplay}</span>
                    </div>
                </div>
                <div class="habit-stats">
                    <div class="habit-streak-display">
                        <i data-lucide="flame"></i>
                        <span>${habit.streak || 0}</span>
                    </div>
                    <div class="habit-rate">${completionRate}%</div>
                </div>
                <div class="habit-actions">
                    <button class="edit-habit" title="Edit"><i data-lucide="pencil"></i></button>
                    <button class="delete-habit" title="Delete"><i data-lucide="trash-2"></i></button>
                </div>
            </div>
        `;
    },

    renderSuggestions(habits) {
        const suggestions = AIEngine.generateHabitRecommendations(habits);
        const container = document.getElementById('habit-suggestions-list');
        
        if (suggestions.length === 0) {
            container.innerHTML = '<p class="success-text">✅ All habits are on track! Keep up the great work.</p>';
            return;
        }
        
        container.innerHTML = suggestions.map(s => `
            <div class="suggestion-item ${s.type}">
                <i data-lucide="${s.type === 'weak' ? 'alert-circle' : s.type === 'timing' ? 'clock' : 'lightbulb'}"></i>
                <p>${s.message}</p>
            </div>
        `).join('');
        
        lucide.createIcons();
    },

    renderHeatmap(habits) {
        const container = document.getElementById('habit-heatmap');
        const weeks = 12;
        const days = weeks * 7;
        
        // Calculate completion levels for each day
        const heatmapData = [];
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toDateString();
            
            let completions = 0;
            habits.forEach(h => {
                if (h.completions?.includes(dateStr)) completions++;
            });
            
            const level = habits.length > 0 ? Math.min(4, Math.floor((completions / habits.length) * 5)) : 0;
            heatmapData.push({ date: dateStr, level });
        }
        
        // Render grid
        let html = '<div class="heatmap-grid">';
        for (let week = 0; week < weeks; week++) {
            html += '<div class="heatmap-week">';
            for (let day = 0; day < 7; day++) {
                const index = week * 7 + day;
                if (index < heatmapData.length) {
                    html += `<div class="heatmap-day l${heatmapData[index].level}" title="${heatmapData[index].date}"></div>`;
                }
            }
            html += '</div>';
        }
        html += '</div>';
        
        container.innerHTML = html;
    },

    renderCompletionChart(habits) {
        const ctx = document.getElementById('habit-completion-chart');
        if (!ctx || habits.length === 0) return;
        
        const labels = habits.map(h => h.name);
        const data = habits.map(h => AIEngine.calculateHabitCompletionRate(h));
        
        if (this.completionChart) {
            this.completionChart.destroy();
        }
        
        this.completionChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Completion Rate',
                    data,
                    backgroundColor: data.map(d => d >= 70 ? '#10b981' : d >= 40 ? '#f59e0b' : '#ef4444'),
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#6a6a7a', callback: v => v + '%' }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { color: '#a0a0b0' }
                    }
                }
            }
        });
    },

    getTodayHabits() {
        const habits = Storage.get(Storage.KEYS.HABITS) || [];
        const today = new Date();
        const dayOfWeek = today.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        return habits.filter(h => {
            if (h.frequency === 'daily') return true;
            if (h.frequency === 'weekdays' && !isWeekend) return true;
            if (h.frequency === 'weekends' && isWeekend) return true;
            return false;
        });
    },

    refresh() {
        this.renderHabits();
    }
};
