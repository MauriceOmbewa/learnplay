import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserDataService } from '../../../services/user-data.service';

@Component({
  selector: 'app-parent-navbar',
  imports: [],
  templateUrl: './parent-navbar.html',
  styleUrl: './parent-navbar.css',
})
export class ParentNavbar implements OnInit {
  private router = inject(Router);
  private userDataService = inject(UserDataService);
  userName = 'User';

  ngOnInit() {
    const firstName = this.userDataService.getFirstName();
    const googleUser = localStorage.getItem('googleUser');
    
    if (firstName) {
      this.userName = firstName;
    } else if (googleUser) {
      const userInfo = JSON.parse(googleUser);
      this.userName = userInfo.given_name || userInfo.name || 'User';
    }
  }

  get isChildDetailsPage(): boolean {
    return this.router.url.includes('/parent/child/');
  }

  onUserProfileClick() {
    this.router.navigate(['/who-are-you']);
  }

  onHomeClick() {
    this.router.navigate(['/parent']);
  }
}
