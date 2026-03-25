import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router, ActivatedRoute } from '@angular/router';
import { ProgressBar } from '../../reusable/progress-bar/progress-bar';
import { TopicService, TopicSummary } from '../../services/topic/topic';
import { Location } from '@angular/common';

interface Unit {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'locked';
  subtopicsTotal: number;
  subtopicsCompleted: number;
  pointsEarned?: number;
  decorationIcon: string; // Using emojis for demo purposes
}

// Define the shape of our subject data
interface SubjectInfo {
  name: string;
  icon: string;
  gradient: string; // The card background
  textColor: string; // The text color
  description: string;
}

@Component({
  selector: 'app-subject-lessons',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressBarModule,
    ProgressBar,
  ],
  templateUrl: './subject-lessons.html',
  styles: [
    `
      ::ng-deep .orange-progress .mdc-linear-progress__bar-inner {
        border-color: #f97316 !important;
      }
      ::ng-deep .orange-progress .mdc-linear-progress__buffer-bar {
        background-color: #e5e7eb !important;
      }
    `,
  ],
})
export class SubjectLessons implements OnInit {
  units: Unit[] = [];

  // units: Unit[] = [
  //   {
  //     id: 1,
  //     title: 'Unit 1: Addition Basics',
  //     description: 'Learn to add numbers together',
  //     status: 'completed',
  //     subtopicsTotal: 5,
  //     subtopicsCompleted: 5,
  //     pointsEarned: 100,
  //     decorationIcon: 'assets/icons/merry.png',
  //   },
  //   {
  //     id: 2,
  //     title: 'Unit 2: Subtraction Fun',
  //     description: 'Take numbers away',
  //     status: 'in-progress',
  //     subtopicsTotal: 5,
  //     subtopicsCompleted: 3,
  //     decorationIcon: 'assets/icons/rocket.png',
  //   },
  //   {
  //     id: 3,
  //     title: 'Unit 3: Multiplication Magic',
  //     description: 'Complete unit 2 to unlock',
  //     status: 'locked',
  //     subtopicsTotal: 5,
  //     subtopicsCompleted: 0,
  //     pointsEarned: 0,
  //     decorationIcon: '',
  //   },
  // ];

  // 2. Define the data for all subjects here
  subjectData: { [key: string]: SubjectInfo } = {
    math: {
      name: 'Math',
      icon: 'assets/icons/maths.png',
      gradient: 'linear-gradient(134.45deg,#F8C96C 15.3%,#FCA780 81.76%)',
      textColor: '#CA8A04',
      description: '5 Units • 65% Complete',
    },
    science: {
      name: 'Science',
      icon: 'assets/icons/microscope.png',
      gradient: 'linear-gradient(134.45deg,#67ECA3 15.3%,#43D785 81.76%)',
      textColor: '#16A34A',
      description: '8 Units • 40% Complete',
    },
    english: {
      name: 'English',
      icon: 'assets/icons/book.png',
      gradient: 'linear-gradient(134.45deg,#B1EAE9 15.3%,#F2D9E4 81.76%)',
      textColor: '#2563EB',
      description: '10 Units • 80% Complete',
    },
    art: {
      name: 'Art',
      icon: 'assets/icons/art.png',
      gradient: 'linear-gradient(134.45deg,#D6C3FC 15.3%,#9CC4FC 81.76%)',
      textColor: '#9333EA',
      description: '4 Units • 25% Complete',
    },
  };

  // Default active subject (fallback)
  currentSubject: SubjectInfo = this.subjectData['math'];

  //Inject Router
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private topicService: TopicService,
    private location: Location,
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const subjectSlug = params.get('subjectId');
      const gradeSubjectId = params.get('gsId');

      // Use the subject name from URL directly
      if (subjectSlug) {
        const style = this.subjectData[subjectSlug.toLowerCase()];
        if (style) {
          this.currentSubject = { ...style };
        }
        // this.currentSubject = {
        //   name: subjectSlug.charAt(0).toUpperCase() + subjectSlug.slice(1),
        //   icon: 'assets/icons/maths.png',
        //   gradient: 'linear-gradient(134.45deg,#F8C96C 15.3%,#FCA780 81.76%)',
        //   textColor: '#CA8A04',
        //   description: ''
        // };
      }

      if (gradeSubjectId) {
        console.log('Fetching topics for GradeSubject UUID:', gradeSubjectId);
        this.loadTopics(gradeSubjectId);
      } else {
        console.warn('No GradeSubject ID found in the URL!');
      }
    });
  }

  loadTopics(gradeSubjectId: string) {
    this.topicService.getTopicsByGradeSubject(gradeSubjectId).subscribe({
      next: (data: TopicSummary[]) => {
        console.log('Topics received from Java:', data);

        // Update description with actual topic count
        this.currentSubject.description = `${data.length} Units`;

        this.units = data.map((topic, index) => ({
          id: topic.id,
          title: topic.name,
          description: topic.description,
          status: index === 0 ? 'in-progress' : 'locked',
          subtopicsTotal: topic.subTopicCount,
          subtopicsCompleted: 0,
          decorationIcon: index === 0 ? 'assets/icons/rocket.png' : '',
        }));
      },
      error: (err) => console.error('Error fetching topics', err),
    });
  }

  calculateProgress(completed: number, total: number): number {
    return (completed / total) * 100;
  }

  // Use relative navigation to go back up to the main dashboard
  goBack() {
    this.location.back();
  }

  onSelectUnit(unit: Unit, index: number) {
    // Use the real UUID from the backend instead of formatting the title
    const topicId = unit.id;

    console.log('Navigating to dynamic Topic ID:', topicId);

    if (!topicId) {
      console.error('Error: This unit card has no ID!');
      return;
    }

    // Navigate to e.g., /kid/subject/math/unit/subtopic-uuid-123
    this.router.navigate(['../unit', topicId], {
      relativeTo: this.route,
      state: {
        subjectName: this.currentSubject.name,
        unitNumber: index + 1,
        topicTitle: unit.title,
      },
    });
  }
}
