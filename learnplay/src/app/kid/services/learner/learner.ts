import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Learner {
  id: string;
  firstName: string;
  lastName: string;
  preferredName: string;
  points: number;
  gradeId: string; 
  // Add other fields as per your LearnerDto
}
@Injectable({
  providedIn: 'root',
})
export class LearnerService {
  private readonly endpoint = `${environment.apiUrl}/learner`;

  constructor(private http: HttpClient) {}

  // Central logic for checking subscription status
  public isSubscriptionActive(expiryDate: string | null | undefined): boolean {
    return true; // Placeholder
    // if (!expiryDate) return false;
    
    // const now = new Date();
    // const expiry = new Date(expiryDate);
    
    // // Returns true if the expiry date is in the future
    // return expiry > now;
  }

  public getLearnerByUserId(userId: string): Observable<Learner[]> {
    return this.http.get<Learner[]>(`${this.endpoint}/fetchByUserId/${userId}`);
  } 
}
