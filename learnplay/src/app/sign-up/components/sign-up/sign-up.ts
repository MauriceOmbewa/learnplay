import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserRoleService } from '../../services/user-role.service';
import { GoogleAuthService } from '../../../services/google-auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-sign-up',
  imports: [CommonModule, FormsModule],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.css',
})
export class SignUp {
  name = '';
  email = '';
  password = '';
  errorMessage = '';
  isSubmitting = false;

  constructor(
    private router: Router, 
    private userRoleService: UserRoleService, 
    private googleAuth: GoogleAuthService,
    private http: HttpClient
  ) {}

  navigateToSignIn() {
    this.router.navigate(['/sign-up/sign-in']);
  }

  navigateToLandingPage() {
    this.router.navigate(['/']);
  }

  onSignUp() {
    if (!this.name || !this.email || !this.password) {
      this.errorMessage = 'Please fill in all fields';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const nameParts = this.name.trim().split(' ');
    const userData = {
      username: this.email,
      password: this.password,
      firstName: nameParts[0],
      lastName: nameParts.slice(1).join(' ') || nameParts[0],
      role: 'GUARDIAN',
      userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    console.log('Registering user:', userData);

    this.http.post(`${environment.apiUrl}/auth/registration`, userData).subscribe({
      next: (response: any) => {
        console.log('User registered:', response);
        this.router.navigate(['/sign-up/sign-in']);
      },
      error: (error) => {
        console.error('Registration failed:', error);
        this.errorMessage = error.error?.message || 'Registration failed';
        this.isSubmitting = false;
      }
    });
  }

  async onGoogleSignUp() {
    try {
      const response = await this.googleAuth.simpleGoogleSignIn();
      const userData = this.googleAuth.extractUserData(response.credential);
      
      console.log('Google Sign-Up successful:', userData);
      
      // Send Google user data to backend for registration
      const googleRegisterData = {
        googleId: userData.googleId,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        profilePicture: userData.profilePicture,
        emailVerified: userData.emailVerified,
        role: 'GUARDIAN',
        userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };

      console.log('Registering user with Google:', googleRegisterData);

      this.http.post(`${environment.apiUrl}/auth/google/register`, googleRegisterData).subscribe({
        next: (backendResponse: any) => {
          console.log('Google registration successful:', backendResponse);
          this.router.navigate(['/sign-up/sign-in']);
        },
        error: (error) => {
          console.error('Google registration failed:', error);
          if (error.error?.message?.includes('already exists') || error.error?.message?.includes('already taken')) {
            console.log('User already exists, redirecting to sign-in');
            this.errorMessage = 'Account already exists. Please sign in instead.';
            setTimeout(() => {
              this.router.navigate(['/sign-up/sign-in']);
            }, 2000);
          } else {
            this.errorMessage = 'Google Sign-Up failed: ' + (error.error?.message || error.message);
          }
        }
      });
    } catch (error) {
      console.error('Google Sign-Up failed:', error);
      this.errorMessage = 'Google Sign-Up failed. Please try again or use regular sign-up.';
    }
  }
}
