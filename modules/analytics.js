// ===== Analytics Module - Productivity Analytics Dashboard =====

const AnalyticsModule = {
    charts: {},

    init() {
        this.renderAnalyticsSection();
        this.bindEvents();
    },

    renderAnalyticsSection() {
        const section = document.createElement('section');
        section.id = 'analytics-section';
        section.className = 'section';
        section.innerHTML = `
            <div class="analytics-container">
                <!-- Overview Cards -->
                <div class="analytics-overview">
                    <div class="overview-card glass-card">
                        <div class="overview-icon purple"><i data-lucide="activity"></i></div>
                        <div class="overview-content">
                            <span class="overview-value" id="analytics-total-tasks">0</span>
                            <span class="overview-label">Total Tasks</span>
                        </div>
                    </div>
                    <div class="overview-card glass-card">
                        <div class="overview-icon green"><i data-lucide="check-circle"></i></div>
                        <div class="overview-content">
                            <span class="overview-value" id="analytics-completed-tasks">0</span>
                            <span class="overview-label">Completed</span>
                        </div>
                    </div>
                    <div class="overview-card glass-card">
                        <div class="overview-icon blue"><i data-lucide="timer"></i></div>
                        <div class="overview-content">
                            <span class="overview-value" id="analytics-focus-hours">0h</span>
                            <span class="overview-label">Focus Hours</span>
                        </div>
                    </div>
                    <div class="overview-card glass-card">
                        <div class="overview-icon orange"><i data-lucide="trophy"></i></div>
                        <div class="overview-content">
                            <span class="overview-value" id="analytics-avg-score">0</span>
                            <span class="overview-label">Avg. Score</span>
                        </div>
                    </div>
                </div>

                <!-- Main Charts -->
                <div class="analytics-charts">
                    <div class="chart-card glass-card">
                        <div class="widget-header">
                            <h3>Productivity Trends</h3>
                            <select id="productivity-range" class="chart-select">
                                <option value="7">Last 7 Days</option>
                                <option value="14">Last 14 Days</option>
                                <option value="30">Last 30 Days</option>
                            </select>
                        </div>
                        <div class="chart-container large">
                            <canvas id="productivity-trends-chart"></canvas>
                        </div>
                    </div>

                    <div class="chart-card glass-card">
                        <div class="widget-header">
                            <h3>Task Distribution</h3>
                        </div>
                        <div class="chart-container">
                            <canvas id="task-distribution-chart"></canvas>
                        </div>
                    </div>

                    <div class="chart-card glass-card">
                        <div class="widget-header">
                            <h3>Category Breakdown</h3>
                        </div>
                        <div class="chart-container">
                            <canvas id="category-breakdown-chart"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Insights Panel -->
                <div class="analytics-insights glass-card">
                    <div class="widget-header">
                        <h3><i data-lucide="brain-circuit"></i>AI-Generated Insights</h3>
                    </div>
                    <div class="insights-grid" id="analytics-insights"></div>
                </div>
            </div>
        `;
        
        document.getElementById('content-wrapper').appendChild(section);
        lucide.createIcons();
    },

    bindEvents() {
        document.getElementById('productivity-range')?.addEventListener('change', (e) => {
            this.renderProductivityChart(parseInt(e.target.value));
        });
    },

    updateOverview() {
        const tasks = Storage.get(Storage.KEYS.TASKS) || [];
        const dailyStats = Storage.get(Storage.KEYS.DAILY_STATS) || {};
        
        // Total tasks
        document.getElementById('analytics-total-tasks').textContent = tasks.length;
        
        // Completed tasks
        const completed = tasks.filter(t => t.completed).length;
        document.getElementById('analytics-completed-tasks').textContent = completed;
        
        // Total focus hours
        let totalFocusMinutes = 0;
        Object.values(dailyStats).forEach(day => {
            totalFocusMinutes += day.focusTime || 0;
        });
        const focusHours = Math.round(totalFocusMinutes / 60 * 10) / 10;
        document.getElementById('analytics-focus-hours').textContent = focusHours + 'h';
        
        // Average score
        const scores = Object.values(dailyStats)
            .filter(d => d.focusScore > 0)
            .map(d => d.focusScore);
        const avgScore = scores.length > 0 
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) 
            : 0;
        document.getElementById('analytics-avg-score').textContent = avgScore;
    },

    renderProductivityChart(days = 7) {
        const ctx = document.getElementById('productivity-trends-chart');
        if (!ctx) return;
        
        const dailyStats = Storage.get(Storage.KEYS.DAILY_STATS) || {};
        const labels = [];
        const focusData = [];
        const tasksData = [];
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const key = date.toISOString().split('T')[0];
            const dayStats = dailyStats[key] || {};
            
            labels.push(date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
            focusData.push(dayStats.focusScore || 0);
            tasksData.push(dayStats.tasksCompleted || 0);
        }
        
        if (this.charts.productivity) {
            this.charts.productivity.destroy();
        }
        
        this.charts.productivity = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Focus Score',
                        data: focusData,
                        borderColor: '#7c3aed',
                        backgroundColor: 'rgba(124, 58, 237, 0.1)',
                        fill: true,
                        tension: 0.4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Tasks Completed',
                        data: tasksData,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                        tension: 0.4,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { color: '#a0a0b0' }
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        beginAtZero: true,
                        max: 100,
                        title: { display: true, text: 'Focus Score', color: '#7c3aed' },
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#6a6a7a' }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        beginAtZero: true,
                        title: { display: true, text: 'Tasks', color: '#10b981' },
                        grid: { drawOnChartArea: false },
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

    renderTaskDistributionChart() {
        const ctx = document.getElementById('task-distribution-chart');
        if (!ctx) return;
        
        const tasks = Storage.get(Storage.KEYS.TASKS) || [];
        const data = {
            completed: tasks.filter(t => t.completed).length,
            active: tasks.filter(t => !t.completed && (!t.deadline || new Date(t.deadline) >= new Date())).length,
            overdue: tasks.filter(t => !t.completed && t.deadline && new Date(t.deadline) < new Date()).length
        };
        
        if (this.charts.distribution) {
            this.charts.distribution.destroy();
        }
        
        this.charts.distribution = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'Active', 'Overdue'],
                datasets: [{
                    data: [data.completed, data.active, data.overdue],
                    backgroundColor: ['#10b981', '#7c3aed', '#ef4444'],
                    borderColor: 'transparent',
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#a0a0b0', padding: 20 }
                    }
                }
            }
        });
    },

    renderCategoryChart() {
        const ctx = document.getElementById('category-breakdown-chart');
        if (!ctx) return;
        
        const tasks = Storage.get(Storage.KEYS.TASKS) || [];
        const categories = {};
        
        tasks.forEach(task => {
            const cat = task.category || 'other';
            categories[cat] = (categories[cat] || 0) + 1;
        });
        
        const labels = Object.keys(categories).map(c => c.charAt(0).toUpperCase() + c.slice(1));
        const data = Object.values(categories);
        const colors = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
        
        if (this.charts.category) {
            this.charts.category.destroy();
        }
        
        this.charts.category = new Chart(ctx, {
            type: 'polarArea',
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: colors.map(c => c + '80'),
                    borderColor: colors,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#a0a0b0' }
                    }
                },
                scales: {
                    r: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { display: false }
                    }
                }
            }
        });
    },

    renderInsights() {
        const insights = AIEngine.generateInsights();
        const container = document.getElementById('analytics-insights');
        
        if (!container) return;
        
        container.innerHTML = insights.map(insight => `
            <div class="insight-card ${insight.type}">
                <div class="insight-icon">
                    <i data-lucide="${insight.icon}"></i>
                </div>
                <div class="insight-content">
                    <h4>${insight.title}</h4>
                    <p>${insight.message}</p>
                </div>
            </div>
        `).join('');
        
        lucide.createIcons();
    },

    refresh() {
        this.updateOverview();
        this.renderProductivityChart(7);
        this.renderTaskDistributionChart();
        this.renderCategoryChart();
        this.renderInsights();
    }
};
