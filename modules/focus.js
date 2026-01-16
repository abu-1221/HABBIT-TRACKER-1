// ===== Focus Module - Focus Score Engine & Timer =====

const FocusModule = {
    timerState: {
        isRunning: false,
        isPaused: false,
        type: 'focus', // 'focus' or 'break'
        duration: 25 * 60, // in seconds
        remaining: 25 * 60,
        intervalId: null
    },

    init() {
        this.renderFocusSection();
        this.bindEvents();
        this.loadSettings();
    },

    renderFocusSection() {
        const section = document.createElement('section');
        section.id = 'focus-section';
        section.className = 'section';
        section.innerHTML = `
            <div class="focus-container">
                <!-- Focus Timer -->
                <div class="focus-timer-widget glass-card">
                    <div class="widget-header">
                        <h3>Focus Session</h3>
                        <div class="session-type-toggle">
                            <button class="toggle-btn active" data-type="focus">Focus</button>
                            <button class="toggle-btn" data-type="break">Break</button>
                        </div>
                    </div>
                    <div class="timer-display">
                        <div class="timer-circle">
                            <svg viewBox="0 0 100 100">
                                <circle class="timer-bg" cx="50" cy="50" r="45"></circle>
                                <circle class="timer-progress" id="timer-progress" cx="50" cy="50" r="45"></circle>
                            </svg>
                            <div class="timer-center">
                                <span class="timer-time" id="timer-time">25:00</span>
                                <span class="timer-label" id="timer-label">Focus Time</span>
                            </div>
                        </div>
                    </div>
                    <div class="timer-controls">
                        <button id="timer-start" class="btn btn-primary btn-large">
                            <i data-lucide="play"></i>
                            Start Focus
                        </button>
                        <button id="timer-pause" class="btn btn-secondary btn-large hidden">
                            <i data-lucide="pause"></i>
                            Pause
                        </button>
                        <button id="timer-reset" class="btn btn-ghost">
                            <i data-lucide="rotate-ccw"></i>
                            Reset
                        </button>
                    </div>
                    <div class="session-stats">
                        <div class="session-stat">
                            <span class="stat-num" id="sessions-today">0</span>
                            <span class="stat-text">Sessions Today</span>
                        </div>
                        <div class="session-stat">
                            <span class="stat-num" id="total-focus-time">0h 0m</span>
                            <span class="stat-text">Total Focus</span>
                        </div>
                    </div>
                </div>

                <!-- Focus Score Details -->
                <div class="focus-details glass-card">
                    <div class="widget-header">
                        <h3>Focus Score Breakdown</h3>
                        <span class="widget-badge ai-badge">
                            <i data-lucide="sparkles"></i>
                            Heuristic Engine
                        </span>
                    </div>
                    <div class="score-factors" id="score-factors">
                        <!-- Dynamically filled -->
                    </div>
                    <div class="total-score">
                        <span class="total-label">Total Focus Score</span>
                        <span class="total-value" id="total-focus-score">0</span>
                    </div>
                </div>

                <!-- Focus History Chart -->
                <div class="focus-history glass-card">
                    <div class="widget-header">
                        <h3>Focus History</h3>
                        <div class="time-range-toggle">
                            <button class="range-btn active" data-range="week">Week</button>
                            <button class="range-btn" data-range="month">Month</button>
                        </div>
                    </div>
                    <div class="chart-container">
                        <canvas id="focus-history-chart"></canvas>
                    </div>
                </div>

                <!-- Peak Performance -->
                <div class="peak-performance glass-card">
                    <div class="widget-header">
                        <h3>Peak Performance Times</h3>
                        <span class="widget-badge">
                            <i data-lucide="brain"></i>
                            Pattern Analysis
                        </span>
                    </div>
                    <div class="peak-times" id="peak-times">
                        <div class="peak-item best">
                            <div class="peak-time">9:00 AM - 11:00 AM</div>
                            <div class="peak-bar"><div class="peak-fill" style="width: 95%"></div></div>
                            <span class="peak-label">Most Productive</span>
                        </div>
                        <div class="peak-item good">
                            <div class="peak-time">2:00 PM - 4:00 PM</div>
                            <div class="peak-bar"><div class="peak-fill" style="width: 70%"></div></div>
                            <span class="peak-label">Good Focus</span>
                        </div>
                        <div class="peak-item low">
                            <div class="peak-time">12:00 PM - 1:00 PM</div>
                            <div class="peak-bar"><div class="peak-fill" style="width: 30%"></div></div>
                            <span class="peak-label">Low Energy</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('content-wrapper').appendChild(section);
        lucide.createIcons();
    },

    bindEvents() {
        // Session type toggle
        document.querySelectorAll('.session-type-toggle .toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchType(e.target.dataset.type));
        });

        // Timer controls
        document.getElementById('timer-start')?.addEventListener('click', () => this.startTimer());
        document.getElementById('timer-pause')?.addEventListener('click', () => this.pauseTimer());
        document.getElementById('timer-reset')?.addEventListener('click', () => this.resetTimer());

        // Range toggle
        document.querySelectorAll('.time-range-toggle .range-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.time-range-toggle .range-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.renderHistoryChart(e.target.dataset.range);
            });
        });
    },

    loadSettings() {
        const settings = Storage.get(Storage.KEYS.SETTINGS);
        if (settings) {
            this.timerState.duration = settings.focusDuration * 60;
            this.timerState.remaining = settings.focusDuration * 60;
            this.updateTimerDisplay();
        }
    },

    switchType(type) {
        const settings = Storage.get(Storage.KEYS.SETTINGS);
        this.timerState.type = type;
        this.timerState.duration = type === 'focus' 
            ? settings.focusDuration * 60 
            : settings.breakDuration * 60;
        this.timerState.remaining = this.timerState.duration;
        
        // Update UI
        document.querySelectorAll('.session-type-toggle .toggle-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });
        
        document.getElementById('timer-label').textContent = type === 'focus' ? 'Focus Time' : 'Break Time';
        this.updateTimerDisplay();
        this.resetTimer();
    },

    startTimer() {
        if (this.timerState.isRunning) return;
        
        this.timerState.isRunning = true;
        this.timerState.isPaused = false;
        
        document.getElementById('timer-start').classList.add('hidden');
        document.getElementById('timer-pause').classList.remove('hidden');
        
        this.timerState.intervalId = setInterval(() => {
            if (this.timerState.remaining > 0) {
                this.timerState.remaining--;
                this.updateTimerDisplay();
            } else {
                this.completeSession();
            }
        }, 1000);
    },

    pauseTimer() {
        if (!this.timerState.isRunning) return;
        
        clearInterval(this.timerState.intervalId);
        this.timerState.isRunning = false;
        this.timerState.isPaused = true;
        
        document.getElementById('timer-start').classList.remove('hidden');
        document.getElementById('timer-start').innerHTML = '<i data-lucide="play"></i> Resume';
        document.getElementById('timer-pause').classList.add('hidden');
        lucide.createIcons();
    },

    resetTimer() {
        clearInterval(this.timerState.intervalId);
        this.timerState.isRunning = false;
        this.timerState.isPaused = false;
        this.timerState.remaining = this.timerState.duration;
        
        document.getElementById('timer-start').classList.remove('hidden');
        document.getElementById('timer-start').innerHTML = `<i data-lucide="play"></i> Start ${this.timerState.type === 'focus' ? 'Focus' : 'Break'}`;
        document.getElementById('timer-pause').classList.add('hidden');
        
        this.updateTimerDisplay();
        lucide.createIcons();
    },

    updateTimerDisplay() {
        const minutes = Math.floor(this.timerState.remaining / 60);
        const seconds = this.timerState.remaining % 60;
        
        document.getElementById('timer-time').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Update progress circle
        const progress = ((this.timerState.duration - this.timerState.remaining) / this.timerState.duration) * 283;
        document.getElementById('timer-progress').style.strokeDasharray = `${progress}, 283`;
    },

    completeSession() {
        clearInterval(this.timerState.intervalId);
        this.timerState.isRunning = false;
        
        if (this.timerState.type === 'focus') {
            // Record focus session
            const sessions = Storage.get(Storage.KEYS.FOCUS_SESSIONS) || [];
            sessions.push({
                id: Date.now().toString(),
                duration: this.timerState.duration / 60,
                completedAt: new Date().toISOString(),
                type: 'focus'
            });
            Storage.set(Storage.KEYS.FOCUS_SESSIONS, sessions);
            
            // Update today's stats
            const stats = Storage.getTodayStats();
            Storage.updateTodayStats({
                focusSessions: (stats.focusSessions || 0) + 1,
                focusTime: (stats.focusTime || 0) + this.timerState.duration / 60
            });
            
            App.showToast('Focus session completed! 🎉 Great work!', 'success');
            
            // Switch to break
            this.switchType('break');
        } else {
            App.showToast('Break over! Ready for another focus session?', 'info');
            this.switchType('focus');
        }
        
        this.updateSessionStats();
        App.updateDashboard();
    },

    updateSessionStats() {
        const stats = Storage.getTodayStats();
        
        document.getElementById('sessions-today').textContent = stats.focusSessions || 0;
        
        const totalMinutes = stats.focusTime || 0;
        const hours = Math.floor(totalMinutes / 60);
        const mins = Math.round(totalMinutes % 60);
        document.getElementById('total-focus-time').textContent = `${hours}h ${mins}m`;
    },

    updateScoreBreakdown() {
        const focusData = AIEngine.calculateFocusScore();
        const factorsContainer = document.getElementById('score-factors');
        
        const factors = [
            { name: 'Deep Work Time', icon: 'clock', value: `+${focusData.breakdown.deepWork}`, desc: 'Time spent in focused work sessions', positive: true },
            { name: 'Task Completion', icon: 'check-circle', value: `+${focusData.breakdown.taskCompletion}`, desc: 'Tasks completed vs planned', positive: true },
            { name: 'Consistency Bonus', icon: 'calendar-check', value: `+${focusData.breakdown.consistency}`, desc: 'Daily login and activity streak', positive: true },
            { name: 'Idle Time Penalty', icon: 'coffee', value: `-${focusData.breakdown.idlePenalty}`, desc: 'Long periods of inactivity', positive: false },
            { name: 'Overdue Tasks', icon: 'alert-triangle', value: `-${focusData.breakdown.overduePenalty}`, desc: 'Tasks past their deadline', positive: false }
        ];
        
        factorsContainer.innerHTML = factors.map(f => `
            <div class="factor-item ${!f.positive ? 'penalty' : ''}">
                <div class="factor-header">
                    <span class="factor-name"><i data-lucide="${f.icon}"></i>${f.name}</span>
                    <span class="factor-value ${!f.positive ? 'negative' : ''}">${f.value}</span>
                </div>
                <p class="factor-desc">${f.desc}</p>
            </div>
        `).join('');
        
        document.getElementById('total-focus-score').textContent = focusData.total;
        lucide.createIcons();
    },

    renderHistoryChart(range = 'week') {
        const ctx = document.getElementById('focus-history-chart');
        if (!ctx) return;
        
        const days = range === 'week' ? 7 : 30;
        const dailyStats = Storage.get(Storage.KEYS.DAILY_STATS) || {};
        
        const labels = [];
        const data = [];
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const key = date.toISOString().split('T')[0];
            labels.push(date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
            data.push(dailyStats[key]?.focusScore || 0);
        }
        
        // Destroy existing chart
        if (this.historyChart) {
            this.historyChart.destroy();
        }
        
        this.historyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Focus Score',
                    data,
                    borderColor: '#7c3aed',
                    backgroundColor: 'rgba(124, 58, 237, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#7c3aed',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#6a6a7a' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#6a6a7a', maxRotation: 45 }
                    }
                }
            }
        });
    },

    refresh() {
        this.updateSessionStats();
        this.updateScoreBreakdown();
        this.renderHistoryChart();
    }
};
