import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_URL = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  private userSubject: BehaviorSubject<User | null>;
  public user$: Observable<User | null>;

  private isAuthenticatedSubject: BehaviorSubject<boolean>;
  public isAuthenticated$: Observable<boolean>;

  constructor(private http: HttpClient) {
    this.userSubject = new BehaviorSubject<User | null>(
      this.getUserFromStorage(),
    );
    this.user$ = this.userSubject.asObservable();

    this.isAuthenticatedSubject = new BehaviorSubject<boolean>(
      this.isLoggedIn(),
    );
    this.isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  }

  /**
   * Login with email and password
   */
  login(loginRequest: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, loginRequest).pipe(
      tap((response) => {
        this.setToken(response.access_token);
        this.setUser(response.user);
        this.userSubject.next(response.user);
        this.isAuthenticatedSubject.next(true);
      }),
    );
  }

  /**
   * Logout user
   */
  logout(): void {
    this.removeToken();
    this.removeUser();
    this.userSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  /**
   * Check if user has admin role
   */
  isAdmin(): boolean {
    const user = this.getUserFromStorage();
    return user?.role === UserRole.ADMIN;
  }

  /**
   * Check if user has required role(s)
   */
  hasRole(role: UserRole | UserRole[]): boolean {
    const user = this.getUserFromStorage();
    if (!user) return false;

    if (Array.isArray(role)) {
      return role.includes(user.role);
    }

    return user.role === role;
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.getUserFromStorage();
  }

  /**
   * Get authentication token
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Set authentication token
   */
  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Remove authentication token
   */
  private removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  /**
   * Set user data
   */
  private setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  /**
   * Get user from local storage
   */
  private getUserFromStorage(): User | null {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  /**
   * Remove user data
   */
  private removeUser(): void {
    localStorage.removeItem(this.USER_KEY);
  }
}
