// ===== AI Assistant Module - Chat Interface with Simulated Intelligence =====

const AssistantModule = {
    init() {
        this.renderAssistantSection();
        this.bindEvents();
    },

    renderAssistantSection() {
        const section = document.createElement('section');
        section.id = 'assistant-section';
        section.className = 'section';
        section.innerHTML = `
            <div class="assistant-container">
                <div class="chat-window glass-card">
                    <div class="chat-header">
                        <div class="assistant-info">
                            <div class="assistant-avatar">
                                <i data-lucide="bot"></i>
                                <span class="status-dot online"></span>
                            </div>
                            <div class="assistant-details">
                                <h3>AI Assistant</h3>
                                <span class="assistant-status">Online • Cognitive Engine Active</span>
                            </div>
                        </div>
                        <button id="clear-chat" class="btn btn-ghost" title="Clear Chat">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                    <div class="chat-messages" id="chat-messages">
                        <div class="message assistant">
                            <div class="message-avatar"><i data-lucide="bot"></i></div>
                            <div class="message-content">
                                <p>Hello! I'm your AI productivity assistant. I analyze your behavior patterns, tasks, and habits to provide personalized suggestions. How can I help you today?</p>
                                <span class="message-time">Just now</span>
                            </div>
                        </div>
                    </div>
                    <div class="quick-replies" id="quick-replies">
                        <button class="quick-reply" data-query="How is my productivity?">How is my productivity?</button>
                        <button class="quick-reply" data-query="What should I focus on?">What should I focus on?</button>
                        <button class="quick-reply" data-query="Analyze my habits">Analyze my habits</button>
                        <button class="quick-reply" data-query="Give me a tip">Give me a tip</button>
                    </div>
                    <form class="chat-input" id="chat-form">
                        <input type="text" id="chat-input" placeholder="Ask me anything about your productivity..." autocomplete="off">
                        <button type="submit" class="btn btn-primary">
                            <i data-lucide="send"></i>
                        </button>
                    </form>
                </div>

                <div class="context-panel glass-card">
                    <div class="widget-header">
                        <h3>AI Context</h3>
                    </div>
                    <div class="context-items">
                        <div class="context-item">
                            <span class="context-label">Current Focus Score</span>
                            <span class="context-value" id="context-focus">--</span>
                        </div>
                        <div class="context-item">
                            <span class="context-label">Active Tasks</span>
                            <span class="context-value" id="context-tasks">--</span>
                        </div>
                        <div class="context-item">
                            <span class="context-label">Habits Completed</span>
                            <span class="context-value" id="context-habits">--</span>
                        </div>
                        <div class="context-item">
                            <span class="context-label">Time of Day</span>
                            <span class="context-value" id="context-time">--</span>
                        </div>
                        <div class="context-item">
                            <span class="context-label">Current Mood</span>
                            <span class="context-value" id="context-mood">--</span>
                        </div>
                    </div>
                    <div class="ai-engine-status">
                        <div class="engine-indicator active"></div>
                        <span>Heuristic AI Engine Active</span>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('content-wrapper').appendChild(section);
        lucide.createIcons();
        this.loadChatHistory();
    },

    bindEvents() {
        // Chat form
        document.getElementById('chat-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = document.getElementById('chat-input');
            const query = input.value.trim();
            if (query) {
                this.handleQuery(query);
                input.value = '';
            }
        });

        // Quick replies
        document.querySelectorAll('.quick-reply').forEach(btn => {
            btn.addEventListener('click', () => {
                this.handleQuery(btn.dataset.query);
            });
        });

        // Clear chat
        document.getElementById('clear-chat')?.addEventListener('click', () => {
            this.clearChat();
        });
    },

    handleQuery(query) {
        // Add user message
        this.addMessage(query, 'user');
        
        // Show typing indicator
        this.showTyping();
        
        // Generate response with delay
        setTimeout(() => {
            this.hideTyping();
            const context = this.getContext();
            const response = AIEngine.generateResponse(query, context);
            this.addMessage(response, 'assistant');
            this.saveChatHistory();
        }, 800 + Math.random() * 700);
    },

    addMessage(content, type) {
        const container = document.getElementById('chat-messages');
        const time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        
        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.innerHTML = `
            <div class="message-avatar">
                <i data-lucide="${type === 'user' ? 'user' : 'bot'}"></i>
            </div>
            <div class="message-content">
                <div class="message-text">${this.formatMessage(content)}</div>
                <span class="message-time">${time}</span>
            </div>
        `;
        
        container.appendChild(message);
        container.scrollTop = container.scrollHeight;
        lucide.createIcons();
    },

    formatMessage(content) {
        // Convert markdown-style formatting
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/_(.*?)_/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    },

    showTyping() {
        const container = document.getElementById('chat-messages');
        const typing = document.createElement('div');
        typing.className = 'message assistant typing-indicator';
        typing.id = 'typing-indicator';
        typing.innerHTML = `
            <div class="message-avatar"><i data-lucide="bot"></i></div>
            <div class="message-content">
                <div class="typing-dots">
                    <span></span><span></span><span></span>
                </div>
            </div>
        `;
        container.appendChild(typing);
        container.scrollTop = container.scrollHeight;
        lucide.createIcons();
    },

    hideTyping() {
        const typing = document.getElementById('typing-indicator');
        if (typing) typing.remove();
    },

    getContext() {
        const focusData = AIEngine.calculateFocusScore();
        const mood = AIEngine.determineMood();
        const tasks = Storage.get(Storage.KEYS.TASKS) || [];
        const habits = Storage.get(Storage.KEYS.HABITS) || [];
        const hour = new Date().getHours();
        
        const activeTasks = tasks.filter(t => !t.completed).length;
        const todayHabits = HabitsModule.getTodayHabits?.() || habits;
        const completedHabits = todayHabits.filter(h => h.completions?.includes(new Date().toDateString())).length;
        
        let timeOfDay = 'Morning';
        if (hour >= 12 && hour < 17) timeOfDay = 'Afternoon';
        else if (hour >= 17 && hour < 21) timeOfDay = 'Evening';
        else if (hour >= 21 || hour < 6) timeOfDay = 'Night';
        
        // Update context panel
        document.getElementById('context-focus').textContent = focusData.total + '/100';
        document.getElementById('context-tasks').textContent = activeTasks;
        document.getElementById('context-habits').textContent = `${completedHabits}/${todayHabits.length}`;
        document.getElementById('context-time').textContent = timeOfDay;
        document.getElementById('context-mood').textContent = mood.label;
        
        return {
            focusScore: focusData.total,
            activeTasks,
            completedHabits,
            totalHabits: todayHabits.length,
            timeOfDay,
            mood: mood.mood
        };
    },

    saveChatHistory() {
        const container = document.getElementById('chat-messages');
        const messages = [];
        
        container.querySelectorAll('.message:not(.typing-indicator)').forEach(msg => {
            const type = msg.classList.contains('user') ? 'user' : 'assistant';
            const content = msg.querySelector('.message-text')?.innerHTML || msg.querySelector('p')?.innerHTML || '';
            const time = msg.querySelector('.message-time')?.textContent || '';
            messages.push({ type, content, time });
        });
        
        Storage.set(Storage.KEYS.CHAT_HISTORY, messages.slice(-50)); // Keep last 50 messages
    },

    loadChatHistory() {
        const history = Storage.get(Storage.KEYS.CHAT_HISTORY) || [];
        
        if (history.length > 0) {
            const container = document.getElementById('chat-messages');
            container.innerHTML = '';
            
            history.forEach(msg => {
                const message = document.createElement('div');
                message.className = `message ${msg.type}`;
                message.innerHTML = `
                    <div class="message-avatar">
                        <i data-lucide="${msg.type === 'user' ? 'user' : 'bot'}"></i>
                    </div>
                    <div class="message-content">
                        <div class="message-text">${msg.content}</div>
                        <span class="message-time">${msg.time}</span>
                    </div>
                `;
                container.appendChild(message);
            });
            
            container.scrollTop = container.scrollHeight;
            lucide.createIcons();
        }
    },

    clearChat() {
        if (!confirm('Clear all chat history?')) return;
        
        Storage.set(Storage.KEYS.CHAT_HISTORY, []);
        const container = document.getElementById('chat-messages');
        container.innerHTML = `
            <div class="message assistant">
                <div class="message-avatar"><i data-lucide="bot"></i></div>
                <div class="message-content">
                    <p>Chat cleared. How can I help you today?</p>
                    <span class="message-time">Just now</span>
                </div>
            </div>
        `;
        lucide.createIcons();
        App.showToast('Chat history cleared', 'info');
    },

    refresh() {
        this.getContext();
    }
};
