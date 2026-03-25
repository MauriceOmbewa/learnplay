import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TeacherService } from '../../services/teacher.service';

// --- Types ---
export interface Subject {
  id: string;
  name: string;
  icon: string;
  description: string;
  colour: string;
}

export interface SubjectFormData {
  name: string;
  icon: string;
  description: string;
  colour: string;
}

// --- Constants ---
export const INITIAL_SUBJECTS: Subject[] = [];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-subject.html'
})
export class ManageSubject implements OnInit {
  // State
  subjects: Subject[] = [];
  isFormVisible = false;
  courses: any[] = [];
  selectedCourseId: string = '';
  selectedSubjectId: string = '';
  courseId: string = '';
  
  formData: SubjectFormData = {
    name: '',
    icon: '',
    description: '',
    colour: ''
  };

  isIconPickerOpen = false;
  isColourPickerOpen = false;

  subjectColours = [
    '#EF4444','#F97316','#F59E0B','#EAB308','#84CC16','#22C55E','#10B981',
    '#14B8A6','#06B6D4','#3B82F6','#6366F1','#8B5CF6','#A855F7','#EC4899',
    '#F43F5E','#64748B','#6B7280','#374151','#1E293B','#0F172A',
    '#FCA5A5','#FCD34D','#6EE7B7','#93C5FD','#C4B5FD','#F9A8D4',
    '#DCFCE7','#DBEAFE','#EDE9FE','#FEF9C3'
  ];

  assetIcons = [
    'art.png','avatar.png','book.png','books.png','bulb.png','bullpoint.png',
    'calendar.png','clock.png','complete.png','credit-card.png','cup.png',
    'english.png','family.png','files.png','fire.png','Gradecap.png',
    'graduand.png','hat.png','image 10.png','image 11.png','image 12.png',
    'image 19.png','image 23.png','image 27.png','image 28.png','image 30.png',
    'image 31.png','image 32.png','image 34.png','image 35.png','image 38.png',
    'image 9.png','indicator.png','biology.png','christian religous education.webp',
    'geography.png','german.png','history and Government.png','home-science.jpg','islam.png',
    'journalism.png','kiswahili.png','mathematics.png','music.png',
    'spanish.png','Lg.png','lock.png','male.png','maths.png',
    'microscope.png','notebook.png','notepad.png','pen.png','phone.png',
    'rocket.png','science.png','smile.png','star.png','start.png','subject.png',
    'Subject1.png','teacher.png','tick.png','trophy.png','video.png'
  ];

  getIconPath(icon: string): string {
    return `assets/icons/${icon}`;
  }

  openIconPicker() { this.isIconPickerOpen = true; }
  closeIconPicker() { this.isIconPickerOpen = false; }
  openColourPicker() { this.isColourPickerOpen = true; }
  closeColourPicker() { this.isColourPickerOpen = false; }
  selectColour(colour: string) { this.formData.colour = colour; this.closeColourPicker(); }

  selectIcon(path: string) {
    // Store only the filename so backend saves e.g. 'math.png' not the full path
    this.formData.icon = path.split('/').pop() || path;
    this.closeIconPicker();
  }

  constructor(private teacherService: TeacherService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.courseId = params['courseId'] || (typeof localStorage !== 'undefined' ? localStorage.getItem('selectedCourseId') : null) || '';
      this.selectedCourseId = this.courseId;
      
      // Initialize selectedSubjectId from localStorage
      this.selectedSubjectId = (typeof localStorage !== 'undefined' ? localStorage.getItem('selectedSubjectId') : null) || '';
    });
    this.loadCourses();
  }

  toggleForm() {
    this.isFormVisible = !this.isFormVisible;
    if (!this.isFormVisible) {
      this.resetForm();
    }
  }

  resetForm() {
    this.formData = { name: '', icon: '', description: '', colour: '' };
  }

  onSubmit() {
    if (this.formData.name && this.selectedCourseId) {
      const subjectData = {
        name: this.formData.name,
        description: this.formData.description || 'No description',
        active: true,
        courseId: this.selectedCourseId,
        iconName: this.formData.icon,
        colour: this.formData.colour
      };

      const savedColour = this.formData.colour;
      const isEditing = !!this.selectedSubjectId && this.subjects.some(s => s.id === this.selectedSubjectId);

      if (isEditing) {
        // Update colour in the subjects array immediately
        const idx = this.subjects.findIndex(s => s.id === this.selectedSubjectId);
        if (idx !== -1) this.subjects[idx].colour = savedColour;
        this.saveColourToStorage(this.selectedSubjectId, savedColour);
        this.isFormVisible = false;
        this.resetForm();
        return;
      }

      this.teacherService.createSubject(subjectData).subscribe({
        next: (response) => {
          const subjectId = response.id;
          console.log('Subject created with ID:', String(subjectId).replace(/[\r\n]/g, ''));

          this.selectedSubjectId = subjectId;
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('selectedSubjectId', subjectId);
          }

          this.saveColourToStorage(subjectId, savedColour);
          this.isFormVisible = false;
          this.resetForm();
          this.loadSubjects();
        },
        error: (error) => {
          console.error('Error creating subject:', error);
        }
      });
    }
  }

  loadCourses() {
    this.teacherService.getCourses().subscribe({
      next: (courses) => {
        this.courses = courses;
        if (courses.length > 0 && !this.selectedCourseId) {
          this.selectedCourseId = courses[0].id;
          this.courseId = this.selectedCourseId;
        }
        this.loadSubjects();
      },
      error: (error) => {
        console.error('Error loading courses:', error);
      }
    });
  }

  loadSubjects() {
    if (!this.selectedCourseId) {
      return;
    }
    
    this.teacherService.getSubjectsByCourse(this.selectedCourseId).subscribe({
      next: (subjects) => {
        const storedColours = this.getColoursFromStorage();
        const iconMap: Record<string, string> = {};
        this.subjects = subjects.map(subject => {
          const icon = subject.iconName || '';
          if (icon) iconMap[subject.id] = icon;
          // Prefer API colour, fallback to localStorage
          return {
            id: subject.id,
            name: subject.name,
            icon: icon ? `assets/icons/${icon}` : '',
            description: subject.description || 'No description',
            colour: subject.colour || storedColours[subject.id] || ''
          };
        });
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('subjectIcons', JSON.stringify(iconMap));
        }
      },
      error: (error) => {
        console.error('Error loading subjects:', error);
        this.subjects = [];
      }
    });
  }

  handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this subject?')) {
      this.subjects = this.subjects.filter(s => s.id !== id);
    }
  }

  handleEdit(id: string) {
    const subject = this.subjects.find(s => s.id === id);
    if (!subject) return;
    this.selectedSubjectId = id;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('selectedSubjectId', id);
    }
    this.formData = {
      name: subject.name,
      icon: subject.icon.replace('assets/icons/', ''),
      description: subject.description,
      colour: subject.colour || ''
    };
    this.isFormVisible = true;
  }

  private saveColourToStorage(subjectId: string, colour: string) {
    if (typeof localStorage === 'undefined') return;
    const colours = JSON.parse(localStorage.getItem('subjectColours') || '{}');
    colours[subjectId] = colour;
    localStorage.setItem('subjectColours', JSON.stringify(colours));
  }

  private getColoursFromStorage(): Record<string, string> {
    if (typeof localStorage === 'undefined') return {};
    return JSON.parse(localStorage.getItem('subjectColours') || '{}');
  }

  goBackToDashboard() {
    this.router.navigate(['/courses/dashboard', this.courseId]);
  }

  goToGradeDetail() {
    const gradeId = typeof localStorage !== 'undefined' ? localStorage.getItem('selectedGradeId') : null;
    if (gradeId) {
      this.router.navigate(['/courses/grade', gradeId]);
    } else {
      this.router.navigate(['/courses/grades', this.courseId]);
    }
  }
}