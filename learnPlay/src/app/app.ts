import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
// import { LandingPage } from './landing-page-module/components/landing-page/landing-page';
import { LandingPageComponent } from './landing-page-module/components/landing-page-component/landing-page-component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LandingPageComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('learnPlay');
}
