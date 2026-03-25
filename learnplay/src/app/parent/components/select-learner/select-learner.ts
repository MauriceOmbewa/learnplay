import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ParentApiService } from '../../services/parent-api.service';
import { LearnerService } from '../../../kid/services/learner/learner';
import { UserDataService } from '../../../services/user-data.service';
import { AvatarUtilService } from '../../../services/avatar-util.service';

@Component({
  selector: 'app-select-learner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './select-learner.html',
  styleUrl: './select-learner.css',
})
export class SelectLearner implements OnInit {
  learners: any[] = [];
  guardianName = '';

  constructor(
    private router: Router,
    private parentApiService: ParentApiService,
    private learnerService: LearnerService,
    private userDataService: UserDataService,
    private avatarUtilService: AvatarUtilService
  ) {}

  ngOnInit() {
    this.loadLearners();
    const firstName = this.userDataService.getFirstName();
    this.guardianName = firstName || 'Guardian';
  }

  loadLearners() {
    const userId = this.userDataService.getUserId();
    
    if (!userId) {
      this.router.navigate(['/sign-up/sign-in']);
      return;
    }

    // Fetch fresh data from API
    this.parentApiService.fetchLearnersByUserId(userId).subscribe({
      next: (learners) => {
        this.learners = learners;
        localStorage.setItem('learners', JSON.stringify(learners));
      },
      error: (error) => {
        console.error('Error fetching learners:', error);
        // Fallback to localStorage if API fails
        const learnersData = localStorage.getItem('learners');
        if (learnersData) {
          this.learners = JSON.parse(learnersData);
        }
      }
    });
  }

  // Helper method to determine subscription status
  isSubscribed(expiryDate: string | null): boolean {
    return this.learnerService.isSubscriptionActive(expiryDate);
  }

  onSelectLearner(learner: any) {
    localStorage.setItem('selectedLearner', JSON.stringify(learner));
    this.router.navigate(['/kid']);
  }

  onBack() {
    this.router.navigate(['/who-are-you']);
  }

  getAvatarPath(learner: any): string {
    return this.avatarUtilService.getLearnerAvatarPath(learner);
  }

  getDisplayName(learner: any): string {
    // Use preferred name if available, otherwise use first and last names
    return learner.preferredName && learner.preferredName.trim() 
      ? learner.preferredName.trim() 
      : `${learner.firstName} ${learner.lastName}`;
  }
}
