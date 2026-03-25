import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface LessonSummary {
  id: string;
  name: string;
  content: string;
  videoUrl: string;
  duration: number;
  subTopicId: string;
}

@Injectable({
  providedIn: 'root',
})
export class LessonService {
  private readonly endpoint = `${environment.apiUrl}/lesson`;

  constructor(private http: HttpClient) {}

  public getLessonsBySubTopicId(subTopicId: string): Observable<LessonSummary []> {
    return this.http.get<LessonSummary []>(`${this.endpoint}/fetch/bySubTopicId/${subTopicId}`);
  }
}