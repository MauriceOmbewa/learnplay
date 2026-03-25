import { Component, OnInit } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LearnerService } from '../../services/learner/learner';
import { AvatarUtilService } from '../../../services/avatar-util.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [MatToolbarModule, CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit {
  selectedLearner: any = null; 
  userPoints = 0;

  constructor(
    private learnerService: LearnerService, 
    private router: Router,
    private avatarUtilService: AvatarUtilService
  ) {}

  ngOnInit(): void {
    const selectedLearnerStr = localStorage.getItem('selectedLearner');
    
    if (selectedLearnerStr) {
       this.selectedLearner = JSON.parse(selectedLearnerStr);
      
      this.userPoints = this.selectedLearner.points || 0; 

      const userId = this.selectedLearner.appUserId || this.selectedLearner.id;
      if (userId) {
        this.loadFreshPoints(userId);
      }
    }
  }

  loadFreshPoints(userId: string) {
    this.learnerService.getLearnerByUserId(userId).subscribe({
      next: (learners) => {
        if (learners && learners.length > 0) {
          // Update the UI with the real points from the server
          const freshLearner = learners[0];
          this.userPoints = freshLearner.points;
          
          // Optional: Update storage so it's fresh for the next refresh
          this.selectedLearner = { ...this.selectedLearner, ...freshLearner };
          localStorage.setItem('selectedLearner', JSON.stringify(this.selectedLearner));
        }
      },
      error: (err) => console.error('Navbar: Could not refresh points', err)
    });
  }

  getAvatarPath(learner: any): string {
    return this.avatarUtilService.getLearnerAvatarPath(learner);
  }

  onHomeClick() {
    this.router.navigate(['/kid']);
  }
}