// lib/api-service.ts
export class ApiService {
  private static baseUrl = '/api';

  // Authentication endpoints
  static async login(credentials: { email: string; password: string }) {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return response.json();
  }

  static async register(userData: { email: string; password: string; channel_name: string }) {
    const response = await fetch(`${this.baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return response.json();
  }

  static async getUserData(token: string) {
    const response = await fetch(`${this.baseUrl}/auth/user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    return response.json();
  }

  // Livestream endpoints
  static async fetchAllLiveStreams() {
    const response = await fetch(`${this.baseUrl}/livestream/all-streams`, {
      headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
  }

  static async fetchLiveStreamsByType(streamType: string) {
    const response = await fetch(`${this.baseUrl}/livestream/type/${streamType}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    return data.livestreams || [];
  }

  static async createLiveStream(data: { userId: string; streamType?: string }) {
    const response = await fetch(`${this.baseUrl}/livestream/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: data.userId,
        streamType: data.streamType || 'rtmp',
      }),
    });
    return response.json();
  }

  static async endLiveStream(liveId: string, userId: string) {
    const response = await fetch(`${this.baseUrl}/livestream/${liveId}/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    return response.json();
  }

  static async getLiveStreamDetails(liveId: string) {
    const response = await fetch(`${this.baseUrl}/livestream/${liveId}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
  }

  static async joinLivestream(liveId: string, userId: string) {
    const response = await fetch(`${this.baseUrl}/livestream/${liveId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    return response.json();
  }

  static async leaveLivestream(liveId: string, userId: string) {
    const response = await fetch(`${this.baseUrl}/livestream/${liveId}/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    return response.json();
  }

  static async forgotPassword(email: string) {
    const response = await fetch(`${this.baseUrl}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return response.json();
  }

  static async getUserActiveStream(userId: string) {
    const response = await fetch(`${this.baseUrl}/livestream/user/${userId}/active`);
    return response.json();
  }
}
