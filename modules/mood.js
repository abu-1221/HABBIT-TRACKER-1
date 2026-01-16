// ===== Mood Module - Adaptive UI Theme System =====

const MoodModule = {
    currentMood: 'focused',
    
    moodThemes: {
        focused: {
            primary: '#7c3aed',
            secondary: '#3b82f6',
            accent: 'rgba(124, 58, 237, 0.3)',
            gradient: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
            contrast: 'high',
            animation: 'normal'
        },
        calm: {
            primary: '#10b981',
            secondary: '#06b6d4',
            accent: 'rgba(16, 185, 129, 0.3)',
            gradient: 'linear-gradient(135deg, #10b981, #06b6d4)',
            contrast: 'normal',
            animation: 'slow'
        },
        alert: {
            primary: '#f59e0b',
            secondary: '#ef4444',
            accent: 'rgba(245, 158, 11, 0.3)',
            gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
            contrast: 'high',
            animation: 'fast'
        },
        low: {
            primary: '#6b7280',
            secondary: '#374151',
            accent: 'rgba(107, 114, 128, 0.3)',
            gradient: 'linear-gradient(135deg, #6b7280, #374151)',
            contrast: 'low',
            animation: 'slow'
        }
    },

    init() {
        this.updateMood();
        // Update mood every 5 minutes
        setInterval(() => this.updateMood(), 5 * 60 * 1000);
    },

    updateMood() {
        const settings = Storage.get(Storage.KEYS.SETTINGS);
        if (!settings?.adaptiveUI) {
            this.applyTheme('focused');
            return;
        }
        
        const moodData = AIEngine.determineMood();
        this.currentMood = moodData.mood;
        this.applyTheme(moodData.mood);
        this.updateMoodIndicator(moodData);
    },

    applyTheme(mood) {
        const theme = this.moodThemes[mood] || this.moodThemes.focused;
        const root = document.documentElement;
        
        root.style.setProperty('--accent-primary', theme.primary);
        root.style.setProperty('--accent-secondary', theme.secondary);
        root.style.setProperty('--accent-primary-glow', theme.accent);
        root.style.setProperty('--mood-current', theme.gradient);
        
        // Update UI elements
        document.body.setAttribute('data-mood', mood);
        
        // Adjust animations
        if (theme.animation === 'slow') {
            root.style.setProperty('--transition-normal', '0.4s ease');
        } else if (theme.animation === 'fast') {
            root.style.setProperty('--transition-normal', '0.15s ease');
        } else {
            root.style.setProperty('--transition-normal', '0.25s ease');
        }
    },

    updateMoodIndicator(moodData) {
        const moodIcon = document.querySelector('.mood-icon');
        const moodValue = document.getElementById('current-mood');
        
        if (moodIcon) {
            moodIcon.style.background = this.moodThemes[moodData.mood].gradient;
        }
        
        if (moodValue) {
            moodValue.textContent = moodData.label;
        }
    },

    getMoodForTime() {
        const hour = new Date().getHours();
        
        // Early morning (5-8): Calm, waking up
        if (hour >= 5 && hour < 8) return 'calm';
        
        // Prime working hours (8-12): Focused
        if (hour >= 8 && hour < 12) return 'focused';
        
        // Post-lunch (12-14): Low energy typically
        if (hour >= 12 && hour < 14) return 'low';
        
        // Afternoon (14-18): Alert/Productive
        if (hour >= 14 && hour < 18) return 'focused';
        
        // Evening (18-22): Calm wind-down
        if (hour >= 18 && hour < 22) return 'calm';
        
        // Night (22-5): Low
        return 'low';
    },

    refresh() {
        this.updateMood();
    }
};
