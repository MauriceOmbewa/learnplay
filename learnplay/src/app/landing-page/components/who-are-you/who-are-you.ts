import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserRoleService } from '../../../sign-up/services/user-role.service';
import { UserDataService } from '../../../services/user-data.service';

@Component({
  selector: 'app-who-are-you',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './who-are-you.html',
  styleUrl: './who-are-you.css'
})
export class WhoAreYouComponent implements OnInit {
  isLoggedIn = false;
  showOnlyGuardianAndLearner = false;

  constructor(
    private router: Router, 
    private userRoleService: UserRoleService,
    private userDataService: UserDataService
  ) {}

  ngOnInit() {
    const userRole = this.userDataService.getUserRole();
    if (userRole === 'GUARDIAN') {
      this.isLoggedIn = true;
      this.showOnlyGuardianAndLearner = true;
    } else {
      this.isLoggedIn = false;
      this.showOnlyGuardianAndLearner = false;
    }
  }

  onSelectRole(role: 'kid' | 'parent' | 'teacher') {
    if (this.isLoggedIn && this.showOnlyGuardianAndLearner) {
      if (role === 'parent') {
        this.router.navigate(['/parent']);
      } else if (role === 'kid') {
        this.router.navigate(['/parent/select-learner']);
      }
    } else {
      this.userRoleService.setRole(role);
      this.router.navigate(['/sign-up/sign-in']);
    }
  }
}