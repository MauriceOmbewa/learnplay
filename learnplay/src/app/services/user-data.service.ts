import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class UserDataService {
  
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}
  
  getUserDetails(): any {
    if (!isPlatformBrowser(this.platformId)) {
      return null; // Return null on server side
    }
    
    const data = localStorage.getItem('userDetails');
    console.log('🔵 [USER DATA SERVICE] getUserDetails called, raw data:', data);
    const parsed = data ? JSON.parse(data) : null;
    console.log('🔵 [USER DATA SERVICE] getUserDetails parsed:', parsed);
    return parsed;
  }

  getUserId(): string | null {
    const details = this.getUserDetails();
    console.log('🔵 [USER DATA SERVICE] getUserId:', details?.id || null);
    return details?.id || null;
  }

  getUsername(): string | null {
    const details = this.getUserDetails();
    return details?.username || null;
  }

  getFirstName(): string | null {
    const details = this.getUserDetails();
    return details?.firstName || null;
  }

  getLastName(): string | null {
    const details = this.getUserDetails();
    return details?.lastName || null;
  }

  getUserRole(): string | null {
    const details = this.getUserDetails();
    const role = details?.role || null;
    console.log('🔵 [USER DATA SERVICE] getUserRole:', role);
    return role;
  }

  getLearners(): any[] {
    const details = this.getUserDetails();
    return details?.learners || [];
  }

  isAuthenticated(): boolean {
    return !!this.getUserDetails();
  }
}
