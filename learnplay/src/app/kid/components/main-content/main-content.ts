import { Component, OnInit } from '@angular/core';
import { NgClass } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ProgressBar } from '../../reusable/progress-bar/progress-bar';
import { Router, ActivatedRoute } from '@angular/router';
import { LearnerService } from '../../services/learner/learner';
import {
  GradeSubjectService,
  GradeSubjectDetails,
} from '../../services/grade-subjects/grade-subjects';
import { LearnersSummary, SubjectSummary } from '../../services/learners-summary/learners-summary';
import { forkJoin } from 'rxjs'; // 1. Added forkJoin for cleaner loading
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-main-content',
  imports: [
    NgClass,
    MatCardModule,
    MatToolbarModule,
    MatIconModule,
    MatProgressBarModule,
    ProgressBar,
  ],
  templateUrl: './main-content.html',
  styleUrl: './main-content.css',
})
export class MainContent implements OnInit {
  userName = 'Guest';
  subjects: GradeSubjectDetails[] = [];

  // subjects = [
  //   {
  //     name: 'Math',
  //     progress: 65,
  //     points: 450,
  //     description: 'Numbers and fun!',
  //     icon: '/assets/icons/maths.png',
  //     bg: 'bg-[linear-gradient(134.45deg,#F8C96C_15.3%,#FCA780_81.76%)]',
  //     color: 'text-orange-600',
  //     gradient: 'linear-gradient(to right, #FAC815, #F97616)',
  //     link: '/math-subject',
  //   },
  //   {
  //     name: 'Science',
  //     progress: 40,
  //     points: 320,
  //     description: 'Discover the world!',
  //     icon: '/assets/icons/microscope.png',
  //     bg: 'bg-[linear-gradient(134.45deg,#67ECA3_15.3%,#43D785_81.76%)]',
  //     color: 'text-green-600',
  //     gradient: 'linear-gradient(to right, #49D888, #3C89ED)',
  //     link: '/science-subject',
  //   },
  //   {
  //     name: 'English',
  //     progress: 80,
  //     points: 680,
  //     description: 'Read and write!',
  //     icon: '/assets/icons/book.png',
  //     bg: 'bg-[linear-gradient(134.45deg,#B1EAE9_15.3%,#F2D9E4_81.76%)]',
  //     color: 'text-blue-600',
  //     gradient: 'linear-gradient(to right, #62A2F9, #A757F7)',
  //     link: '/english-subject',
  //   },
  //   {
  //     name: 'Art',
  //     progress: 25,
  //     points: 180,
  //     description: 'Create beautiful things!',
  //     icon: '/assets/icons/art.png',
  //     bg: 'bg-[linear-gradient(134.45deg,#D6C3FC_15.3%,#9CC4FC_81.76%)]',
  //     color: 'text-purple-600',
  //     gradient: 'linear-gradient(to right, #C57CF0, #EA4C9F)',
  //     link: '/art-subject',
  //   },
  // ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private learnerService: LearnerService,
    private gradeSubjectService: GradeSubjectService,
    private summaryService: LearnersSummary,
  ) {}

  ngOnInit(): void {
    const selectedLearnerStr = localStorage.getItem('selectedLearner');

    if (selectedLearnerStr) {
      const selectedLearner = JSON.parse(selectedLearnerStr);

      this.userName = selectedLearner.firstName || selectedLearner.preferredName || 'Learner';

      const gradeId = selectedLearner.gradeId;
      const learnerId = selectedLearner.id;

      if (gradeId && learnerId) {
        console.log('Loading dashboard for Grade:', gradeId);
        //this.loadDashboard(gradeId);
        this.loadDashboardData(learnerId, gradeId);
      } else {
        console.warn('Selected learner has no gradeId attached.');
      }
    } else {
      console.warn('No selected learner found in storage.');
    }
  }

  loadDashboardData(learnerId: string, gradeId: string) {
    // Use forkJoin to fetch both styling info and real progress simultaneously
    forkJoin({
      uiDetails: this.gradeSubjectService.getSubjectsByGrade(gradeId),
      progressSummary: this.summaryService.getLearnerLessonSummary(learnerId).pipe(
        catchError((error) => {
          console.error('Summary API failed:', error);
          return of({ subjects: [] } as any); // Fallback to empty progress
        }),
      ),
    }).subscribe({
      next: (result) => {
        // Merge the two lists
        this.subjects = result.uiDetails.map((uiSubject) => {
          // Find the matching progress entry from the summary API
          const realProgress = result.progressSummary.subjects?.find(
            (s: any) => s.id === uiSubject.gradeSubjectId,
          );

          return {
            ...uiSubject,
            // Set the progress bar to the real backend value, default to 0
            progress: realProgress ? realProgress.percentageCompleted : 0,
          };
        });

        console.log('Dashboard fully loaded with real percentages:', this.subjects);
      },
      error: (err) => console.error('Critical loading error:', err),
    });
  }

  // loadDashboardData(learnerId: string, gradeId: string) {
  //   console.log('Fetching for Learner:', learnerId, 'and Grade:', gradeId);
  //   // We use forkJoin to wait for both the Subject List and the Progress Summary
  //   forkJoin({
  //     subjectDetails: this.gradeSubjectService.getSubjectsByGrade(gradeId),
  //     summary: this.summaryService.getLearnerLessonSummary(learnerId).pipe(
  //     catchError(error => {
  //       console.error('Summary API failed:', error);
  //       // Return a "fake" empty summary so the code keeps running
  //       return of({ learnerId, subjects: [], percentageCompleted: 0, streak: 0, lessonCount: 0, lessonCompletedCount: 0 });
  //     })
  //   )
  //   }).subscribe({
  //     next: (result) => {
  //       // 3. Get the list of subjects with UI styling
  //       let styledSubjects = result.subjectDetails;

  //       // 4. Map the real progress from the summary into the subjects
  //       this.subjects = styledSubjects.map(subject => {
  //         // Find the matching subject in the summary data
  //         const progressMatch = result.summary.subjects.find(s => s.id === subject.id);

  //         return {
  //           ...subject,
  //           // Replace the hardcoded/random progress with real data from Java
  //           progress: progressMatch ? progressMatch.percentageCompleted : 0
  //         };
  //       });

  //       console.log('Dashboard loaded with real progress:', this.subjects);
  //     },
  //     error: (err) => console.error('Error loading dashboard data', err)
  //   });
  // }

  // loadDashboard(gradeId: string) {
  //   this.fetchSubjectsForGrade(gradeId);
  // }

  // fetchSubjectsForGrade(gradeId: string) {
  //   this.gradeSubjectService.getSubjectsByGrade(gradeId).subscribe({
  //     next: (data) => {
  //       console.log('Grade Subjects received:', data);
  //       this.subjects = data;
  //     },
  //     error: (err) => console.error('Error loading grade subjects', err),
  //   });
  // }

  onSelectSubject(subject: GradeSubjectDetails) {
    // 1. Get the name for the URL slug (e.g., 'english')
    const name = subject.name;
    // 2. Get the ID (Currently 'subject-9d8d...' from Java)
    const gsId = subject.gradeSubjectId;
    console.log(`Navigating to ${name} with dynamic ID: ${gsId}`);
    this.router.navigate(['subject', name.toLowerCase(), gsId], { relativeTo: this.route });
  }

  onBackToSelectLearner() {
    this.router.navigate(['/parent/select-learner']);
  }
}
