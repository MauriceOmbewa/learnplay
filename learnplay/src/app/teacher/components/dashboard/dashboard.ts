import { Component } from '@angular/core';
import { FeatureCards } from './feature-cards/feature-cards';
import { StaticInfo } from './static-info/static-info';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FeatureCards, StaticInfo, RouterOutlet],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class Dashboard {

}
