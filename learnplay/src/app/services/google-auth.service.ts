import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';

declare const google: any;

@Injectable({
  providedIn: 'root'
})
export class GoogleAuthService {
  private clientId = environment.googleClientId;
  private isGoogleLoaded = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      this.loadGoogleScript();
    }
  }

  private loadGoogleScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!isPlatformBrowser(this.platformId)) {
        resolve();
        return;
      }
      
      if (this.isGoogleLoaded || typeof google !== 'undefined') {
        this.isGoogleLoaded = true;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.isGoogleLoaded = true;
        resolve();
      };
      script.onerror = () => reject('Failed to load Google script');
      document.head.appendChild(script);
    });
  }

  async initializeGoogleAuth(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return Promise.resolve();
    }
    
    await this.loadGoogleScript();
    
    return new Promise((resolve) => {
      const checkGoogle = () => {
        if (typeof google !== 'undefined' && google.accounts) {
          google.accounts.id.initialize({
            client_id: this.clientId,
            callback: this.handleCredentialResponse.bind(this),
            auto_select: false,
            cancel_on_tap_outside: false
          });
          resolve();
        } else {
          setTimeout(checkGoogle, 100);
        }
      };
      checkGoogle();
    });
  }

  private handleCredentialResponse(response: any): void {
    // This will be handled by the promise in signInWithGoogle
    this.credentialResponse = response;
  }

  private credentialResponse: any = null;

  async signInWithGoogle(): Promise<any> {
    if (!isPlatformBrowser(this.platformId)) {
      return Promise.reject('Not running in browser');
    }
    
    if (!this.clientId || this.clientId.includes('YOUR_NEW_GOOGLE_CLIENT_ID')) {
      console.error('Google Client ID not configured properly');
      return Promise.reject('Google Client ID not configured');
    }
    
    await this.initializeGoogleAuth();
    
    return new Promise((resolve, reject) => {
      google.accounts.id.initialize({
        client_id: this.clientId,
        callback: (response: any) => {
          if (response.error) {
            console.error('Google Sign-In Error:', response.error);
            reject(response.error);
          } else {
            const userInfo = this.decodeJWT(response.credential);
            resolve({ credential: response.credential, userInfo });
          }
        },
        auto_select: false,
        cancel_on_tap_outside: false
      });
      
      google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.log('Prompt not displayed, reason:', notification.getNotDisplayedReason());
          this.showGooglePopup().then(resolve).catch(reject);
        }
      });
    });
  }

  private showGooglePopup(): Promise<any> {
    if (!isPlatformBrowser(this.platformId)) {
      return Promise.reject('Not running in browser');
    }
    
    return new Promise((resolve, reject) => {
      // Use Google's built-in popup method instead of custom popup
      google.accounts.id.initialize({
        client_id: this.clientId,
        callback: (response: any) => {
          if (response.error) {
            reject(response.error);
          } else {
            resolve(response);
          }
        }
      });
      
      // Render a temporary button and click it
      const tempDiv = document.createElement('div');
      tempDiv.style.display = 'none';
      document.body.appendChild(tempDiv);
      
      google.accounts.id.renderButton(tempDiv, {
        theme: 'outline',
        size: 'large',
        type: 'standard'
      });
      
      // Auto-click the button
      setTimeout(() => {
        const button = tempDiv.querySelector('[role="button"]') as HTMLElement;
        if (button) {
          button.click();
        }
        document.body.removeChild(tempDiv);
      }, 100);
      
      setTimeout(() => reject('Timeout'), 30000);
    });
  }

  decodeJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  }

  async simpleGoogleSignIn(): Promise<any> {
    if (!isPlatformBrowser(this.platformId)) {
      return Promise.reject('Not running in browser');
    }
    
    try {
      await this.initializeGoogleAuth();
      
      const buttonDiv = document.createElement('div');
      buttonDiv.id = 'temp-google-button';
      buttonDiv.style.display = 'none';
      document.body.appendChild(buttonDiv);
      
      return new Promise((resolve, reject) => {
        google.accounts.id.initialize({
          client_id: this.clientId,
          callback: (response: any) => {
            if (document.body.contains(buttonDiv)) {
              document.body.removeChild(buttonDiv);
            }
            const userInfo = this.decodeJWT(response.credential);
            resolve({ credential: response.credential, userInfo });
          }
        });
        
        google.accounts.id.renderButton(buttonDiv, {
          theme: 'outline',
          size: 'large'
        });
        
        setTimeout(() => {
          const button = buttonDiv.querySelector('div[role="button"]') as HTMLElement;
          if (button) {
            button.click();
          } else {
            google.accounts.id.prompt();
          }
        }, 100);
        
        setTimeout(() => {
          if (document.body.contains(buttonDiv)) {
            document.body.removeChild(buttonDiv);
          }
          reject('Google sign-in timeout');
        }, 30000);
      });
    } catch (error) {
      throw error;
    }
  }

  // Extract user data from Google JWT token
  extractUserData(credential: string): any {
    const userInfo = this.decodeJWT(credential);
    return {
      googleId: userInfo.sub,                    // Google's unique ID
      email: userInfo.email,                     // User's email
      firstName: userInfo.given_name || '',      // First name from Google
      lastName: userInfo.family_name || '',      // Last name from Google
      fullName: userInfo.name || '',             // Full name from Google
      profilePicture: userInfo.picture || '',    // Profile picture URL
      emailVerified: userInfo.email_verified || false, // Email verification status
      locale: userInfo.locale || 'en'            // User's locale
    };
  }
}