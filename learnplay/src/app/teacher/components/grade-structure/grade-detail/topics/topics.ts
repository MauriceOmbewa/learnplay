import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TeacherService } from '../../../../services/teacher.service';
import { HttpClientModule } from '@angular/common/http';
import { localGet, localSet } from '../../../../../shared/components/utils/local-storage.util';

interface Topic {
  id: string;
  name: string;
  description: string;
  subtopicsCount: number;
  quizzesCount: number;
  orderIndex?: number;
}

@Component({
  selector: 'app-topics',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './topics.html'
})
export class TopicsComponent implements OnInit {
  private router = inject(Router);
  private teacherService = inject(TeacherService);
  private route = inject(ActivatedRoute);

  isFormVisible = false;
  editingTopic: Topic | null = null;
  subjectName = 'Subject';
  subjectDescription = '';
  gradeSubjectId = '';
  topics: Topic[] = [];

  newTopic = { name: '', description: '', orderIndex: 1 };
  orderNumbers = Array.from({length: 100}, (_, i) => i + 1);

  ngOnInit() {
    this.route.params.subscribe(params => {
      const fromRoute = params['gradeSubjectId'];
      const fromStorage = localGet('selectedGradeSubjectId');
      const candidateId = fromRoute || fromStorage || '';

      if (candidateId) {
        this.gradeSubjectId = candidateId;
        localSet('selectedGradeSubjectId', candidateId);
        this.loadSubjectDetails();
        this.loadTopics();
      }
    });
  }

  loadSubjectDetails() {
    this.subjectName = localGet('selectedSubjectName') || 'Subject';
  }

  loadTopics() {
    this.teacherService.getTopicsByGradeSubject(this.gradeSubjectId).subscribe({
      next: (topics: any[]) => {
        this.topics = topics.map(t => ({
          id: t.id || t.topicId,
          name: t.name,
          description: t.description || 'No description',
          subtopicsCount: 0,
          quizzesCount: t.quizzesCount || 0,
          orderIndex: t.orderIndex || 0
        }));
        this.topics.forEach((topic, index) => {
          this.teacherService.getSubTopicsByTopic(topic.id).subscribe({
            next: (subtopics: any[]) => { this.topics[index].subtopicsCount = subtopics.length; },
            error: () => { this.topics[index].subtopicsCount = 0; }
          });
        });
      },
      error: (err: unknown) => console.error('Error loading topics:', err)
    });
  }

  toggleForm() {
    this.isFormVisible = !this.isFormVisible;
    if (!this.isFormVisible) this.resetForm();
  }

  resetForm() {
    this.newTopic = { name: '', description: '', orderIndex: 1 };
    this.editingTopic = null;
  }

  saveTopic() {
    if (!this.newTopic.name) return;

    if (this.editingTopic) {
      const updatePayload = {
        name: this.newTopic.name,
        description: this.newTopic.description || 'No description provided',
        active: true,
        gradeSubjectId: this.gradeSubjectId,
        orderIndex: Number(this.newTopic.orderIndex)
      };

      this.teacherService.updateTopic(this.editingTopic.id, updatePayload).subscribe({
        next: () => {
          const index = this.topics.findIndex(t => t.id === this.editingTopic!.id);
          if (index !== -1) {
            this.topics[index] = { ...this.topics[index], ...updatePayload };
            this.topics = [...this.topics];
          }
          this.isFormVisible = false;
          this.resetForm();
        },
        error: (err: unknown) => {
          console.error('Error updating topic:', err);
          alert('Error updating topic. Please try again.');
        }
      });

    } else {
      const actualGradeSubjectId = this.gradeSubjectId || localGet('selectedGradeSubjectId');

      if (!actualGradeSubjectId || !actualGradeSubjectId.startsWith('gradesubject-')) {
        alert('Error: Invalid grade-subject ID. Please go back and select a subject again.');
        return;
      }

      const topicPayload = {
        name: this.newTopic.name,
        description: this.newTopic.description || 'No description provided',
        active: true,
        gradeSubjectId: actualGradeSubjectId,
        orderIndex: Number(this.newTopic.orderIndex)
      };

      this.teacherService.createTopic(topicPayload).subscribe({
        next: (topicResponse: any) => {
          const topicId = topicResponse.generatedId || topicResponse.id;
          localSet('selectedTopicId', topicId);

          const newTopic: Topic = {
            id: topicId,
            name: topicPayload.name,
            description: topicPayload.description,
            subtopicsCount: 0,
            quizzesCount: 0,
            orderIndex: topicPayload.orderIndex
          };
          this.topics = [newTopic, ...this.topics];
          this.isFormVisible = false;
          this.resetForm();
        },
        error: (err: unknown) => console.error('Error creating topic:', err)
      });
    }
  }

  editTopic(topic: Topic) {
    this.editingTopic = topic;
    this.newTopic = { name: topic.name, description: topic.description, orderIndex: topic.orderIndex || 1 };
    this.isFormVisible = true;
  }

  deleteTopic(id: string) {
    if (confirm('Are you sure you want to delete this topic?')) {
      this.teacherService.deleteTopic(id).subscribe({
        next: () => { this.topics = this.topics.filter(t => t.id !== id); },
        error: (err: unknown) => {
          console.error('Error deleting topic:', err);
          alert('Error deleting topic. Please try again.');
        }
      });
    }
  }

  navigateToSubtopic(topic: Topic) {
    localSet('selectedTopicId', topic.id);
    localSet('selectedTopicName', topic.name);
    this.router.navigate(['/courses/subtopics', this.gradeSubjectId, topic.id]);
  }

  goBackToGrade1() {
    const gradeId = localGet('selectedGradeId') || '';
    this.router.navigate(['/courses/grade', gradeId]);
  }
}
