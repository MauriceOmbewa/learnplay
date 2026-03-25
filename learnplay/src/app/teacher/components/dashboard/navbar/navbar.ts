import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css'],
})
export class Navbar {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  goToCourses() {
    this.router.navigate(['/courses']);
  }

  onHomeClick() {
    this.router.navigate(['/courses']);
  }
  
  onLogout() {
    console.log('🔵 [ADMIN NAVBAR] Logout button clicked');
    
    this.authService.logout().subscribe({
      next: (response) => {
        console.log('🟢 [ADMIN NAVBAR] Logout successful:', response);
        this.router.navigate(['/sign-up/sign-in']);
      },
      error: (error) => {
        console.error('🔴 [ADMIN NAVBAR] Logout failed:', error);
        // Even if logout fails, redirect to sign-in
        this.router.navigate(['/sign-up/sign-in']);
      }
    });
  }
}
