import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import axios from 'axios';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  imports: [CommonModule, ReactiveFormsModule],
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading: boolean = false;
  message: string = '';

  constructor(private fb: FormBuilder, private router: Router) {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
      githubId: ['']
    });
  }

  async onSubmit() {
    if (this.registerForm.invalid) {
      return;
    }

    this.isLoading = true;
    const formData = this.registerForm.value;

    try {
      const response = await axios.post('http://localhost:5100/api/auth/register', formData);
      this.message = 'User registered successfully!';
      console.log('User registered:', response);
      this.router.navigate(['/login']);
    } catch (error) {
      this.message = 'Error registering user. Please try again.';
      console.error('Registration error:', error);
    } finally {
      this.isLoading = false;
    }
  }

  redirectToLogin() {
    this.router.navigate(['/login']);
  }
}
