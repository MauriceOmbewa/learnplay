import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { CourseService } from '../../../services/course.service';
import { localGet, localSet } from '../../../shared/components/utils/local-storage.util';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './courses.html'
})
export class CoursesComponent implements OnInit {
  showForm = false;
  selectedCourseId: string = '';
  countries: any[] = [];
  courses: any[] = [];

  newCourse = {
    title: '',
    countryCode: '',
    premium: false,
    description: '',
    active: true
  };

  constructor(
    private router: Router,
    private courseService: CourseService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadStoredCourseId();
    this.loadCourses();
    this.loadCountries();
  }

  loadStoredCourseId() {
    const storedCourseId = localGet('selectedCourseId');
    if (storedCourseId) {
      this.selectedCourseId = storedCourseId;
    }
  }

  loadCourses() {
    this.courseService.getAllCourses().subscribe({
      next: (apiCourses) => {
        this.courses = apiCourses;
        console.log('Courses loaded:', this.courses);
      },
      error: (err: unknown) => console.error('Error loading courses:', err)
    });
  }

  loadCountries() {
    this.http.get('https://restcountries.com/v3.1/all?fields=name,cca2').subscribe({
      next: (data: any) => {
        this.countries = data
          .map((country: any) => ({
            name: country.name.common,
            code: country.cca2
          }))
          .sort((a: any, b: any) => a.name.localeCompare(b.name));
        console.log('Countries loaded:', this.countries);
      },
      error: (err: unknown) => console.error('Error loading countries:', err)
    });
  }

  selectCourse(courseId: string) {
    this.selectedCourseId = courseId;
    localSet('selectedCourseId', courseId);
    this.router.navigate(['/courses/dashboard', courseId]);
  }

  viewCourse(courseId: string) {
    this.selectCourse(courseId);
  }

  toggleForm() {
    this.showForm = !this.showForm;
  }

  createCourse() {
    const courseData = {
      title: this.newCourse.title,
      countryCode: this.newCourse.countryCode,
      premium: this.newCourse.premium,
      description: this.newCourse.description,
      active: this.newCourse.active
    };

    this.courseService.createCourse(courseData).subscribe({
      next: (response: any) => {
        console.log('Course created:', response.id);
        this.selectedCourseId = response.id;
        localSet('selectedCourseId', response.id);
        this.showForm = false;
        this.loadCourses();
        this.resetForm();
        this.router.navigate(['/courses/dashboard', response.id]);
      },
      error: (err: unknown) => console.error('Error creating course:', err)
    });
  }

  resetForm() {
    this.newCourse = {
      title: '',
      countryCode: '',
      premium: false,
      description: '',
      active: true
    };
  }
}