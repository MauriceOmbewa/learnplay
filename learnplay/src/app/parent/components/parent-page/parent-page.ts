import { Component, OnInit, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ParentApiService, LearnerDto } from '../../services/parent-api.service';
import { LearnerTrackerSummaryDto } from '../../../models/learner-tracker-summary.interface';
import { LearnerService } from '../../../kid/services/learner/learner';
import { UserDataService } from '../../../services/user-data.service';
import { AuthService } from '../../../services/auth.service';
import { AvatarUtilService } from '../../../services/avatar-util.service';
import { LoadingDotsComponent } from '../../../shared/components/loading-dots/loading-dots';
import { forkJoin, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

interface Child {
  id: string;
  name: string;
  age: number;
  progress: number;
  totalPoints: number;
  activeSubjects: number;
  avatar: string;
  gender: string;
  gradeId: string;
  subscriptionExpiryDate: string | null; 
}

@Component({
  selector: 'app-parent-page',
  imports: [CommonModule, MatIconModule, LoadingDotsComponent],
  templateUrl: './parent-page.html',
  styleUrl: './parent-page.css',
})
export class ParentPage implements OnInit, OnDestroy {
  children: Child[] = [];
  isLoading = false;
  errorMessage = '';
  private routerSubscription?: Subscription;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private parentApiService: ParentApiService,
    private learnerService: LearnerService,
    private userDataService: UserDataService,
    private authService: AuthService,
    private avatarUtilService: AvatarUtilService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  isSubscribed(expiryDate: string | null): boolean {
    return this.learnerService.isSubscriptionActive(expiryDate);
  }

  ngOnInit() {
    // Check if we should refresh data (coming back from add-child)
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state?.['refresh']) {
      console.log('Refresh requested via navigation state');
      // Small delay to ensure user details are updated
      setTimeout(() => this.fetchChildren(), 100);
    } else {
      this.fetchChildren();
    }
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  // Force refresh data (can be called when returning from add-child)
  refreshData() {
    console.log('Force refreshing parent dashboard data...');
    this.fetchChildren();
  }

  fetchChildren() {
    this.isLoading = true;
    this.errorMessage = '';
    
    const userId = this.userDataService.getUserId();
    
    if (!userId) {
      this.errorMessage = 'User not logged in. Please log in again.';
      this.isLoading = false;
      this.router.navigate(['/sign-up/sign-in']);
      return;
    }

    // Fetch fresh learners data from API (same as select-learner page)
    this.parentApiService.fetchLearnersByUserId(userId).subscribe({
      next: (learners: LearnerDto[]) => {
        console.log('Fetched fresh learners from API:', learners);
        
        // If no learners, set loading to false and return
        if (!learners || learners.length === 0) {
          this.children = [];
          this.isLoading = false;
          return;
        }
        
        // Update localStorage with fresh data
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('learners', JSON.stringify(learners));
        }
        
        // Create array of observables for learner summaries
        const summaryRequests = learners.map((learner: LearnerDto) => 
          this.parentApiService.getLearnerSummary(learner.id!)
        );

        // Fetch all learner summaries in parallel
        forkJoin<LearnerTrackerSummaryDto[]>(summaryRequests).subscribe({
          next: (summaries: LearnerTrackerSummaryDto[]) => {
            this.children = learners.map((learner: LearnerDto, index: number) => {
              const summary = summaries[index];
              // Use preferred name if available, otherwise use first and last names
              const displayName = learner.preferredName && learner.preferredName.trim() 
                ? learner.preferredName.trim() 
                : `${learner.firstName} ${learner.lastName}`;
              
              return {
                id: learner.id!,
                name: displayName,
                age: this.calculateAge(learner.dob),
                progress: Math.round(summary?.percentageCompleted || 0),
                totalPoints: learner.points || 0, // Use actual points from learner data
                activeSubjects: summary?.subjects?.length || 0,
                avatar: learner.avatar || 'brown_boy.png',
                gender: learner.gender,
                gradeId: learner.gradeId,
                subscriptionExpiryDate: (learner as any).subscriptionExpiryDate
              };
            });
            
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error fetching learner summaries:', error);
            // Fallback to basic learner data without progress
            this.children = learners.map((learner: LearnerDto) => {
              // Use preferred name if available, otherwise use first and last names
              const displayName = learner.preferredName && learner.preferredName.trim() 
                ? learner.preferredName.trim() 
                : `${learner.firstName} ${learner.lastName}`;
              
              return {
                id: learner.id!,
                name: displayName,
                age: this.calculateAge(learner.dob),
                progress: 0,
                totalPoints: learner.points || 0, // Use actual points from learner data
                activeSubjects: 0,
                avatar: learner.avatar || 'brown_boy.png',
                gender: learner.gender,
                gradeId: learner.gradeId,
                subscriptionExpiryDate: (learner as any).subscriptionExpiryDate
              };
            });
            
            this.isLoading = false;
          }
        });
      },
      error: (error) => {
        console.error('Error fetching learners:', error);
        
        // Check if it's a 404 or empty response (no learners)
        if (error.status === 404 || error.status === 204) {
          this.children = [];
          this.isLoading = false;
        } else {
          this.errorMessage = 'Failed to load children. Please try again.';
          this.isLoading = false;
        }
      }
    });
  }

  calculateAge(dob: string): number {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  onChildClick(child: Child) {
    // Only access localStorage in browser
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('selectedChild', JSON.stringify(child));
    }
    this.router.navigate(['child', child.id], { relativeTo: this.route });
  }

  onAddChild() {
    this.router.navigate(['add-child'], { relativeTo: this.route });
  }

  onLogout() {
    console.log('🔵 [PARENT PAGE] Logout button clicked');
    
    this.authService.logout().subscribe({
      next: (response) => {
        console.log('🟢 [PARENT PAGE] Logout successful:', response);
        this.router.navigate(['/sign-up/sign-in']);
      },
      error: (error) => {
        console.error('🔴 [PARENT PAGE] Logout failed:', error);
        // Even if logout fails, redirect to sign-in
        this.router.navigate(['/sign-up/sign-in']);
      }
    });
  }

  onBackToWhoAreYou() {
    this.router.navigate(['/who-are-you']);
  }

  getAvatarPath(child: Child): string {
    return this.avatarUtilService.getLearnerAvatarPath(child);
  }
}
