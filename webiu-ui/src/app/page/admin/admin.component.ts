import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
})
export class AdminComponent implements OnInit {
  username = '';
  password = '';
  isLoading = false;
  isCheckingSession = true;

  private authService = inject(AuthService);
  private router = inject(Router);
  private toastr = inject(ToastrService);

  ngOnInit(): void {
    // Redirect to dashboard if already logged in
    this.isCheckingSession = true;
    this.authService.checkSession().subscribe({
      next: (res) => {
        this.isCheckingSession = false;
        if (res.authenticated) {
          this.router.navigate(['/admin/dashboard']);
        }
      },
      error: () => {
        this.isCheckingSession = false;
      }
    });
  }

  onSubmit(): void {
    if (!this.username || !this.password) {
      this.toastr.error('Please enter both username and password');
      return;
    }

    this.isLoading = true;
    this.authService.login({ username: this.username, password: this.password }).subscribe({
      next: () => {
        this.toastr.success('Logged in successfully');
        this.isLoading = false;
        this.router.navigate(['/admin/dashboard']);
      },
      error: (err) => {
        const msg = err.error?.message || 'Invalid administrator credentials';
        this.toastr.error(msg);
        this.isLoading = false;
      },
    });
  }
}
