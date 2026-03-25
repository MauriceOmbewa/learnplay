import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-sign-in',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-sign-in.html',
  styleUrl: './admin-sign-in.css',
})
export class AdminSignIn {
  name = '';
  email = '';
  password = '';
  isSignUp = false;
  errorMessage = '';

  constructor(
    private router: Router,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  toggleMode() {
    this.isSignUp = !this.isSignUp;
    this.errorMessage = '';
  }

  onAdminSignIn() {
    this.errorMessage = '';
    const loginData = { username: this.email.trim(), password: this.password };
    
    this.authService.login(loginData).subscribe({
      next: (userData: any) => {
        if (userData.role !== 'ADMIN') {
          this.errorMessage = 'Access denied. Admin credentials required.';
          return;
        }
        
        this.router.navigate(['/courses']);
      },
      error: (error) => {
        console.error('Login error:', error);
        this.errorMessage = 'Login failed. Please check your credentials.';
      }
    });
  }

  onAdminSignUp() {
    this.errorMessage = '';
    
    if (!this.name || !this.email || !this.password) {
      this.errorMessage = 'Please fill in all fields';
      return;
    }

    const nameParts = this.name.trim().split(' ');
    const userData = {
      username: this.email,
      password: this.password,
      firstName: nameParts[0],
      lastName: nameParts.slice(1).join(' ') || nameParts[0],
      role: 'ADMIN',
      userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    this.http.post(`${environment.apiUrl}/auth/registration`, userData).subscribe({
      next: (response: any) => {
        this.isSignUp = false;
        this.name = '';
        this.password = '';
        this.errorMessage = '';
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
      }
    });
  }
}
