// src/app/services/auth.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';  // Replace with your environment path

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:5100/api'; // Your backend API base URL
  private currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>;

  constructor(private http: HttpClient) {
    this.currentUserSubject = new BehaviorSubject<any>(JSON.parse(localStorage.getItem('currentUser') || '{}'));
    this.currentUser = this.currentUserSubject.asObservable();
  }

  // Register a new user
  register(userData: { name: string, email: string, password: string, confirmPassword: string }) {
    const { name, email, password, confirmPassword } = userData;
    return this.http.post<any>(`${this.apiUrl}/auth/register`, { name, email, password, confirmPassword }).pipe(
      catchError((error) => {
        throw error;
      })
    );
  }

  // Login a user
  login(email: string, password: string) {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, { email, password }).pipe(
      tap((user) => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
      }),
      catchError((error) => {
        throw error;
      })
    );
  }

  // Logout the user
  logout() {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  // Get the current logged-in user
  get currentUserValue() {
    return this.currentUserSubject.value;
  }

  // Check if the user is logged in
  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }
}
