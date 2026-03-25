import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Router, ActivatedRoute } from '@angular/router';
import { RouterModule } from '@angular/router';
import { TeacherService } from '../../services/teacher.service';
import { HttpClientModule } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { localGet, localSet } from '../../../shared/components/utils/local-storage.util';

interface GradeLevel {
  id: string;
  name: string;
  description: string;
}

@Component({
  selector: 'app-manage-grades',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    HttpClientModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule
  ],
  templateUrl: './manage-grades.html',
  styleUrl: './manage-grades.css',
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({
        height: '0px',
        opacity: 0,
        overflow: 'hidden',
        marginTop: '0px',
        marginBottom: '0px'
      })),
      state('expanded', style({
        height: '*',
        opacity: 1,
        marginTop: '20px',
        marginBottom: '20px'
      })),
      transition('collapsed <=> expanded', [
        animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ])
    ])
  ]
})
export class ManageGradesComponent implements OnInit {
  isFormOpen = false;
  gradeForm: FormGroup;
  courses: any[] = [];
  selectedCourseId: string = '';
  gradeId!: string;
  grades: GradeLevel[] = [];
  editingGradeId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private teacherService: TeacherService
  ) {
    this.gradeForm = this.fb.group({
      name: ['', Validators.required],
      description: ['']
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      // ✅ Use localGet
      this.selectedCourseId = params['courseId'] || localGet('selectedCourseId') || '';
      if (this.selectedCourseId) {
        this.loadGrades(this.selectedCourseId);
      }
    });
  }

  toggleForm() {
    this.isFormOpen = !this.isFormOpen;
    if (!this.isFormOpen) {
      this.editingGradeId = null;
      this.gradeForm.reset();
    }
  }

  saveGrade() {
    if (this.gradeForm.valid && this.selectedCourseId) {
      const gradeData = {
        name: this.gradeForm.value.name,
        description: this.gradeForm.value.description || 'No description',
        active: true,
        courseId: this.selectedCourseId
      };

      if (this.editingGradeId) {
        console.log('PUT payload:', gradeData, 'ID:', this.editingGradeId);
        this.teacherService.updateGrade(this.editingGradeId, gradeData).subscribe({
          next: () => {
            const index = this.grades.findIndex(g => g.id === this.editingGradeId);
            if (index !== -1) {
              this.grades[index] = {
                ...this.grades[index],
                name: gradeData.name,
                description: gradeData.description
              };
              this.grades = [...this.grades];
            }
            this.editingGradeId = null;
            this.isFormOpen = false;
            this.gradeForm.reset();
          },
          error: (err: unknown) => console.error('Error updating grade:', err)
        });
      } else {
        this.teacherService.createGrade(gradeData).subscribe({
          next: (response) => {
            const generatedId = response.generatedId || response.id;
            // ✅ Use localSet
            if (generatedId) localSet('selectedGradeId', generatedId);
            const newGrade: GradeLevel = {
              id: generatedId || Date.now().toString(),
              name: gradeData.name,
              description: gradeData.description
            };
            this.grades = [newGrade, ...this.grades];
            this.isFormOpen = false;
            this.gradeForm.reset();
          },
          error: (err: unknown) => console.error('Error creating grade:', err)
        });
      }
    }
  }

  loadGrades(courseId: string) {
    if (!courseId) return;
    this.teacherService.getGradesByCourse(courseId).subscribe({
      next: (grades) => {
        this.grades = (grades || []).map(g => ({
          id: g.id || g.gradeId,
          name: g.name || g.gradeName,
          description: g.description || 'Primary foundation level'
        }));
        console.log('Loaded grades:', this.grades);
      },
      error: (err: unknown) => console.error('Error loading grades:', err)
    });
  }

  cancel() {
    this.isFormOpen = false;
    this.editingGradeId = null;
    this.gradeForm.reset();
  }

  editGrade(grade: GradeLevel) {
    this.editingGradeId = grade.id;
    this.gradeForm.patchValue({
      name: grade.name,
      description: grade.description
    });
    this.isFormOpen = true;
    // ✅ Use localSet
    localSet('selectedGradeId', grade.id);
  }

  selectGrade(grade: GradeLevel) {
    // ✅ Use localSet
    localSet('selectedGradeId', grade.id);
    this.router.navigate(['/courses/content', grade.id]);
  }

  deleteGrade(grade: GradeLevel) {
    this.teacherService.deleteGrade(grade.id).subscribe({
      next: () => {
        this.grades = this.grades.filter(g => g.id !== grade.id);
      },
      error: (err: unknown) => console.error('Error deleting grade:', err)
    });
  }

  nextStep() {
    this.router.navigate(['/courses/subjects', this.selectedCourseId]);
  }

  goBackToDashboard() {
    // ✅ Use localGet
    const courseId = localGet('selectedCourseId');
    if (courseId) {
      this.router.navigate(['/courses/dashboard', courseId]);
    } else {
      this.router.navigate(['/courses/dashboard']);
    }
  }
}