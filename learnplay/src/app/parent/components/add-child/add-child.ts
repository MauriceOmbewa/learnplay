import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ParentApiService, LearnerDto, GradeDto, CourseDto } from '../../services/parent-api.service';
import { UserDataService } from '../../../services/user-data.service';
import { AuthService } from '../../../services/auth.service';
import { AvatarService, AvatarInfo } from '../../../services/avatar.service';
import { LoadingDotsComponent } from '../../../shared/components/loading-dots/loading-dots';

@Component({
  selector: 'app-add-child',
  imports: [CommonModule, FormsModule, MatSelectModule, MatFormFieldModule, MatDatepickerModule, MatInputModule, MatIconModule, MatNativeDateModule, MatDialogModule, LoadingDotsComponent],
  templateUrl: './add-child.html',
  styleUrl: './add-child.css',
})
export class AddChild implements OnInit {
  firstName = '';
  lastName = '';
  username = '';
  dateOfBirth = '';
  birthCertNumber = '';
  selectedCourseId = '';
  selectedGradeId = '';
  gender = 'MALE';
  selectedAvatar = '';
  isSubmitting = false;
  errorMessage = '';
  
  // Date constraints
  maxDate: Date;
  minDate: Date;
  
  courses: CourseDto[] = [];
  grades: GradeDto[] = [];
  allGradesMap: { [courseId: string]: GradeDto[] } = {};
  avatars: AvatarInfo[] = [];
  isAvatarModalOpen = false;
  isLoadingAvatars = false;
  avatarLoadError = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private parentApiService: ParentApiService,
    private userDataService: UserDataService,
    private authService: AuthService,
    private avatarService: AvatarService,
    private dialog: MatDialog
  ) {
    // Set date constraints
    const today = new Date();
    this.maxDate = new Date(today.getFullYear(), today.getMonth(), today.getDate()); // Today's date
    this.minDate = new Date(today.getFullYear() - 100, 0, 1); // 100 years ago
  }

  ngOnInit() {
    this.fetchCoursesAndGrades();
    this.loadAvatars(); // Initialize avatars based on default gender
  }

  fetchCoursesAndGrades() {
    this.parentApiService.fetchAllCourses().subscribe({
      next: (courses) => {
        this.courses = courses.filter(c => c.active !== false);
        localStorage.setItem('courses', JSON.stringify(courses));
        
        // Fetch grades for all courses
        const gradesMap: any = {};
        let completedRequests = 0;
        
        courses.forEach((course: any) => {
          this.parentApiService.fetchGradesByCourse(course.id).subscribe({
            next: (grades) => {
              gradesMap[course.id] = grades;
              this.allGradesMap[course.id] = grades;
              completedRequests++;
              
              if (completedRequests === courses.length) {
                localStorage.setItem('gradesMap', JSON.stringify(gradesMap));
              }
            },
            error: (error) => {
              console.error('Error fetching grades:', error);
              completedRequests++;
            }
          });
        });
      },
      error: (error) => {
        console.error('Error loading courses:', error);
        this.errorMessage = 'Failed to load courses';
      }
    });
  }

  onCourseChange() {
    // Reset grade selection when course changes
    this.selectedGradeId = '';
    
    // Load grades for selected course
    if (this.selectedCourseId && this.allGradesMap[this.selectedCourseId]) {
      this.grades = this.allGradesMap[this.selectedCourseId].filter(g => g.active !== false);
    } else {
      this.grades = [];
    }
  }

  selectAvatar(avatar: AvatarInfo) {
    this.selectedAvatar = avatar.filename;
    this.closeAvatarModal();
  }

  loadAvatars() {
    this.isLoadingAvatars = true;
    this.avatarLoadError = false;
    
    this.avatarService.getAvatarsByGender(this.gender as 'MALE' | 'FEMALE').subscribe({
      next: (avatars) => {
        this.avatars = avatars;
        this.isLoadingAvatars = false;
        if (avatars.length === 0) {
          this.avatarLoadError = true;
        }
      },
      error: (error) => {
        console.error('Error loading avatars:', error);
        this.avatars = [];
        this.isLoadingAvatars = false;
        this.avatarLoadError = true;
      }
    });
  }

  onGenderChange() {
    this.loadAvatars();
    // Reset selected avatar when gender changes
    this.selectedAvatar = '';
  }

  getAvatarPath(filename: string): string {
    return this.avatarService.getAvatarPath(filename, this.gender as 'MALE' | 'FEMALE');
  }

  openAvatarModal() {
    this.isAvatarModalOpen = true;
  }

  closeAvatarModal() {
    this.isAvatarModalOpen = false;
  }

  getSelectedAvatarPath(): string {
    if (!this.selectedAvatar) return '';
    return this.getAvatarPath(this.selectedAvatar);
  }

  onAvatarImageError(event: any) {
    console.warn('Failed to load avatar image:', event.target.src);
    // Hide broken image or show placeholder
    event.target.style.display = 'none';
  }

  trackByAvatarFilename(index: number, avatar: AvatarInfo): string {
    return avatar.filename;
  }

  onCreateProfile() {
    // Validation - only check required fields
    if (!this.firstName || !this.lastName || !this.dateOfBirth || 
        !this.selectedCourseId || !this.selectedGradeId || !this.selectedAvatar) {
      this.errorMessage = 'Please fill in all required fields and select an avatar';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const userId = this.userDataService.getUserId();
    if (!userId) {
      this.errorMessage = 'User not logged in';
      this.isSubmitting = false;
      this.router.navigate(['/sign-up/sign-in']);
      return;
    }

    const learnerData: LearnerDto = {
      firstName: this.firstName.trim(),
      lastName: this.lastName.trim(),
      preferredName: this.username.trim() || '', // Optional field
      birthCertificateNumber: this.birthCertNumber.trim() || '', // Optional field
      gender: this.gender,
      dob: this.dateOfBirth,
      gradeId: this.selectedGradeId,
      appUserId: userId,
      points: 0,
      avatar: this.selectedAvatar, // Send the filename to backend
      userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    this.parentApiService.registerLearner(learnerData).subscribe({
      next: (response) => {
        console.log('Learner created successfully:', response);
        
        // Refresh user data to get updated learners array
        this.authService.getUserDetails().subscribe({
          next: (updatedUserDetails) => {
            console.log('User details refreshed:', updatedUserDetails);
            // Navigate back to parent dashboard with state to trigger refresh
            this.router.navigate(['../'], { 
              relativeTo: this.route,
              state: { refresh: true }
            });
          },
          error: (error) => {
            console.error('Error refreshing user details:', error);
            // Still navigate back even if refresh fails
            this.router.navigate(['../'], { 
              relativeTo: this.route,
              state: { refresh: true }
            });
          }
        });
      },
      error: (error) => {
        console.error('Error creating learner:', error);
        if (error.error?.message) {
          this.errorMessage = error.error.message;
        } else if (error.status === 400) {
          this.errorMessage = 'Invalid data. Please check all fields.';
        } else {
          this.errorMessage = 'Failed to create child profile. Please try again.';
        }
        this.isSubmitting = false;
      }
    });
  }

  onBackToDashboard() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }
}