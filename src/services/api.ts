const API_BASE_URL = 'http://localhost:5001/api';

export const apiClient = {
  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  },

  async authenticatedRequest(endpoint: string, token: string, options: RequestInit = {}) {
    return this.request(endpoint, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  },
};

export const authAPI = {
  async signup(userData: { email: string; password: string; fullName: string; phoneNumber?: string; organization?: string }) {
    return apiClient.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async signin(credentials: { email: string; password: string }) {
    return apiClient.request('/auth/signin', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  async sendOTP(email: string) {
    return apiClient.request('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async verifyOTP(email: string, token: string) {
    return apiClient.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, token }),
    });
  },
};

export const profileAPI = {
  async getProfile(token: string) {
    return apiClient.authenticatedRequest('/profiles/me', token);
  },

  async updateProfile(token: string, profileData: { full_name: string; phone_number?: string; organization?: string }) {
    return apiClient.authenticatedRequest('/profiles/me', token, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },
};

export const reportsAPI = {
  async getGrievanceReports(token: string) {
    return apiClient.authenticatedRequest('/reports/grievance', token);
  },

  async createGrievanceReport(token: string, reportData: any) {
    return apiClient.authenticatedRequest('/reports/grievance', token, {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  },

  async getSuspiciousReports(token: string) {
    return apiClient.authenticatedRequest('/reports/suspicious', token);
  },

  async createSuspiciousReport(token: string, reportData: any) {
    return apiClient.authenticatedRequest('/reports/suspicious', token, {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  },
};

export const aiAPI = {
  async chat(token: string, message: string) {
    return apiClient.authenticatedRequest('/ai/chat', token, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

  async getChatHistory(token: string) {
    return apiClient.authenticatedRequest('/ai/history', token);
  },
};