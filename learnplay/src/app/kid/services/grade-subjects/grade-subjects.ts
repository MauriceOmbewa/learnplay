import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';

// This matches your GradeSubjectDetailsDto
export interface GradeSubjectDetails {
  id: string; // Subject ID (from your Repo Query)
  gradeSubjectId: string;
  subject: string; // Subject Name
  name: string;
  description: string;
  topicCount: number;

  // UI ONLY FIELDS (Not in DB)
  icon: string;
  bg: string;
  color: string;
  gradient: string;
  progress: number;
  points: number;
}

@Injectable({ providedIn: 'root' })
export class GradeSubjectService {

  private readonly endpoint = `${environment.apiUrl}/grade-subject`;

  constructor(private http: HttpClient) {}

  public getSubjectsByGrade(gradeId: string): Observable<GradeSubjectDetails[]> {
    return this.http
      .get<any[]>(`${this.endpoint}/subjects/byGrade/${gradeId}`)
      .pipe(map((data) => data.map((s) => this.applyUiStyles(s))));
  }

  private applyUiStyles(data: any): GradeSubjectDetails {
    // We map the backend names to your UI colors/icons
    const styles: any = {
      Math: {
        color: 'text-orange-600',
        bg: 'bg-[#F8C96C]',
        grad: 'linear-gradient(to right, #FAC815, #F97616)',
        icon: 'maths.png',
      },
      Science: {
        color: 'text-green-600',
        bg: 'bg-[#67ECA3]',
        grad: 'linear-gradient(to right, #49D888, #3C89ED)',
        icon: 'microscope.png',
      },
      English: {
        color: 'text-blue-600',
        bg: 'bg-[#B1EAE9]',
        grad: 'linear-gradient(to right, #62A2F9, #A757F7)',
        icon: 'book.png',
      },
      Art: {
        color: 'text-purple-600',
        bg: 'bg-[#D6C3FC]',
        grad: 'linear-gradient(to right, #C57CF0, #EA4C9F)',
        icon: 'art.png',
      },
    };

    const subjectName = data.subject || 'Math';
    const style = styles[subjectName] || styles['Math'];

    return {
      ...data,
      name: subjectName, // Map 'subject' field to 'name' for the HTML
      gradeSubjectId: data.gradeSubjectId, 
      // progress: Math.floor(Math.random() * 80) + 10, // Placeholder
      points: data.topicCount * 10, // Example logic: 10 points per topic
      icon: `/assets/icons/${style.icon}`,
      bg: style.bg,
      color: style.color,
      gradient: style.grad,
    };
  }
}
