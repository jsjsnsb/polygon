// API Base URL - Update this to match your backend
const API_BASE_URL = '/api';

// API utility class
class API {
    static async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
            ...options,
        };

        try {
            const response = await fetch(url, defaultOptions);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // User endpoints
    static async getUserData(userId) {
        return this.request(`/user/${userId}`);
    }

    static async checkOrCreateUser(userData) {
        return this.request('/user/check-or-create', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    }

    static async updateUser(userId, updateData) {
        return this.request(`/user/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(updateData),
        });
    }

    // Earning endpoints
    static async dailyCheckin(userId) {
        return this.request('/earning/checkin', {
            method: 'POST',
            body: JSON.stringify({ user_id: userId }),
        });
    }

    static async watchAd(userId) {
        return this.request('/earning/watch-ad', {
            method: 'POST',
            body: JSON.stringify({ 
                user_id: userId,
                ad_id: `giga_${Date.now()}`,
                ip_address: await this.getClientIP()
            }),
        });
    }

    static async completeTask(userId, taskId) {
        return this.request('/earning/complete-task', {
            method: 'POST',
            body: JSON.stringify({ 
                user_id: userId, 
                task_id: taskId 
            }),
        });
    }

    static async getRecentEarnings(userId, limit = 10) {
        return this.request(`/earning/recent/${userId}?limit=${limit}`);
    }

    // Task endpoints
    static async getTasks(userId) {
        return this.request(`/tasks/${userId}`);
    }

    static async getTask(taskId) {
        return this.request(`/tasks/single/${taskId}`);
    }

    // Withdrawal endpoints
    static async requestWithdrawal(userId, amount, binanceId) {
        return this.request('/withdrawal/request', {
            method: 'POST',
            body: JSON.stringify({
                user_id: userId,
                amount: amount,
                binance_id: binanceId
            }),
        });
    }

    static async getWithdrawals(userId) {
        return this.request(`/withdrawal/history/${userId}`);
    }

    static async cancelWithdrawal(withdrawalId) {
        return this.request(`/withdrawal/cancel/${withdrawalId}`, {
            method: 'PUT',
        });
    }

    // Referral endpoints
    static async getReferrals(userId) {
        return this.request(`/referral/${userId}`);
    }

    static async getReferralEarnings(userId) {
        return this.request(`/referral/earnings/${userId}`);
    }

    // Statistics endpoints
    static async getStats(userId) {
        return this.request(`/stats/${userId}`);
    }

    static async getLeaderboard(limit = 50) {
        return this.request(`/stats/leaderboard?limit=${limit}`);
    }

    // Utility functions
    static async getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            console.error('Failed to get IP:', error);
            return '0.0.0.0';
        }
    }

    static formatError(error) {
        if (error.response?.data?.message) {
            return error.response.data.message;
        }
        if (error.message) {
            return error.message;
        }
        return 'An unexpected error occurred';
    }
}

// Export API class for use in other files
window.API = API;
