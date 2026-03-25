import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, switchMap } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  login(credentials: { username: string; password: string }): Observable<any> {
    console.log('🔵 [AUTH SERVICE] Step 1: Starting login process with credentials:', credentials.username);
    
    return this.http.post(`${this.apiUrl}/auth/login`, credentials, { 
      responseType: 'text',
      withCredentials: true 
    }).pipe(
      tap((response) => console.log('🟢 [AUTH SERVICE] Step 2: /auth/login successful, response:', response)),
      delay(100),
      tap(() => console.log('🟡 [AUTH SERVICE] Step 3: After 100ms delay, about to call /user/me')),
      switchMap(() => {
        console.log('🟠 [AUTH SERVICE] Step 4: Calling /user/me endpoint now...');
        return this.getUserDetails();
      }),
      tap((userDetails: any) => {
        console.log('🟢 [AUTH SERVICE] Step 5: /user/me response received:', userDetails);
        localStorage.setItem('userDetails', JSON.stringify(userDetails));
        console.log('🟢 [AUTH SERVICE] Step 6: userDetails stored in localStorage');
      }),
      catchError((error) => {
        console.error('🔴 [AUTH SERVICE] ERROR: Failed during login flow:', error);
        console.error('🔴 [AUTH SERVICE] ERROR Status:', error.status);
        console.error('🔴 [AUTH SERVICE] ERROR Message:', error.message);
        throw error;
      })
    );
  }

  getUserDetails(): Observable<any> {
    console.log('🔵 [AUTH SERVICE] getUserDetails: Making GET request to /user/me');
    return this.http.get(`${this.apiUrl}/user/me`).pipe(
      tap((response) => console.log('🟢 [AUTH SERVICE] getUserDetails: Response received from /user/me:', response)),
      catchError((error) => {
        console.error('🔴 [AUTH SERVICE] getUserDetails: Error from /user/me:', error);
        throw error;
      })
    );
  }

  getAccessToken(): string | null {
    return null; // Tokens are in HttpOnly cookies
  }

  getRefreshToken(): string | null {
    return null; // Tokens are in HttpOnly cookies
  }

  getUserData(): any {
    if (typeof window !== 'undefined' && window.localStorage) {
      const data = localStorage.getItem('userDetails');
      return data ? JSON.parse(data) : null;
    }
    return null;
  }

  logout(): Observable<any> {
    console.log('🔵 [AUTH SERVICE] Starting logout process...');
    
    return this.http.post(`${this.apiUrl}/auth/logout`, {}, {
      responseType: 'text',
      withCredentials: true
    }).pipe(
      tap((response) => {
        console.log('🟢 [AUTH SERVICE] Logout successful:', response);
      }),
      catchError((error) => {
        console.error('🔴 [AUTH SERVICE] Logout failed:', error);
        // Even if logout fails on server, clear local data
        return of('Logout completed');
      }),
      tap(() => {
        // Always clear local data
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.removeItem('userDetails');
        }
        console.log('🟡 [AUTH SERVICE] Local user data cleared');
      })
    );
  }

  isAuthenticated(): boolean {
    return !!this.getUserData();
  }
}