// ===== Main Application - AI Personal Operating System =====

const App = {
    currentSection: 'dashboard',

    init() {
        // Check if user is logged in
        AuthModule.init();
        
        if (!AuthModule.isLoggedIn()) {
            // Show login screen
            this.hideLoading();
            AuthUI.showAuthScreen();
            return;
        }
        
        this.showLoading();
        
        // Register Service Worker for PWA
        this.registerServiceWorker();
        
        // Listen for messages from service worker
        this.setupServiceWorkerMessages();
        
        // Initialize all modules
        setTimeout(() => {
            this.renderDashboard();
            TasksModule.init();
            FocusModule.init();
            HabitsModule.init();
            AnalyticsModule.init();
            AssistantModule.init();
            MoodModule.init();
            NotificationsModule.init(); // Initialize notifications
            
            this.bindEvents();
            this.startClock();
            this.trackActivity();
            this.updateDashboard();
            this.hideLoading();
            
            // Show install prompt if available
            this.setupInstallPrompt();
            
            // Schedule daily notifications
            NotificationsModule.scheduleDailyNotifications();
        }, 1500);
    },

    setupServiceWorkerMessages() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', event => {
                const { type, itemType, itemId } = event.data;
                
                if (type === 'COMPLETE_ITEM') {
                    if (itemType === 'habit') {
                        HabitsModule.toggleComplete(itemId);
                    } else if (itemType === 'task') {
                        TasksModule.toggleComplete(itemId);
                    }
                }
            });
        }
    },

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./service-worker.js')
                .then(registration => {
                    console.log('✅ Service Worker registered successfully:', registration.scope);
                })
                .catch(error => {
                    console.log('❌ Service Worker registration failed:', error);
                });
        }
    },

    setupInstallPrompt() {
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            // Show install button
            const installBanner = document.createElement('div');
            installBanner.className = 'install-banner glass-card';
            installBanner.innerHTML = `
                <div class="install-content">
                    <i data-lucide="smartphone"></i>
                    <div class="install-text">
                        <strong>Install AI-POS App</strong>
                        <p>Install on your device for better experience</p>
                    </div>
                </div>
                <div class="install-actions">
                    <button id="install-btn" class="btn btn-primary btn-sm">Install</button>
                    <button id="dismiss-install" class="btn btn-ghost btn-sm">Later</button>
                </div>
            `;
            
            document.body.appendChild(installBanner);
            lucide.createIcons();
            
            document.getElementById('install-btn').addEventListener('click', async () => {
                if (deferredPrompt) {
                    deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;
                    if (outcome === 'accepted') {
                        this.showToast('AI-POS installed successfully! 🎉', 'success');
                    }
                    deferredPrompt = null;
                    installBanner.remove();
                }
            });
            
            document.getElementById('dismiss-install').addEventListener('click', () => {
                installBanner.remove();
            });
        });
    },

    showLoading() {
        document.getElementById('loading-screen').classList.remove('hidden');
        document.getElementById('app').classList.add('hidden');
    },

    hideLoading() {
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
    },

    renderDashboard() {
        const section = document.createElement('section');
        section.id = 'dashboard-section';
        section.className = 'section active';
        section.innerHTML = `
            <div class="dashboard-grid">
                <!-- Stats Row -->
                <div class="stats-row">
                    <div class="stat-card glass-card">
                        <div class="stat-icon task-icon"><i data-lucide="list-checks"></i></div>
                        <div class="stat-info">
                            <span class="stat-value" id="stat-tasks-completed">0</span>
                            <span class="stat-label">Tasks Completed</span>
                        </div>
                        <div class="stat-trend up"><i data-lucide="trending-up"></i><span id="task-trend">+0%</span></div>
                    </div>
                    <div class="stat-card glass-card">
                        <div class="stat-icon focus-icon"><i data-lucide="zap"></i></div>
                        <div class="stat-info">
                            <span class="stat-value" id="stat-focus-score">0</span>
                            <span class="stat-label">Focus Score</span>
                        </div>
                        <div class="stat-trend" id="focus-trend-container"><i data-lucide="trending-up"></i><span id="focus-trend">+0%</span></div>
                    </div>
                    <div class="stat-card glass-card">
                        <div class="stat-icon streak-icon"><i data-lucide="flame"></i></div>
                        <div class="stat-info">
                            <span class="stat-value" id="stat-streak">0</span>
                            <span class="stat-label">Day Streak</span>
                        </div>
                        <div class="stat-badge"><i data-lucide="award"></i></div>
                    </div>
                    <div class="stat-card glass-card">
                        <div class="stat-icon habit-icon"><i data-lucide="check-circle-2"></i></div>
                        <div class="stat-info">
                            <span class="stat-value" id="stat-habits">0/0</span>
                            <span class="stat-label">Habits Today</span>
                        </div>
                        <div class="stat-progress"><div class="progress-bar"><div class="progress-fill" id="habit-progress-fill"></div></div></div>
                    </div>
                </div>

                <!-- Main Content -->
                <div class="dashboard-main">
                    <!-- Focus Score Widget -->
                    <div class="focus-widget glass-card">
                        <div class="widget-header">
                            <h3>Today's Focus Score</h3>
                            <span class="widget-badge ai-badge"><i data-lucide="brain"></i>AI Analyzed</span>
                        </div>
                        <div class="focus-display">
                            <div class="focus-circle">
                                <svg viewBox="0 0 100 100">
                                    <circle class="focus-bg" cx="50" cy="50" r="45"></circle>
                                    <circle class="focus-progress" id="focus-progress" cx="50" cy="50" r="45"></circle>
                                </svg>
                                <div class="focus-center">
                                    <span class="focus-number" id="focus-number">0</span>
                                    <span class="focus-max">/100</span>
                                </div>
                            </div>
                            <div class="focus-breakdown">
                                <div class="breakdown-item">
                                    <span class="breakdown-label">Deep Work</span>
                                    <div class="breakdown-bar"><div class="breakdown-fill" id="deep-work-fill"></div></div>
                                    <span class="breakdown-value" id="deep-work-value">0h</span>
                                </div>
                                <div class="breakdown-item">
                                    <span class="breakdown-label">Task Completion</span>
                                    <div class="breakdown-bar"><div class="breakdown-fill" id="task-completion-fill"></div></div>
                                    <span class="breakdown-value" id="task-completion-value">0%</span>
                                </div>
                                <div class="breakdown-item">
                                    <span class="breakdown-label">Consistency</span>
                                    <div class="breakdown-bar"><div class="breakdown-fill" id="consistency-fill"></div></div>
                                    <span class="breakdown-value" id="consistency-value">0%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- AI Insights -->
                    <div class="insights-widget glass-card">
                        <div class="widget-header">
                            <h3>AI Insights</h3>
                            <button class="refresh-btn" id="refresh-insights"><i data-lucide="refresh-cw"></i></button>
                        </div>
                        <div class="insights-list" id="insights-list">
                            <div class="insight-item"><div class="insight-icon"><i data-lucide="lightbulb"></i></div><p>Analyzing your productivity patterns...</p></div>
                        </div>
                    </div>
                </div>

                <!-- Sidebar Content -->
                <div class="dashboard-side">
                    <!-- Quick Add Task -->
                    <div class="quick-task glass-card">
                        <div class="widget-header"><h3>Quick Add Task</h3></div>
                        <form id="quick-task-form" class="quick-task-form">
                            <input type="text" id="quick-task-input" placeholder="What needs to be done?" required>
                            <div class="quick-task-options">
                                <select id="quick-task-priority">
                                    <option value="low">Low</option>
                                    <option value="medium" selected>Medium</option>
                                    <option value="high">High</option>
                                </select>
                                <button type="submit" class="btn btn-primary"><i data-lucide="plus"></i>Add</button>
                            </div>
                        </form>
                    </div>

                    <!-- Upcoming Tasks -->
                    <div class="upcoming-tasks glass-card">
                        <div class="widget-header">
                            <h3>Upcoming Tasks</h3>
                            <a href="#" class="view-all" data-section="tasks">View All</a>
                        </div>
                        <div class="upcoming-list" id="upcoming-tasks-list"><p class="empty-state">No upcoming tasks</p></div>
                    </div>

                    <!-- Today's Habits -->
                    <div class="todays-habits glass-card">
                        <div class="widget-header">
                            <h3>Today's Habits</h3>
                            <a href="#" class="view-all" data-section="habits">View All</a>
                        </div>
                        <div class="habits-checklist" id="habits-checklist"><p class="empty-state">No habits defined</p></div>
                    </div>
                </div>

                <!-- Activity Chart -->
                <div class="activity-chart glass-card">
                    <div class="widget-header">
                        <h3>Weekly Activity</h3>
                        <div class="chart-legend">
                            <span class="legend-item"><span class="legend-color tasks"></span>Tasks</span>
                            <span class="legend-item"><span class="legend-color focus"></span>Focus</span>
                        </div>
                    </div>
                    <div class="chart-container"><canvas id="weekly-activity-chart"></canvas></div>
                </div>
            </div>
        `;
        
        document.getElementById('content-wrapper').insertBefore(section, document.getElementById('content-wrapper').firstChild);
        lucide.createIcons();
        
        // Bind dashboard events
        document.getElementById('quick-task-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('quick-task-input').value.trim();
            const priority = document.getElementById('quick-task-priority').value;
            if (title) {
                TasksModule.addTask({ title, priority, category: 'work' });
                document.getElementById('quick-task-input').value = '';
            }
        });

        document.getElementById('refresh-insights')?.addEventListener('click', () => {
            this.updateInsights();
        });

        document.querySelectorAll('.view-all').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchSection(e.target.dataset.section);
            });
        });
    },

    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                this.switchSection(item.dataset.section);
            });
        });

        // Sidebar toggle
        document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('collapsed');
        });

        // Mobile menu
        document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('mobile-open');
        });

        // Settings
        document.getElementById('settings-btn')?.addEventListener('click', () => {
            this.openSettings();
        });
    },

    switchSection(sectionId) {
        this.currentSection = sectionId;
        
        // Update nav
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.section === sectionId);
        });

        // Update sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.toggle('active', section.id === `${sectionId}-section`);
        });

        // Update page title
        const titles = {
            dashboard: { title: 'Dashboard', subtitle: 'Welcome back! Here\'s your productivity overview.' },
            tasks: { title: 'Smart Tasks', subtitle: 'AI-powered task management and prioritization.' },
            focus: { title: 'Focus Score', subtitle: 'Track your productivity and deep work sessions.' },
            habits: { title: 'Habits', subtitle: 'Build consistent habits with streak tracking.' },
            analytics: { title: 'Analytics', subtitle: 'Visualize your productivity trends and patterns.' },
            assistant: { title: 'AI Assistant', subtitle: 'Get personalized productivity insights.' }
        };

        const pageInfo = titles[sectionId] || titles.dashboard;
        document.getElementById('page-title').textContent = pageInfo.title;
        document.getElementById('page-subtitle').textContent = pageInfo.subtitle;

        // Close mobile menu
        document.getElementById('sidebar').classList.remove('mobile-open');

        // Refresh section data
        this.refreshSection(sectionId);
    },

    refreshSection(sectionId) {
        switch (sectionId) {
            case 'dashboard':
                this.updateDashboard();
                break;
            case 'tasks':
                TasksModule.renderTasks();
                break;
            case 'focus':
                FocusModule.refresh();
                break;
            case 'habits':
                HabitsModule.refresh();
                break;
            case 'analytics':
                AnalyticsModule.refresh();
                break;
            case 'assistant':
                AssistantModule.refresh();
                break;
        }
    },

    updateDashboard() {
        const focusData = AIEngine.calculateFocusScore();
        const tasks = Storage.get(Storage.KEYS.TASKS) || [];
        const habits = Storage.get(Storage.KEYS.HABITS) || [];
        const profile = Storage.get(Storage.KEYS.USER_PROFILE);
        const todayStats = Storage.getTodayStats();

        // Update stats
        document.getElementById('stat-tasks-completed').textContent = todayStats.tasksCompleted || 0;
        document.getElementById('stat-focus-score').textContent = focusData.total;
        document.getElementById('stat-streak').textContent = profile?.streak || 0;

        // Update mini focus score
        document.getElementById('focus-value-mini').textContent = focusData.total;
        document.getElementById('focus-ring-fill').setAttribute('stroke-dasharray', `${focusData.total}, 100`);

        // Habits progress
        const todayHabits = HabitsModule.getTodayHabits?.() || habits;
        const completedHabits = todayHabits.filter(h => h.completions?.includes(new Date().toDateString())).length;
        document.getElementById('stat-habits').textContent = `${completedHabits}/${todayHabits.length}`;
        const habitPercent = todayHabits.length > 0 ? (completedHabits / todayHabits.length) * 100 : 0;
        document.getElementById('habit-progress-fill').style.width = `${habitPercent}%`;

        // Focus score display
        document.getElementById('focus-number').textContent = focusData.total;
        const circumference = 2 * Math.PI * 45;
        const progress = (focusData.total / 100) * circumference;
        document.getElementById('focus-progress').style.strokeDasharray = `${progress}, ${circumference}`;

        // Focus breakdown
        const deepWorkHours = (todayStats.focusTime || 0) / 60;
        document.getElementById('deep-work-value').textContent = deepWorkHours.toFixed(1) + 'h';
        document.getElementById('deep-work-fill').style.width = `${Math.min(deepWorkHours / 2 * 100, 100)}%`;

        const taskCompletion = focusData.metrics.totalTasks > 0 
            ? Math.round((focusData.metrics.completedTasks / focusData.metrics.totalTasks) * 100) 
            : 0;
        document.getElementById('task-completion-value').textContent = taskCompletion + '%';
        document.getElementById('task-completion-fill').style.width = `${taskCompletion}%`;

        const consistencyPercent = Math.min(focusData.metrics.streakDays / 7 * 100, 100);
        document.getElementById('consistency-value').textContent = Math.round(consistencyPercent) + '%';
        document.getElementById('consistency-fill').style.width = `${consistencyPercent}%`;

        // Update insights
        this.updateInsights();

        // Update upcoming tasks
        this.updateUpcomingTasks();

        // Update habits checklist
        this.updateHabitsChecklist();

        // Update activity chart
        this.renderActivityChart();

        // Update mood
        MoodModule.updateMood();
    },

    updateInsights() {
        const insights = AIEngine.generateInsights();
        const container = document.getElementById('insights-list');
        
        if (!container) return;

        container.innerHTML = insights.map(insight => `
            <div class="insight-item ${insight.type}">
                <div class="insight-icon"><i data-lucide="${insight.icon}"></i></div>
                <div class="insight-content">
                    <strong>${insight.title}</strong>
                    <p>${insight.message}</p>
                </div>
            </div>
        `).join('');

        lucide.createIcons();
    },

    updateUpcomingTasks() {
        const tasks = TasksModule.getUpcomingTasks(4);
        const container = document.getElementById('upcoming-tasks-list');
        
        if (!container) return;

        if (tasks.length === 0) {
            container.innerHTML = '<p class="empty-state">No upcoming tasks</p>';
            return;
        }

        container.innerHTML = tasks.map(task => `
            <div class="upcoming-task-item">
                <span class="task-priority-dot ${task.priority}"></span>
                <span class="task-name">${task.title}</span>
                ${task.deadline ? `<span class="task-due">${TasksModule.formatDeadline(task.deadline)}</span>` : ''}
            </div>
        `).join('');
    },

    updateHabitsChecklist() {
        const habits = HabitsModule.getTodayHabits?.() || Storage.get(Storage.KEYS.HABITS) || [];
        const container = document.getElementById('habits-checklist');
        const today = new Date().toDateString();
        
        if (!container) return;

        if (habits.length === 0) {
            container.innerHTML = '<p class="empty-state">No habits defined</p>';
            return;
        }

        container.innerHTML = habits.slice(0, 4).map(habit => {
            const isCompleted = habit.completions?.includes(today);
            return `
                <div class="habit-check-item ${isCompleted ? 'completed' : ''}" data-id="${habit.id}">
                    <i data-lucide="${habit.icon}"></i>
                    <span>${habit.name}</span>
                    <i data-lucide="${isCompleted ? 'check-circle-2' : 'circle'}" class="habit-status"></i>
                </div>
            `;
        }).join('');

        lucide.createIcons();

        // Bind click events
        container.querySelectorAll('.habit-check-item').forEach(item => {
            item.addEventListener('click', () => {
                HabitsModule.toggleComplete(item.dataset.id);
            });
        });
    },

    renderActivityChart() {
        const ctx = document.getElementById('weekly-activity-chart');
        if (!ctx) return;

        const dailyStats = Storage.get(Storage.KEYS.DAILY_STATS) || {};
        const labels = [];
        const tasksData = [];
        const focusData = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const key = date.toISOString().split('T')[0];
            const dayStats = dailyStats[key] || {};

            labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
            tasksData.push(dayStats.tasksCompleted || 0);
            focusData.push(dayStats.focusScore || 0);
        }

        if (this.activityChart) {
            this.activityChart.destroy();
        }

        this.activityChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Tasks Completed',
                        data: tasksData,
                        backgroundColor: 'rgba(124, 58, 237, 0.8)',
                        borderRadius: 6,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Focus Score',
                        data: focusData,
                        type: 'line',
                        borderColor: '#10b981',
                        backgroundColor: 'transparent',
                        tension: 0.4,
                        yAxisID: 'y1'
                    }
                ]
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
                        position: 'left',
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#6a6a7a' }
                    },
                    y1: {
                        beginAtZero: true,
                        max: 100,
                        position: 'right',
                        grid: { drawOnChartArea: false },
                        ticks: { color: '#6a6a7a' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#6a6a7a' }
                    }
                }
            }
        });
    },

    startClock() {
        const updateClock = () => {
            const now = new Date();
            const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            const date = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
            
            const datetime = document.getElementById('datetime');
            if (datetime) {
                datetime.querySelector('.time').textContent = time;
                datetime.querySelector('.date').textContent = date;
            }
        };

        updateClock();
        setInterval(updateClock, 1000);
    },

    trackActivity() {
        // Track idle time
        let lastActivity = Date.now();

        const updateActivity = () => {
            lastActivity = Date.now();
        };

        document.addEventListener('mousemove', updateActivity);
        document.addEventListener('keydown', updateActivity);
        document.addEventListener('click', updateActivity);

        // Check for idle every minute
        setInterval(() => {
            const idleMinutes = (Date.now() - lastActivity) / (1000 * 60);
            if (idleMinutes >= 5) {
                const stats = Storage.getTodayStats();
                Storage.updateTodayStats({ idleTime: (stats.idleTime || 0) + 1 });
            }
        }, 60000);
    },

    openSettings() {
        const modal = document.createElement('div');
        modal.id = 'settings-modal';
        modal.className = 'modal active';
        
        const settings = Storage.get(Storage.KEYS.SETTINGS);
        
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content glass-card settings-content">
                <div class="modal-header">
                    <h2>Settings</h2>
                    <button class="modal-close" id="close-settings"><i data-lucide="x"></i></button>
                </div>
                <div class="settings-body">
                    <div class="settings-section">
                        <h3>Appearance</h3>
                        <div class="setting-item">
                            <div class="setting-info">
                                <span class="setting-label">Adaptive UI Theme</span>
                                <span class="setting-desc">Automatically adjust theme based on mood and time</span>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" id="setting-adaptive-ui" ${settings.adaptiveUI ? 'checked' : ''}>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                        <div class="setting-item">
                            <div class="setting-info">
                                <span class="setting-label">Animations</span>
                                <span class="setting-desc">Enable smooth transitions</span>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" id="setting-animations" ${settings.animations ? 'checked' : ''}>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                    <div class="settings-section">
                        <h3>Focus Timer</h3>
                        <div class="setting-item">
                            <div class="setting-info">
                                <span class="setting-label">Focus Duration (minutes)</span>
                            </div>
                            <input type="number" id="setting-focus-duration" value="${settings.focusDuration}" min="5" max="90" class="setting-input">
                        </div>
                        <div class="setting-item">
                            <div class="setting-info">
                                <span class="setting-label">Break Duration (minutes)</span>
                            </div>
                            <input type="number" id="setting-break-duration" value="${settings.breakDuration}" min="1" max="30" class="setting-input">
                        </div>
                    </div>
                    <div class="settings-section">
                        <h3>Notifications 🔔</h3>
                        <div class="setting-item">
                            <div class="setting-info">
                                <span class="setting-label">Push Notifications</span>
                                <span class="setting-desc">Get reminders for habits and tasks</span>
                            </div>
                            <button id="enable-notifications" class="btn btn-primary btn-sm">
                                ${Notification?.permission === 'granted' ? 'Enabled ✓' : 'Enable'}
                            </button>
                        </div>
                        <div class="setting-item">
                            <div class="setting-info">
                                <span class="setting-label">Test Notification</span>
                                <span class="setting-desc">Send a test notification now</span>
                            </div>
                            <button id="test-notification" class="btn btn-secondary btn-sm">Test</button>
                        </div>
                    </div>
                    <div class="settings-section">
                        <h3>Account 👤</h3>
                        <div class="setting-item">
                            <div class="setting-info">
                                <span class="setting-label">Logged in as</span>
                                <span class="setting-desc">${AuthModule.getCurrentUser()?.email || 'Unknown'}</span>
                            </div>
                        </div>
                        <div class="setting-item">
                            <div class="setting-info">
                                <span class="setting-label">Logout</span>
                                <span class="setting-desc">Sign out of your account</span>
                            </div>
                            <button id="logout-btn" class="btn btn-secondary"><i data-lucide="log-out"></i>Logout</button>
                        </div>
                    </div>
                    <div class="settings-section">
                        <h3>Data</h3>
                        <div class="setting-item">
                            <div class="setting-info">
                                <span class="setting-label">Export Data</span>
                                <span class="setting-desc">Download all data as JSON</span>
                            </div>
                            <button id="export-data" class="btn btn-secondary"><i data-lucide="download"></i>Export</button>
                        </div>
                        <div class="setting-item danger">
                            <div class="setting-info">
                                <span class="setting-label">Reset All Data</span>
                                <span class="setting-desc">Clear all tasks, habits, and analytics</span>
                            </div>
                            <button id="reset-data" class="btn btn-danger"><i data-lucide="trash-2"></i>Reset</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        lucide.createIcons();

        // Bind settings events
        document.getElementById('close-settings').addEventListener('click', () => modal.remove());
        document.querySelector('#settings-modal .modal-overlay').addEventListener('click', () => modal.remove());

        document.getElementById('setting-adaptive-ui').addEventListener('change', (e) => {
            settings.adaptiveUI = e.target.checked;
            Storage.set(Storage.KEYS.SETTINGS, settings);
            MoodModule.updateMood();
        });

        document.getElementById('setting-animations').addEventListener('change', (e) => {
            settings.animations = e.target.checked;
            Storage.set(Storage.KEYS.SETTINGS, settings);
            document.body.classList.toggle('no-animations', !e.target.checked);
        });

        document.getElementById('setting-focus-duration').addEventListener('change', (e) => {
            settings.focusDuration = parseInt(e.target.value);
            Storage.set(Storage.KEYS.SETTINGS, settings);
        });

        document.getElementById('setting-break-duration').addEventListener('change', (e) => {
            settings.breakDuration = parseInt(e.target.value);
            Storage.set(Storage.KEYS.SETTINGS, settings);
        });

        // Notification buttons
        document.getElementById('enable-notifications').addEventListener('click', async () => {
            const granted = await NotificationsModule.requestPermission();
            if (granted) {
                document.getElementById('enable-notifications').textContent = 'Enabled ✓';
                this.showToast('Notifications enabled! 🔔', 'success');
            } else {
                this.showToast('Notification permission denied', 'error');
            }
        });

        document.getElementById('test-notification').addEventListener('click', () => {
            NotificationsModule.showNotification(
                '🎉 Test Notification',
                'Notifications are working perfectly!',
                'test'
            );
        });

        // Logout button
        document.getElementById('logout-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                AuthModule.logout();
            }
        });


        document.getElementById('export-data').addEventListener('click', () => {
            const data = Storage.exportData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ai-pos-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            this.showToast('Data exported successfully!', 'success');
        });

        document.getElementById('reset-data').addEventListener('click', () => {
            if (confirm('Are you sure? This will delete all your data permanently.')) {
                Storage.clearAll();
                modal.remove();
                location.reload();
            }
        });
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'check-circle',
            error: 'x-circle',
            warning: 'alert-triangle',
            info: 'info'
        };

        toast.innerHTML = `
            <div class="toast-icon"><i data-lucide="${icons[type]}"></i></div>
            <span class="toast-message">${message}</span>
        `;

        container.appendChild(toast);
        lucide.createIcons();

        setTimeout(() => {
            toast.style.animation = 'toastSlide 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
