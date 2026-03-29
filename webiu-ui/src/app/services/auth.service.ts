import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export type UserRole = 'admin' | 'user';

export interface AuthUser {
  id?: string;
  name: string;
  email: string;
  role: UserRole;
  isEmailVerified?: boolean;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
  user: AuthUser;
}

export interface AuthSession {
  accessToken: string | null;
  tokenType: string;
  expiresInSeconds: number;
  user: AuthUser;
  isOAuth?: boolean;
}

export interface RegisterResponse {
  message: string;
  user: AuthUser;
  verificationToken?: string;
}

export interface AdminDashboardStat {
  label: string;
  value: number;
}

export interface AdminDashboardActivity {
  type: 'issue' | 'pull-request';
  title: string;
  author: string;
  url: string;
  createdAt: string;
  state: string;
}

export interface AdminDashboardResponse {
  generatedAt: string;
  stats: AdminDashboardStat[];
  recentActivity: AdminDashboardActivity[];
}

interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly http = inject(HttpClient);
  private readonly storageKey = 'webiu_auth_session';
  private readonly sessionSubject = new BehaviorSubject<AuthSession | null>(
    this.readStoredSession(),
  );

  readonly authSession$ = this.sessionSubject.asObservable();

  get currentSession(): AuthSession | null {
    return this.sessionSubject.value;
  }

  get currentUser(): AuthUser | null {
    return this.currentSession?.user ?? null;
  }

  get accessToken(): string | null {
    return this.currentSession?.accessToken ?? null;
  }

  get isAuthenticated(): boolean {
    return !!this.currentSession;
  }

  get isAdmin(): boolean {
    const session = this.currentSession;
    return !!session?.accessToken && session.user.role === 'admin';
  }

  login(payload: LoginRequest): Observable<AuthSession> {
    return this.http
      .post<AuthResponse>(`${environment.serverUrl}/api/v1/auth/login`, payload)
      .pipe(
        map((response) => ({
          accessToken: response.accessToken,
          tokenType: response.tokenType,
          expiresInSeconds: response.expiresInSeconds,
          user: response.user,
        })),
        tap((session) => this.setSession(session)),
      );
  }

  register(payload: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(
      `${environment.serverUrl}/api/v1/auth/register`,
      payload,
    );
  }

  verifyEmail(token: string): Observable<{ message: string; user: AuthUser }> {
    return this.http.get<{ message: string; user: AuthUser }>(
      `${environment.serverUrl}/api/v1/auth/verify-email?token=${encodeURIComponent(token)}`,
    );
  }

  getAdminDashboard(): Observable<AdminDashboardResponse> {
    return this.http.get<AdminDashboardResponse>(
      `${environment.serverUrl}/api/v1/admin/dashboard`,
    );
  }

  setOAuthSession(user: { name?: string; email?: string }) {
    const session: AuthSession = {
      accessToken: null,
      tokenType: 'Bearer',
      expiresInSeconds: 0,
      user: {
        name: user.name || 'OAuth User',
        email: user.email || 'oauth-user@webiu.local',
        role: 'user',
      },
      isOAuth: true,
    };

    this.setSession(session);
  }

  consumeOAuthUserFromUrl(search: string): boolean {
    const queryParams = new URLSearchParams(search);
    const userParam = queryParams.get('user');

    if (!userParam) {
      return false;
    }

    try {
      const parsedUser = JSON.parse(decodeURIComponent(userParam));
      this.setOAuthSession(parsedUser);
      return true;
    } catch {
      return false;
    }
  }

  logout() {
    this.sessionSubject.next(null);
    this.clearStoredSession();
  }

  private setSession(session: AuthSession) {
    this.sessionSubject.next(session);
    this.persistSession(session);
  }

  private readStoredSession(): AuthSession | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AuthSession;
    } catch {
      return null;
    }
  }

  private persistSession(session: AuthSession) {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    localStorage.setItem(this.storageKey, JSON.stringify(session));
  }

  private clearStoredSession() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    localStorage.removeItem(this.storageKey);
  }
}
