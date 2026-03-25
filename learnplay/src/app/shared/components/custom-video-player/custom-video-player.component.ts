import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

@Component({
  selector: 'app-custom-video-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './custom-video-player.component.html',
  styleUrls: ['./custom-video-player.component.css']
})
export class CustomVideoPlayerComponent implements OnInit, OnDestroy {
  @Input() videoId!: string;
  @Input() autoplay = true;
  @Output() onReady = new EventEmitter<void>();
  @Output() onStateChange = new EventEmitter<number>();
  
  @ViewChild('playerContainer', { static: true }) playerContainer!: ElementRef;
  @ViewChild('videoPlayer', { static: true }) videoPlayer!: ElementRef;
  
  private player: any;
  private controlsTimeout: any;
  private overlayTimeout: any;
  
  isPlaying = false;
  isPaused = false;
  hasEnded = false;
  showControls = true;
  delayedOverlayResize = false;
  isFullscreen = false;
  progress = 0;
  currentTime = 0;
  duration = 0;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadYouTubeAPI();
    // Add keyboard event listener
    document.addEventListener('keydown', this.onKeyDown.bind(this));
    // Add fullscreen change listener
    document.addEventListener('fullscreenchange', this.onFullscreenChange.bind(this));
  }

  ngOnDestroy() {
    if (this.player) {
      this.player.destroy();
    }
    if (this.controlsTimeout) {
      clearTimeout(this.controlsTimeout);
    }
    if (this.overlayTimeout) {
      clearTimeout(this.overlayTimeout);
    }
    // Remove keyboard event listener
    document.removeEventListener('keydown', this.onKeyDown.bind(this));
    // Remove fullscreen change listener
    document.removeEventListener('fullscreenchange', this.onFullscreenChange.bind(this));
  }

  private loadYouTubeAPI() {
    if (window.YT) {
      this.initializePlayer();
      return;
    }

    window.onYouTubeIframeAPIReady = () => {
      this.initializePlayer();
    };

    if (!document.querySelector('script[src*="youtube"]')) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(script);
    }
  }

  private initializePlayer() {
    this.player = new window.YT.Player(this.playerContainer.nativeElement, {
      videoId: this.videoId,
      playerVars: {
        controls: 0,
        disablekb: 1,
        fs: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        autoplay: this.autoplay ? 1 : 0,
        playsinline: 1,
        cc_load_policy: 0,
        origin: window.location.origin,
        enablejsapi: 1
      },
      events: {
        onReady: (event: any) => {
          this.duration = this.player.getDuration();
          this.onReady.emit();
          this.startProgressTracking();
        },
        onStateChange: (event: any) => {
          const state = event.data;
          
          this.isPlaying = state === window.YT.PlayerState.PLAYING;
          this.isPaused = state === window.YT.PlayerState.PAUSED;
          this.hasEnded = state === window.YT.PlayerState.ENDED;
          
          if (this.hasEnded) {
            this.progress = 100;
            this.currentTime = this.duration;
          }
          
          // Force change detection immediately
          this.cdr.detectChanges();
          
          this.onStateChange.emit(state);
        }
      }
    });
  }

  private startProgressTracking() {
    setInterval(() => {
      if (this.player) {
        if (this.isPlaying) {
          this.currentTime = this.player.getCurrentTime();
          this.progress = (this.currentTime / this.duration) * 100;
        }
        // Force change detection for progress updates
        this.cdr.detectChanges();
      }
    }, 500);
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.code === 'Space') {
      event.preventDefault();
      this.togglePlayPause();
    }
  }

  onFullscreenChange() {
    this.isFullscreen = !!document.fullscreenElement;
    this.cdr.detectChanges();
  }

  togglePlayPause() {
    if (this.isPlaying) {
      this.player.pauseVideo();
      // Force immediate pause state - overlay goes to half-screen immediately
      this.isPaused = true;
      this.isPlaying = false;
      this.delayedOverlayResize = false;
      
      // Clear any pending timeout
      if (this.overlayTimeout) {
        clearTimeout(this.overlayTimeout);
      }
      
      // Trigger change detection
      this.cdr.detectChanges();
    } else {
      this.player.playVideo();
      // Force immediate play state but keep overlay at half-screen for 2 seconds
      this.isPaused = false;
      this.isPlaying = true;
      this.delayedOverlayResize = true;
      
      // Delay the overlay shrinking by 2 seconds
      if (this.overlayTimeout) {
        clearTimeout(this.overlayTimeout);
      }
      this.overlayTimeout = setTimeout(() => {
        this.delayedOverlayResize = false;
        this.cdr.detectChanges();
      }, 500);
      
      // Trigger change detection
      this.cdr.detectChanges();
    }
  }

  play() {
    this.player.playVideo();
  }

  replay() {
    this.player.seekTo(0);
    this.player.playVideo();
  }

  seekTo(event: MouseEvent) {
    const progressBar = event.currentTarget as HTMLElement;
    const rect = progressBar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = clickX / rect.width;
    const seekTime = percentage * this.duration;
    this.player.seekTo(seekTime);
  }

  toggleFullscreen() {
    const element = this.videoPlayer.nativeElement;
    if (!document.fullscreenElement) {
      element.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  showControlsTemporarily() {
    this.showControls = true;
    if (this.controlsTimeout) {
      clearTimeout(this.controlsTimeout);
    }
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}