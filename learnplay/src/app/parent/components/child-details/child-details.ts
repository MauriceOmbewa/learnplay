import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ParentApiService, LearnerDto, GradeSubjectDetailsDto, LessonTrackerDto } from '../../services/parent-api.service';
import { LearnerTrackerSummaryDto, SubjectSummary } from '../../../models/learner-tracker-summary.interface';
import { AvatarUtilService } from '../../../services/avatar-util.service';
import { LoadingDotsComponent } from '../../../shared/components/loading-dots/loading-dots';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { forkJoin } from 'rxjs';

interface Activity {
  type: string;
  title: string;
  description: string;
  points: number;
  date: string;
  icon: string;
}

interface Subject {
  id: string;
  name: string;
  icon: string;
  completedUnits: number;
  totalUnits: number;
  points: number;
  progress: number;
}

interface Child {
  id: string;
  name: string;
  age: number;
  progress: number;
  totalPoints: number;
  activeSubjects: number;
  avatar: string;
  gender: string;
  memberSince: string;
  unitsCompleted: number;
  quizzesPassed: number;
  dayStreak: number;
  subjects: Subject[];
  recentActivities: Activity[];
}

@Component({
  selector: 'app-child-details',
  imports: [CommonModule, LoadingDotsComponent],
  templateUrl: './child-details.html',
  styleUrl: './child-details.css',
})
export class ChildDetails implements OnInit {
  child: Child | null = null;
  learnerSummary: LearnerTrackerSummaryDto | null = null;
  isLoading = false;

  constructor(
    private router: Router, 
    private route: ActivatedRoute,
    private parentApiService: ParentApiService,
    private avatarUtilService: AvatarUtilService
  ) {}

  ngOnInit() {
    const storedChild = localStorage.getItem('selectedChild');
    if (storedChild) {
      this.child = JSON.parse(storedChild);
      console.log('Child data:', this.child);
      
      // If gender is missing, try to get it from learners storage
      if (this.child && !this.child.gender) {
        this.child.gender = this.getGenderFromStorage(this.child.id);
      }
      
      if (this.child?.id) {
        this.loadLearnerProgress(this.child.id);
      }
    }
  }

  loadLearnerProgress(learnerId: string) {
    this.isLoading = true;
    console.log('Fetching learner data for ID:', learnerId);
    
    // Fetch both summary and history in parallel
    forkJoin({
      summary: this.parentApiService.getLearnerSummary(learnerId),
      history: this.parentApiService.getLearnerHistory(learnerId)
    }).subscribe({
      next: ({ summary, history }) => {
        console.log('Received learner summary:', summary);
        console.log('Received learner history:', history);
        
        this.learnerSummary = summary;
        
        if (this.child) {
          // Update child data with real progress data
          this.child.progress = Math.round(summary.percentageCompleted || 0);
          this.child.totalPoints = this.getActualPointsFromStorage() || summary.lessonCompletedCount || 0;
          this.child.activeSubjects = summary.subjects?.length || 0;
          this.child.unitsCompleted = summary.lessonCompletedCount || 0;
          this.child.dayStreak = summary.streak || 0;
          this.child.quizzesPassed = 0; // Not available in current API
          
          // Get member since from stored learner data
          this.child.memberSince = this.getMemberSinceFromStorage();
          
          // Map subjects from API response
          this.child.subjects = this.mapSubjectsFromSummary(summary.subjects || []);
          
          // Map recent activities from history API response
          this.child.recentActivities = this.mapActivitiesFromHistory(history || []);
          
          console.log('Updated child data:', this.child);
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching learner data:', error);
        this.isLoading = false;
        
        // Set default values on error
        if (this.child) {
          this.child.totalPoints = this.getActualPointsFromStorage();
          this.child.unitsCompleted = 0;
          this.child.quizzesPassed = 0;
          this.child.dayStreak = 0;
          this.child.memberSince = this.getMemberSinceFromStorage();
          this.child.recentActivities = [];
          this.child.subjects = [];
        }
      }
    });
  }

  getActualPointsFromStorage(): number {
    try {
      const learners = localStorage.getItem('learners');
      if (learners && this.child) {
        const learnersArray = JSON.parse(learners);
        const currentLearner = learnersArray.find((l: any) => l.id === this.child?.id);
        
        if (currentLearner && currentLearner.points !== undefined) {
          return currentLearner.points;
        }
      }
    } catch (error) {
      console.error('Error parsing learner data from storage:', error);
    }
    return 0;
  }

  getMemberSinceFromStorage(): string {
    try {
      const learners = localStorage.getItem('learners');
      if (learners && this.child) {
        const learnersArray = JSON.parse(learners);
        const currentLearner = learnersArray.find((l: any) => l.id === this.child?.id);
        
        if (currentLearner && currentLearner.createdAt) {
          return this.formatMemberSince(currentLearner.createdAt);
        }
      }
    } catch (error) {
      console.error('Error parsing learner data from storage:', error);
    }
    return '-';
  }

  formatMemberSince(createdAt: string): string {
    try {
      const date = new Date(createdAt);
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      
      return `${month} ${year}`;
    } catch (error) {
      console.error('Error formatting member since date:', error);
      return '-';
    }
  }

  mapSubjectsFromSummary(subjects: SubjectSummary[]): Subject[] {
    const iconMap: { [key: string]: string } = {
      'MATHEMATICS': 'maths',
      'MATH': 'maths',
      'MATHS': 'maths',
      'ENGLISH': 'english',
      'SCIENCE': 'science',
      'KISWAHILI': 'english', // Using english icon as fallback
      'SOCIAL STUDIES': 'science' // Using science icon as fallback
    };
    
    return subjects.map(subject => ({
      id: subject.id,
      name: subject.name,
      icon: iconMap[subject.name.toUpperCase()] || 'maths',
      completedUnits: subject.lessonCompletedCount || 0, // Lessons completed for this subject
      totalUnits: subject.lessonCount || 0, // Total lessons for this subject
      points: subject.lessonCompletedCount || 0, // Keep using completed lessons as subject points for now
      progress: Math.round(subject.percentageCompleted || 0)
    }));
  }

  mapActivitiesFromHistory(history: LessonTrackerDto[]): Activity[] {
    return history.map(item => ({
      type: 'lesson_completed',
      title: `Completed ${item.lessonName}`,
      description: `${item.subjectName} lesson completed`,
      points: 10, // Default points per lesson completion
      date: item.completedAt,
      icon: 'trophy'
    }));
  }

  getLessonText(count: number): string {
    return count === 1 ? 'lesson' : 'lessons';
  }

  onBackToChildren() {
    this.router.navigate(['/parent']);
  }

  getGenderFromStorage(childId: string): string {
    try {
      const learners = localStorage.getItem('learners');
      if (learners) {
        const learnersArray = JSON.parse(learners);
        const currentLearner = learnersArray.find((l: any) => l.id === childId);
        
        if (currentLearner && currentLearner.gender) {
          return currentLearner.gender;
        }
      }
    } catch (error) {
      console.error('Error getting gender from storage:', error);
    }
    return 'MALE'; // Default fallback
  }

  getAvatarPath(child: Child): string {
    return this.avatarUtilService.getLearnerAvatarPath(child);
  }
}