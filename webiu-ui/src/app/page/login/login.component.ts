import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import axios from 'axios';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  standalone: true,
  styleUrls: ['./login.component.scss'],
  imports: [CommonModule, ReactiveFormsModule],
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage: string = '';

  constructor(private fb: FormBuilder, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });

    this.checkTokenAndRedirect();
  }

  async onSubmit() {
    const userData = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password,
    };

    this.isLoading = true;
    axios
      .post('http://localhost:5100/api/auth/login', userData)
      .then((response) => {
        localStorage.setItem('token', response.data.data.token);
        this.router.navigate(['/']);
      })
      .catch((error) => {
        console.error('Login error:', error);
        this.errorMessage = 'Invalid credentials. Please try again.';
        this.isLoading = false;
      });
  }

  signInWithGoogle() {
    window.location.href = 'https://localhost:5100/api/auth/google';
  }

  signInWithGitHub() {
    window.location.href = 'https://localhost:5100/api/auth/github';
  }

  redirectToRegister() {
    this.router.navigate(['/register']);
  }

  private decodeToken(token: string) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  }

  private checkTokenAndRedirect() {
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken = this.decodeToken(token);

      if (decodedToken) {
        const currentTime = Math.floor(Date.now() / 1000);

        if (decodedToken.exp && decodedToken.exp > currentTime) {
          console.log('User is already logged in. Redirecting to "/"...');
          this.router.navigate(['/']);
          return;
        }
      }

      console.warn('Invalid or expired token. Clearing storage.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
}

function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    token: params.get('token'),
    id: params.get('id'),
    name: params.get('name'),
    email: params.get('email'),
  };
}

function handleGoogleCallback() {
  const { token, id, name, email } = getQueryParams();

  if (token) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify({ id, name, email }));
    window.location.href = '/';
  }
}

if (window.location.search.includes('token=')) {
  handleGoogleCallback();
}
