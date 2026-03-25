import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router, ActivatedRoute } from '@angular/router';
import { CustomVideoPlayerComponent } from '../../../shared/components/custom-video-player/custom-video-player.component';
import { LessonService, LessonSummary } from '../../services/lesson/lesson';
import { Location } from '@angular/common';
import confetti from 'canvas-confetti';
import {
  MarkCompletedService,
  LessonTrackerDto,
} from '../../services/mark-completed/mark-completed';

interface Note {
  icon?: string;
  image?: string;
  title: string;
  content?: string;
  htmlContent?: string;
  // Tailwind specific styling classes
  styles: {
    bg: string;
    border: string;
    iconColor: string;
  };
}

@Component({
  selector: 'app-unit-content',
  imports: [CommonModule, MatIconModule, MatButtonModule, CustomVideoPlayerComponent],
  templateUrl: './unit-content.html',
  styleUrl: './unit-content.css',
})
export class UnitContent implements OnInit {
  currentLessonId: string = ''; // To store the real database ID
  learnerId: string = '';

  // Data Holder
  contentData = {
    title: 'Loading...',
    unitName: '',
    videoTitle: '',
    videoId: '',
    duration: 0,
    notes: [] as any[],
  };

  // DATABASE: Mock Content
  // lessonDatabase: { [key: string]: any } = {
  //   'word-problems': {
  //     title: 'Subtraction Word Problems',
  //     unitName: 'Unit 2: Subtraction Fun',
  //     videoTitle: 'Cocomelon - Nursery Rhymes',
  //     videoId: 'M7lc1UVf-VE',
  //     notes: [
  //       {
  //         image: 'assets/icons/bulb.png',
  //         title: 'Key Concept',
  //         content:
  //           'Word problems help us use subtraction in real life! Read the problem carefully to find what numbers to subtract.',
  //         styles: { bg: 'bg-[#F1E2FB]', border: 'border-[#C999F5]', iconColor: 'text-[#9333EA]' },
  //       },
  //       {
  //         image: 'assets/icons/notebook.png',
  //         title: 'Steps to solve',
  //         htmlContent:
  //           '<ol class="list-decimal pl-5 space-y-1"><li>Read the problem twice</li><li>Find the starting number</li><li>Find how many to take away</li><li>Write the subtraction equation</li><li>Solve and check your answer</li></ol>',
  //         styles: { bg: 'bg-[#EFF6FF]', border: 'border-[#BFDBFE]', iconColor: 'text-[#137CFF]' },
  //       },
  //       {
  //         image: 'assets/icons/pen.png',
  //         title: 'Example',
  //         htmlContent:
  //           '<strong>Problem:</strong> Maria has 15 apples. She gives 6 to her friend. How many apples does she have left?<br><div class="mt-2 font-bold text-green-700">Solution: 15 - 6 = 9 apples</div>',
  //         styles: { bg: 'bg-[#DCF9EA]', border: 'border-[#4ADE80]', iconColor: 'text-[#1DBC57]' },
  //       },
  //       {
  //         image: 'assets/icons/indicator.png',
  //         title: 'Remember',
  //         content:
  //           'Look for keywords like "left", "remaining", "how many more", or "difference" - these often mean subtraction!',
  //         styles: { bg: 'bg-[#FEFCE8]', border: 'border-[#FEF08A]', iconColor: 'text-[#AA9600]' },
  //       },
  //       {
  //         image: 'assets/icons/bullpoint.png',
  //         title: 'Practice Tip',
  //         content: 'Draw pictures to help you visualize the problem. It makes solving much easier!',
  //         styles: { bg: 'bg-[#FFF0EF]', border: 'border-[#E37974]', iconColor: 'text-[#CF4842]' },
  //       },
  //     ],
  //   },
  //   'small-numbers': {
  //     title: 'Subtracting Small Numbers',
  //     unitName: 'Unit 2: Subtraction Fun',
  //     videoTitle: 'Cocomelon - Nursery Rhymes',
  //     videoId: 'M7lc1UVf-VE',
  //     notes: [
  //       {
  //         image: 'assets/icons/pen.png',
  //         title: 'Quick Tip',
  //         content: 'Use your fingers to count backwards!',
  //         styles: { bg: 'bg-[#EFF6FF]', border: 'border-[#BFDBFE]', iconColor: 'text-[#137CFF]' },
  //       },
  //     ],
  //   },
  // };

  isLessonComplete = false;
  isVideoPlaying = false;
  isRevisionMode = false; // If the lesson was already finished before opening the page
  showSuccessModal = false; // Controls the popup visibility
  isSubmitting = false; // Prevents double-clicking the button

  notes: Note[] = [
    {
      image: 'assets/icons/bulb.png',
      title: 'Key Concept',
      content:
        'Word problems help us use subtraction in real life! Read the problem carefully to find what numbers to subtract.',
      styles: { bg: 'bg-[#F1E2FB]', border: 'border-[#C999F5]', iconColor: 'text-[#9333EA]' },
    },
    {
      image: 'assets/icons/notebook.png',
      title: 'Steps to solve',
      // Added tailwind classes to the HTML string for the list
      htmlContent:
        '<ol class="list-decimal pl-5 space-y-1"><li>Read the problem twice</li><li>Find the starting number</li><li>Find how many to take away</li><li>Write the subtraction equation</li><li>Solve and check your answer</li></ol>',
      styles: { bg: 'bg-[#EFF6FF]', border: 'border-[#BFDBFE]', iconColor: 'text-[#137CFF]' },
    },
    {
      image: 'assets/icons/pen.png',
      title: 'Example',
      htmlContent:
        '<strong>Problem:</strong> Maria has 15 apples. She gives 6 to her friend. How many apples does she have left?<br><div class="mt-2 font-bold text-green-700">Solution: 15 - 6 = 9 apples</div>',
      styles: { bg: 'bg-[#DCF9EA]', border: 'border-[#4ADE80]', iconColor: 'text-[#1DBC57]' },
    },
    {
      image: 'assets/icons/indicator.png',
      title: 'Remember',
      content:
        'Look for keywords like "left", "remaining", "how many more", or "difference" - these often mean subtraction!',
      styles: { bg: 'bg-[#FEFCE8]', border: 'border-[#FEF08A]', iconColor: 'text-[#AA9600]' },
    },
    {
      image: 'assets/icons/bullpoint.png',
      title: 'Practice Tip',
      content: 'Draw pictures to help you visualize the problem. It makes solving much easier!',
      styles: { bg: 'bg-[#FFF0EF]', border: 'border-[#E37974]', iconColor: 'text-[#CF4842]' },
    },
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private lessonService: LessonService,
    private location: Location,
    private markCompletedService: MarkCompletedService,
  ) {}

  ngOnInit() {
    // 1. Get Learner ID from storage (saved during learner selection)
    const learnerData = localStorage.getItem('selectedLearner');
    if (learnerData) {
      this.learnerId = JSON.parse(learnerData).id;
    }

    this.route.paramMap.subscribe((params) => {
      const subTopicId = params.get('lessonId'); // In your routes, this is the ID passed from LessonUnit
      if (subTopicId) {
        this.loadLessonData(subTopicId);
      }
    });
  }

  loadLessonData(subTopicId: string) {
    this.lessonService.getLessonsBySubTopicId(subTopicId).subscribe({
      next: (lessons: LessonSummary[]) => {
        if (lessons.length > 0) {
          const firstLesson = lessons[0]; // Display the first lesson in the sub-topic
          this.currentLessonId = firstLesson.id;

          this.isRevisionMode = false; // Set this based on backend data if available

          this.contentData = {
            title: firstLesson.name,
            unitName: 'Lesson Content',
            videoTitle: firstLesson.name,
            videoId: this.extractYouTubeId(firstLesson.videoUrl),
            duration: firstLesson.duration,
            notes: [
              {
                image: 'assets/icons/bulb.png',
                title: 'Lesson Content',
                htmlContent: firstLesson.content, // Maps the LONGTEXT from Java
                styles: {
                  bg: '',
                  border: 'border-slate-200',
                  iconColor: 'text-[#9333EA]',
                },
              },
            ],
          };
        }
      },
      error: (err) => console.error('Error loading lessons', err),
    });
  }

  formatDuration(minutes: number): string {
    if (!minutes) return '0:00'; // Handle cases where duration might be null/undefined

    const totalMinutes = Math.floor(minutes);
    const seconds = Math.floor((minutes - totalMinutes) * 60); // If duration is in minutes from backend
    // OR if duration is already in seconds from backend, just use:
    // const totalSeconds = Math.floor(minutes); // Use this if backend sends total seconds

    const minutesPart = totalMinutes.toString().padStart(2, '0');
    const secondsPart = seconds.toString().padStart(2, '0');

    return `${minutesPart}:${secondsPart}`;
  }

  private extractYouTubeId(url: string): string {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url?.match(regExp);
    return match && match[2].length === 11 ? match[2] : 'M7lc1UVf-VE'; // Fallback ID
  }

  markAsComplete() {
    if (this.isSubmitting || this.isRevisionMode) return;
    this.isSubmitting = true;

    const payload: LessonTrackerDto = {
      learnerId: this.learnerId,
      lessonId: this.currentLessonId,
    };

    this.markCompletedService.markAsComplete(payload).subscribe({
      next: (response) => {
        this.isLessonComplete = true;
        this.showSuccessModal = true; // Show the popup
        this.playSuccessSound();
        this.launchConfetti();
        this.isRevisionMode = true; // Switch to revision mode after saving
        this.isSubmitting = false;
      },
      error: (err) => {
        console.error('Failed to update backend', err);
        this.isSubmitting = false;
      },
    });
  }

  goToNextLesson() {
    this.location.back();
  }

  closeModal() {
    this.showSuccessModal = false;
  }

  // 3. Logic to play the audio
  private playSuccessSound() {
    const audio = new Audio();
    audio.src = 'assets/sounds/clap.mp3'; // Path to your sound file
    audio.load();
    audio.play().catch((err) => console.log('Audio play failed (User must interact first):', err));
  }

  private launchConfetti() {
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      // 1. Left side of the fountain (Shooting from center towards top-left)
      confetti({
        particleCount: 12,
        angle: 105, // Slightly tilted left
        spread: 50,
        origin: { x: 0.5, y: 1 }, // Bottom Center
        startVelocity: 85, // High velocity to reach 3/4 of the screen
        gravity: 0.8, // Lower gravity so they "float" more
        scalar: 1.2,
        colors: ['#9333EA', '#4ADE80', '#FAC815', '#687AE4', '#FF0000'],
      });

      // 2. Right side of the fountain (Shooting from center towards top-right)
      confetti({
        particleCount: 12,
        angle: 75, // Slightly tilted right
        spread: 50,
        origin: { x: 0.5, y: 1 }, // Bottom Center
        startVelocity: 85, // Matches left side for symmetry
        gravity: 0.8,
        scalar: 1.2,
        colors: ['#9333EA', '#4ADE80', '#FAC815', '#687AE4', '#FF0000'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    // One massive high-altitude burst to start the celebration
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { x: 0.5, y: 1 },
      angle: 90,
      startVelocity: 95, // Even higher burst for the start
      gravity: 0.7,
      ticks: 200,
    });

    frame();
  }
  // 4. Logic to launch confetti

  resetLesson() {
    this.isLessonComplete = false;
  }

  playVideo() {
    this.isVideoPlaying = true;
  }

  onVideoReady() {
    console.log('Video is ready to play');
  }

  onVideoStateChange(state: number) {
    // YouTube Player States: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
    console.log('Video state changed:', state);
  }

  goBack() {
    this.location.back(); // This takes you back to the units list exactly as it was
  }
}
