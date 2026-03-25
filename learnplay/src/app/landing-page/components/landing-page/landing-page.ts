import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.css'
})
export class LandingPage {
  constructor(private router: Router) {}

  onGetStarted() {
    this.router.navigate(['/sign-up/sign-in']);
  }
}