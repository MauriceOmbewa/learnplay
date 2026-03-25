import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../../reusable/navbar/navbar';
import { ChoosePlan } from '../../reusable/choose-plan/choose-plan';
import { PaymentMethod, Plan } from '../../reusable/payment-method/payment-method';
import { LearnerService } from '../../../kid/services/learner/learner';

@Component({
  selector: 'app-kids-dashboard',
  standalone: true,
  imports: [CommonModule, Navbar, RouterOutlet, ChoosePlan, PaymentMethod],
  templateUrl: './kids-dashboard.html',
  styleUrls: ['./kids-dashboard.css'],
})
export class KidsDashboard implements OnInit {
  // Flow State: 'plan-selection' | 'payment' | 'dashboard'
  currentStep: 'plan-selection' | 'payment' | 'dashboard' = 'plan-selection';

  // Data to pass between components
  selectedPlan: Plan | null = null;

  // Data Source (Ideally this is in a service, but putting here for context)
  availablePlans: Plan[] = [
    {
      id: 'hourly',
      title: 'Hourly Plan',
      subtitle: 'Perfect for quick sessions',
      price: 1,
      currency: 'KES',
      period: 'per hour',
      icon: 'schedule',
      iconBg: 'bg-orange-300',
      textColor: 'text-purple-700',
    },
    {
      id: 'daily',
      title: 'Daily Plan',
      subtitle: 'Learn all day long',
      price: 12,
      currency: 'KES',
      period: 'per day',
      icon: 'calendar_today',
      iconBg: 'bg-blue-400',
      textColor: 'text-blue-600',
    },
    {
      id: 'weekly',
      title: 'Weekly Plan',
      subtitle: 'Best value for a week',
      price: 77,
      currency: 'KES',
      period: 'per week',
      icon: 'date_range',
      iconBg: 'bg-green-500',
      textColor: 'text-green-600',
    },
    {
      id: 'monthly',
      title: 'Monthly Plan',
      subtitle: 'Maximum savings',
      price: 299,
      currency: 'KES',
      period: 'per month',
      icon: 'event',
      iconBg: 'bg-pink-400',
      textColor: 'text-pink-500',
    },
  ];

  constructor(private learnerService: LearnerService) {}

  ngOnInit() {
    // 3. Check subscription status when the component loads
    const selectedLearnerStr = localStorage.getItem('selectedLearner');

    if (selectedLearnerStr) {
      const learner = JSON.parse(selectedLearnerStr);

      // 2. Use the service logic to decide the starting step
      const active = this.learnerService.isSubscriptionActive(learner.subscriptionExpiryDate);
      
      if (active) {
        this.currentStep = 'dashboard';
      } else {
        this.currentStep = 'plan-selection';
      }
    
    }
  }

  // 4. Helper function to check if date is valid
  // checkSubscription(expiryDate: string | null): boolean {
  //   if (!expiryDate) return false;
  //   const now = new Date();
  //   const expiry = new Date(expiryDate);
  //   return expiry > now;
  // }

  // Called when user clicks "Choose Plan" in the first screen
  onPlanSelected(planId: string) {
    // Find the full plan object based on ID
    this.selectedPlan = this.availablePlans.find((p) => p.id === planId) || null;
    if (this.selectedPlan) {
      this.currentStep = 'payment'; // Move to next screen
    }
  }

  // Called when Payment is processed
  onPaymentSuccess() {
    console.log('Payment received. Unlocking dashboard...');
    this.currentStep = 'dashboard'; // Unlock the app
  }

  // Called if user wants to go back
  returnToPlans() {
    this.currentStep = 'plan-selection';
    this.selectedPlan = null;
  }
}
