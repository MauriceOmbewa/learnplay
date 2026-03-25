import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../dashboard/navbar/navbar';

@Component({
  selector: 'app-teacher-layout',
  standalone: true,
  imports: [RouterOutlet, Navbar],
  template: `
    <app-navbar></app-navbar>
    <router-outlet></router-outlet>
  `
})
export class TeacherLayout {}
