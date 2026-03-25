import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserRoleService } from '../../services/user-role.service';
import { GoogleAuthService } from '../../../services/google-auth.service';
import { AuthService } from '../../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ParentApiService } from '../../../parent/services/parent-api.service';

@Component({
  selector: 'app-sign-in',
  imports: [CommonModule, FormsModule],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.css',
})
export class SignIn {
  email = '';
  password = '';
  errorMessage = '';

  constructor(
    private router: Router, 
    private userRoleService: UserRoleService, 
    private googleAuth: GoogleAuthService,
    private authService: AuthService,
    private http: HttpClient,
    private parentApiService: ParentApiService
  ) {}

  navigateToSignUp() {
    this.router.navigate(['/sign-up']);
  }

  navigateToLandingPage() {
    this.router.navigate(['/']);
  }

  onSignIn() {
    const loginData = { username: this.email.trim().toUpperCase(), password: this.password };
    console.log('🔵 [SIGN-IN COMPONENT] Starting login with username:', loginData.username);
    
    this.authService.login(loginData).subscribe({
      next: (userData: any) => {
        console.log('🟢 [SIGN-IN COMPONENT] Login successful, received userData:', userData);
        localStorage.clear();
        console.log('🟡 [SIGN-IN COMPONENT] localStorage cleared');
        localStorage.setItem('userDetails', JSON.stringify(userData));
        console.log('🟢 [SIGN-IN COMPONENT] userDetails stored in localStorage');
        console.log('🟢 [SIGN-IN COMPONENT] Verifying localStorage:', localStorage.getItem('userDetails'));
        
        this.parentApiService.fetchAllCourses().subscribe({
          next: (courses) => {
            if (courses && courses.length > 0) {
              localStorage.setItem('courses', JSON.stringify(courses));
              
              const gradesMap: any = {};
              let completedRequests = 0;
              
              courses.forEach((course: any) => {
                this.parentApiService.fetchGradesByCourse(course.id).subscribe({
                  next: (grades) => {
                    gradesMap[course.id] = grades;
                    completedRequests++;
                    
                    if (completedRequests === courses.length) {
                      localStorage.setItem('gradesMap', JSON.stringify(gradesMap));
                      this.navigateBasedOnRole(userData.role);
                    }
                  },
                  error: (error) => {
                    completedRequests++;
                    if (completedRequests === courses.length) {
                      localStorage.setItem('gradesMap', JSON.stringify(gradesMap));
                      this.navigateBasedOnRole(userData.role);
                    }
                  }
                });
              });
            } else {
              this.navigateBasedOnRole(userData.role);
            }
          },
          error: (error) => {
            this.navigateBasedOnRole(userData.role);
          }
        });
      },
      error: (error) => {
        console.error('Login failed:', error);
        
        // Check if this is a Google user trying to login normally
        if (error.error && error.error.error === 'GOOGLE_USER') {
          this.errorMessage = 'This account uses Google Sign-In. Please click the "Sign in with Google" button below.';
        } else {
          this.errorMessage = 'Login failed. Please check your credentials.';
        }
      }
    });
  }

  navigateBasedOnRole(role: string) {
    if (role === 'GUARDIAN') {
      this.router.navigate(['/who-are-you']);
    } else if (role === 'ADMIN') {
      this.router.navigate(['/teacher']);
    } else {
      this.router.navigate(['/parent']);
    }
  }


  async onGoogleSignIn() {
    try {
      // Google returns: { credential: "jwt_token", select_by: "user", client_id: "..." }
      const response = await this.googleAuth.simpleGoogleSignIn();
      
      // Extract user data from the JWT credential
      const userData = this.googleAuth.extractUserData(response.credential);
      
      console.log('Google Sign-In successful:', userData);
      console.log('Original Google response:', response);
      
      // Send Google user data to backend for authentication
      const googleAuthData = {
        googleId: userData.googleId,        // from JWT 'sub' field
        email: userData.email,              // from JWT 'email' field
        firstName: userData.firstName,      // from JWT 'given_name' field
        lastName: userData.lastName,        // from JWT 'family_name' field
        profilePicture: userData.profilePicture, // from JWT 'picture' field
        emailVerified: userData.emailVerified    // from JWT 'email_verified' field
      };
      
      console.log('Sending to backend:', googleAuthData);
      
      // Call backend Google auth endpoint
      this.http.post(`${environment.apiUrl}/auth/google`, googleAuthData).subscribe({
        next: (backendResponse: any) => {
          console.log('Google authentication successful:', backendResponse);
          localStorage.clear();
          localStorage.setItem('userDetails', JSON.stringify(backendResponse));
          localStorage.setItem('googleUser', JSON.stringify(userData));
          
          this.parentApiService.fetchAllCourses().subscribe({
            next: (courses) => {
              if (courses && courses.length > 0) {
                localStorage.setItem('courses', JSON.stringify(courses));
                
                const gradesMap: any = {};
                let completedRequests = 0;
                
                courses.forEach((course: any) => {
                  this.parentApiService.fetchGradesByCourse(course.id).subscribe({
                    next: (grades) => {
                      gradesMap[course.id] = grades;
                      completedRequests++;
                      
                      if (completedRequests === courses.length) {
                        localStorage.setItem('gradesMap', JSON.stringify(gradesMap));
                        this.navigateBasedOnRole(backendResponse.role);
                      }
                    },
                    error: (error) => {
                      completedRequests++;
                      if (completedRequests === courses.length) {
                        localStorage.setItem('gradesMap', JSON.stringify(gradesMap));
                        this.navigateBasedOnRole(backendResponse.role);
                      }
                    }
                  });
                });
              } else {
                this.navigateBasedOnRole(backendResponse.role);
              }
            },
            error: (error) => {
              this.navigateBasedOnRole(backendResponse.role);
            }
          });
        },
        error: (error) => {
          console.error('Google authentication failed:', error);
          this.errorMessage = 'Google Sign-In failed. Please try again.';
        }
      });
    } catch (error) {
      console.error('Google Sign-In failed:', error);
      this.errorMessage = 'Google Sign-In failed. Please try again or use regular sign-in.';
    }
  }
}
