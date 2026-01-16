// ===== Tasks Module - Smart Task Management =====

const TasksModule = {
    currentFilter: 'all',

    init() {
        this.renderTasksSection();
        this.bindEvents();
    },

    renderTasksSection() {
        const section = document.createElement('section');
        section.id = 'tasks-section';
        section.className = 'section';
        section.innerHTML = `
            <div class="tasks-container">
                <div class="tasks-header">
                    <div class="tasks-filters">
                        <button class="filter-btn active" data-filter="all">All</button>
                        <button class="filter-btn" data-filter="active">Active</button>
                        <button class="filter-btn" data-filter="completed">Completed</button>
                        <button class="filter-btn" data-filter="overdue">Overdue</button>
                    </div>
                    <button id="add-task-btn" class="btn btn-primary">
                        <i data-lucide="plus"></i>
                        New Task
                    </button>
                </div>

                <div class="ai-priority-banner glass-card" id="ai-priority-banner">
                    <div class="banner-icon"><i data-lucide="brain-circuit"></i></div>
                    <div class="banner-content">
                        <h4>AI Priority Analysis</h4>
                        <p id="ai-priority-message">Tasks are automatically prioritized based on deadlines and importance.</p>
                    </div>
                    <button id="ai-reprioritize" class="btn btn-secondary">
                        <i data-lucide="wand-2"></i>
                        Re-prioritize
                    </button>
                </div>

                <div class="tasks-grid" id="tasks-grid"></div>

                <div class="tasks-empty hidden" id="tasks-empty">
                    <div class="empty-illustration"><i data-lucide="clipboard-list"></i></div>
                    <h3>No tasks yet</h3>
                    <p>Start by adding your first task to get organized!</p>
                    <button class="btn btn-primary" id="empty-add-task">
                        <i data-lucide="plus"></i>
                        Add Your First Task
                    </button>
                </div>
            </div>
        `;
        
        document.getElementById('content-wrapper').appendChild(section);
        this.renderTaskModal();
        lucide.createIcons();
    },

    renderTaskModal() {
        const modal = document.createElement('div');
        modal.id = 'task-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content glass-card">
                <div class="modal-header">
                    <h2 id="task-modal-title">Add New Task</h2>
                    <button class="modal-close" id="close-task-modal"><i data-lucide="x"></i></button>
                </div>
                <form id="task-form" class="modal-form">
                    <input type="hidden" id="task-id">
                    <div class="form-group">
                        <label for="task-title">Task Title</label>
                        <input type="text" id="task-title" placeholder="What needs to be done?" required>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="task-priority">Priority</label>
                            <select id="task-priority">
                                <option value="low">Low</option>
                                <option value="medium" selected>Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="task-category">Category</label>
                            <select id="task-category">
                                <option value="work">Work</option>
                                <option value="personal">Personal</option>
                                <option value="health">Health</option>
                                <option value="learning">Learning</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="task-deadline">Deadline</label>
                        <input type="datetime-local" id="task-deadline">
                    </div>
                    <div class="form-group">
                        <label for="task-description">Description (Optional)</label>
                        <textarea id="task-description" rows="3" placeholder="Add more details..."></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" id="cancel-task">Cancel</button>
                        <button type="submit" class="btn btn-primary">
                            <i data-lucide="check"></i>
                            Save Task
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.getElementById('modals-container').appendChild(modal);
        lucide.createIcons();
    },

    bindEvents() {
        // Filter buttons
        document.querySelectorAll('.tasks-filters .filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFilter(e));
        });

        // Add task buttons
        document.getElementById('add-task-btn')?.addEventListener('click', () => this.openModal());
        document.getElementById('empty-add-task')?.addEventListener('click', () => this.openModal());

        // Modal controls
        document.getElementById('close-task-modal')?.addEventListener('click', () => this.closeModal());
        document.getElementById('cancel-task')?.addEventListener('click', () => this.closeModal());
        document.querySelector('#task-modal .modal-overlay')?.addEventListener('click', () => this.closeModal());

        // Form submission
        document.getElementById('task-form')?.addEventListener('submit', (e) => this.handleSubmit(e));

        // AI reprioritize
        document.getElementById('ai-reprioritize')?.addEventListener('click', () => this.reprioritizeTasks());
    },

    handleFilter(e) {
        const filter = e.target.dataset.filter;
        this.currentFilter = filter;
        
        document.querySelectorAll('.tasks-filters .filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        this.renderTasks();
    },

    openModal(task = null) {
        const modal = document.getElementById('task-modal');
        const title = document.getElementById('task-modal-title');
        const form = document.getElementById('task-form');
        
        if (task) {
            title.textContent = 'Edit Task';
            document.getElementById('task-id').value = task.id;
            document.getElementById('task-title').value = task.title;
            document.getElementById('task-priority').value = task.priority;
            document.getElementById('task-category').value = task.category;
            document.getElementById('task-deadline').value = task.deadline || '';
            document.getElementById('task-description').value = task.description || '';
        } else {
            title.textContent = 'Add New Task';
            form.reset();
            document.getElementById('task-id').value = '';
        }
        
        modal.classList.add('active');
    },

    closeModal() {
        document.getElementById('task-modal').classList.remove('active');
    },

    handleSubmit(e) {
        e.preventDefault();
        
        const id = document.getElementById('task-id').value;
        const taskData = {
            title: document.getElementById('task-title').value.trim(),
            priority: document.getElementById('task-priority').value,
            category: document.getElementById('task-category').value,
            deadline: document.getElementById('task-deadline').value || null,
            description: document.getElementById('task-description').value.trim()
        };
        
        if (id) {
            this.updateTask(id, taskData);
        } else {
            this.addTask(taskData);
        }
        
        this.closeModal();
    },

    addTask(taskData) {
        const tasks = Storage.get(Storage.KEYS.TASKS) || [];
        const newTask = {
            id: Date.now().toString(),
            ...taskData,
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null
        };
        
        tasks.push(newTask);
        Storage.set(Storage.KEYS.TASKS, tasks);
        
        // Update today's stats
        const stats = Storage.getTodayStats();
        Storage.updateTodayStats({ tasksCreated: (stats.tasksCreated || 0) + 1 });
        
        this.renderTasks();
        App.showToast('Task added successfully!', 'success');
        App.updateDashboard();
    },

    updateTask(id, taskData) {
        const tasks = Storage.get(Storage.KEYS.TASKS) || [];
        const index = tasks.findIndex(t => t.id === id);
        
        if (index !== -1) {
            tasks[index] = { ...tasks[index], ...taskData };
            Storage.set(Storage.KEYS.TASKS, tasks);
            this.renderTasks();
            App.showToast('Task updated!', 'success');
            App.updateDashboard();
        }
    },

    deleteTask(id) {
        if (!confirm('Are you sure you want to delete this task?')) return;
        
        let tasks = Storage.get(Storage.KEYS.TASKS) || [];
        tasks = tasks.filter(t => t.id !== id);
        Storage.set(Storage.KEYS.TASKS, tasks);
        
        this.renderTasks();
        App.showToast('Task deleted', 'info');
        App.updateDashboard();
    },

    toggleComplete(id) {
        const tasks = Storage.get(Storage.KEYS.TASKS) || [];
        const task = tasks.find(t => t.id === id);
        
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            Storage.set(Storage.KEYS.TASKS, tasks);
            
            // Update stats
            if (task.completed) {
                const stats = Storage.getTodayStats();
                Storage.updateTodayStats({ tasksCompleted: (stats.tasksCompleted || 0) + 1 });
                
                // Show next event notification
                if (typeof NotificationsModule !== 'undefined') {
                    NotificationsModule.notifyNextEvent('task', task);
                }
            }
            
            this.renderTasks();
            App.showToast(task.completed ? 'Task completed! 🎉' : 'Task reopened', 'success');
            App.updateDashboard();
        }
    },

    reprioritizeTasks() {
        const tasks = Storage.get(Storage.KEYS.TASKS) || [];
        const prioritized = AIEngine.prioritizeTasks(tasks.filter(t => !t.completed));
        
        // Update message
        const overdueCount = prioritized.filter(t => t.deadline && new Date(t.deadline) < new Date()).length;
        const message = overdueCount > 0 
            ? `⚠️ ${overdueCount} overdue task(s) detected! These have been moved to the top.`
            : '✅ Tasks optimally organized by deadline and importance.';
        
        document.getElementById('ai-priority-message').textContent = message;
        
        App.showToast('Tasks re-prioritized by AI!', 'success');
        this.renderTasks();
    },

    renderTasks() {
        const tasks = Storage.get(Storage.KEYS.TASKS) || [];
        const grid = document.getElementById('tasks-grid');
        const empty = document.getElementById('tasks-empty');
        const banner = document.getElementById('ai-priority-banner');
        
        // Filter tasks
        let filtered = tasks;
        const now = new Date();
        
        switch (this.currentFilter) {
            case 'active':
                filtered = tasks.filter(t => !t.completed);
                break;
            case 'completed':
                filtered = tasks.filter(t => t.completed);
                break;
            case 'overdue':
                filtered = tasks.filter(t => !t.completed && t.deadline && new Date(t.deadline) < now);
                break;
        }
        
        // AI prioritization for active tasks
        if (this.currentFilter !== 'completed') {
            filtered = AIEngine.prioritizeTasks(filtered);
        }
        
        if (filtered.length === 0) {
            grid.classList.add('hidden');
            empty.classList.remove('hidden');
            banner.classList.add('hidden');
        } else {
            grid.classList.remove('hidden');
            empty.classList.add('hidden');
            banner.classList.remove('hidden');
            
            grid.innerHTML = filtered.map(task => this.renderTaskCard(task)).join('');
            lucide.createIcons();
            
            // Bind task events
            grid.querySelectorAll('.task-card').forEach(card => {
                const id = card.dataset.id;
                card.querySelector('.task-check')?.addEventListener('click', () => this.toggleComplete(id));
                card.querySelector('.edit-task')?.addEventListener('click', () => {
                    const task = tasks.find(t => t.id === id);
                    this.openModal(task);
                });
                card.querySelector('.delete-task')?.addEventListener('click', () => this.deleteTask(id));
            });
        }
    },

    renderTaskCard(task) {
        const isOverdue = !task.completed && task.deadline && new Date(task.deadline) < new Date();
        const priorityClass = `priority-${task.priority}`;
        const categoryIcons = {
            work: 'briefcase',
            personal: 'user',
            health: 'heart',
            learning: 'book',
            other: 'folder'
        };
        
        const deadlineText = task.deadline ? this.formatDeadline(task.deadline) : '';
        
        return `
            <div class="task-card glass-card ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}" data-id="${task.id}">
                <div class="task-header">
                    <button class="task-check ${task.completed ? 'checked' : ''}">
                        <i data-lucide="${task.completed ? 'check-circle-2' : 'circle'}"></i>
                    </button>
                    <span class="task-priority ${priorityClass}">${task.priority}</span>
                </div>
                <div class="task-body">
                    <h4 class="task-title">${task.title}</h4>
                    ${task.description ? `<p class="task-description">${task.description}</p>` : ''}
                </div>
                <div class="task-footer">
                    <div class="task-meta">
                        <span class="task-category">
                            <i data-lucide="${categoryIcons[task.category] || 'folder'}"></i>
                            ${task.category}
                        </span>
                        ${deadlineText ? `<span class="task-deadline ${isOverdue ? 'overdue' : ''}">
                            <i data-lucide="clock"></i>
                            ${deadlineText}
                        </span>` : ''}
                    </div>
                    <div class="task-actions">
                        <button class="edit-task" title="Edit"><i data-lucide="pencil"></i></button>
                        <button class="delete-task" title="Delete"><i data-lucide="trash-2"></i></button>
                    </div>
                </div>
            </div>
        `;
    },

    formatDeadline(deadline) {
        const date = new Date(deadline);
        const now = new Date();
        const diffHours = (date - now) / (1000 * 60 * 60);
        
        if (diffHours < 0) return 'Overdue';
        if (diffHours < 1) return 'Due soon';
        if (diffHours < 24) return `${Math.round(diffHours)}h left`;
        if (diffHours < 48) return 'Tomorrow';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    },

    getUpcomingTasks(limit = 5) {
        const tasks = Storage.get(Storage.KEYS.TASKS) || [];
        const active = tasks.filter(t => !t.completed);
        const prioritized = AIEngine.prioritizeTasks(active);
        return prioritized.slice(0, limit);
    }
};
