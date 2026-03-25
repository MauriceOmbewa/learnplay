import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { TeacherService } from '../../services/teacher.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { NotificationService } from '../../../services/notification.service';
import { NotificationComponent } from '../../../shared/components/notification/notification.component';
import { EditorModule } from '@tinymce/tinymce-angular';
import { localGet } from '../../../shared/components/utils/local-storage.util';

@Component({
  selector: 'app-manage-lessons-notes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    EditorModule,
    NotificationComponent
  ],
  templateUrl: './manage-lessons-notes.html',
  styleUrl: './manage-lessons-notes.css',
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({ height: '0', overflow: 'hidden', opacity: '0' })),
      state('expanded', style({ height: '*', overflow: 'visible', opacity: '1' })),
      transition('collapsed <=> expanded', animate('300ms ease-in-out'))
    ])
  ]
})
export class ManageLessonsNotes implements OnInit {
  isFormOpen = false;
  subtopicId = '';
  subtopicName = 'Subtopic';
  topicId = '';
  gradeSubjectId = '';

  lessonName = '';
  videoUrl = '';
  duration: number | null = null;
  trailer = false;
  orderIndex = 1;
  editingLessonId: string | null = null;

  // ✅ Simplified notes — no type field needed
  notes: { content: string }[] = [];

  tinyMceConfig = {
    height: 300,
    menubar: false,
    plugins: [
      'anchor', 'autolink', 'charmap', 'codesample',
      'emoticons', 'image', 'link', 'lists', 'media',
      'searchreplace', 'table', 'visualblocks', 'wordcount'
    ],
    toolbar:
      'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | ' +
      'link image media table | align lineheight | numlist bullist indent outdent | ' +
      'emoticons charmap | removeformat'
  };

  existingLessons: any[] = [];

  // ✅ Mark Complete state
  selectedLesson: any = null;
  isMarkingComplete = false;
  showCompleteModal = false;
  completedScore: number = 0;
  learnerId: string = '';

  private teacherService = inject(TeacherService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  constructor() {
    this.addNote();
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.subtopicId = params['subTopicId'];
      this.topicId = params['topicId'] || localGet('selectedTopicId') || '';
      this.gradeSubjectId = params['gradeSubjectId'] || localGet('selectedGradeSubjectId') || '';
      console.log('Subtopic ID from route params:', this.subtopicId);
      if (this.subtopicId) {
        this.loadSubtopicName();
        this.loadLessons();
        this.loadLearnerId();
      }
    });
  }

  loadLearnerId() {
    const userDetails = localGet('userDetails');
    if (userDetails) {
      try {
        const user = JSON.parse(userDetails);
        this.learnerId = user.id || '';
        console.log('Learner ID loaded:', this.learnerId);
      } catch {
        this.learnerId = '';
      }
    }
    if (!this.learnerId) {
      this.teacherService.http.get<any>(`${environment.apiUrl}/user/me`).subscribe({
        next: (user) => {
          this.learnerId = user.id || '';
          console.log('Learner ID from API:', this.learnerId);
        },
        error: (err: unknown) => console.error('Error loading learner ID:', err)
      });
    }
  }

  goBack() {
    if (this.topicId && this.gradeSubjectId) {
      this.router.navigate(['/courses/subtopics', this.gradeSubjectId, this.topicId]);
    } else {
      window.history.back();
    }
  }

  toggleForm() {
    this.isFormOpen = !this.isFormOpen;
  }

  addNote() {
    this.notes.push({ content: '' });
  }

  removeNote(index: number) {
    this.notes.splice(index, 1);
  }

  saveLesson() {
    if (!this.lessonName || !this.duration) {
      this.notificationService.showWarning('Please fill in all required fields.');
      return;
    }
    if (!this.subtopicId) {
      this.notificationService.showError('No subtopic ID found. Please navigate from a subtopic page.');
      return;
    }

    const lessonData = {
      name: this.lessonName,
      content: this.notes.map(n => n.content).join('\n'),
      videoUrl: this.videoUrl || null,
      active: true,
      subTopicId: this.subtopicId,
      orderIndex: this.orderIndex,
      duration: this.duration * 60,
      trailer: this.trailer
    };

    if (this.editingLessonId) {
      this.teacherService.http.put(`${environment.apiUrl}/lesson/${this.editingLessonId}`, lessonData).subscribe({
        next: () => {
          this.notificationService.showSuccess('Lesson updated successfully!');
          this.loadLessons();
          this.resetForm();
        },
        error: (err: unknown) => {
          console.error('Error updating lesson:', err);
          this.notificationService.showError('Error updating lesson. Please try again.');
        }
      });
    } else {
      this.teacherService.http.post(`${environment.apiUrl}/lesson`, lessonData).subscribe({
        next: () => {
          this.notificationService.showSuccess('Lesson created successfully!');
          this.loadLessons();
          this.resetForm();
        },
        error: (err: unknown) => {
          console.error('Error creating lesson:', err);
          this.notificationService.showError('Error creating lesson. Please try again.');
        }
      });
    }
  }

  resetForm() {
    this.isFormOpen = false;
    this.editingLessonId = null;
    this.lessonName = '';
    this.videoUrl = '';
    this.duration = null;
    this.trailer = false;
    this.orderIndex = 1;
    this.notes = [{ content: '' }];
  }

  cancel() {
    this.resetForm();
  }

  onTrailerChange(event: Event) {
    this.trailer = (event.target as HTMLInputElement).checked;
  }

  editLesson(lesson: any) {
    this.editingLessonId = lesson.id;
    this.lessonName = lesson.name;
    this.videoUrl = lesson.videoUrl || '';
    this.duration = parseInt(lesson.duration) || null;
    this.trailer = lesson.trailer || false;
    this.orderIndex = lesson.orderIndex || 1;
    this.notes = lesson.notes?.length
      ? lesson.notes.map((n: any) => ({ content: n.text || n.content || '' }))
      : [{ content: '' }];
    this.isFormOpen = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteLesson(lesson: any) {
    if (!confirm(`Delete "${lesson.name}"?`)) return;
    this.teacherService.http.delete(`${environment.apiUrl}/lesson/${lesson.id}`).subscribe({
      next: () => {
        this.existingLessons = this.existingLessons.filter(l => l.id !== lesson.id);
        this.notificationService.showSuccess('Lesson deleted successfully.');
      },
      error: (err: unknown) => {
        console.error('Error deleting lesson:', err);
        this.notificationService.showError('Error deleting lesson. Please try again.');
      }
    });
  }

  loadLessons() {
    this.teacherService.http.get<any[]>(`${environment.apiUrl}/lesson/fetch/bySubTopicId/${this.subtopicId}`).subscribe({
      next: (lessons) => {
        console.log('Lessons from API:', lessons);
        this.existingLessons = lessons.map(lesson => {
          const contentLines = lesson.content
            ? lesson.content.split('\n').filter((line: string) => line.trim())
            : [];
          return {
            id: lesson.id,
            name: lesson.name,
            duration: `${Math.floor((lesson.duration || 0) / 60)} minutes`,
            notesCount: contentLines.length,
            videoUrl: lesson.videoUrl,
            trailer: lesson.trailer,
            notes: contentLines.map((line: string) => ({ text: line.trim() }))
          };
        });
      },
      error: (err: unknown) => console.error('Error loading lessons:', err)
    });
  }

  loadSubtopicName() {
    this.teacherService.http.get<any>(`${environment.apiUrl}/sub-topic/byId/${this.subtopicId}`).subscribe({
      next: (subtopic) => {
        this.subtopicName = subtopic.name || 'Subtopic';
      },
      error: (err: unknown) => {
        console.error('Error loading subtopic name:', err);
        this.subtopicName = 'Subtopic';
      }
    });
  }

  // ✅ Open lesson detail panel
  openLesson(lesson: any) {
    console.log('Opening lesson:', lesson);
    this.selectedLesson = { ...lesson }; // spread to ensure new reference
    this.showCompleteModal = false;
    this.completedScore = 0;
  }

  closeLesson() {
    this.selectedLesson = null;
    this.showCompleteModal = false;
    this.completedScore = 0;
  }

  
 
}