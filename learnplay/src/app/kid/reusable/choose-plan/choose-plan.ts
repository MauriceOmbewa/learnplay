import { Component, Output, EventEmitter } from '@angular/core'; // <--- 1. UPDATE IMPORTS
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';

interface Plan {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  currency: string;
  period: string;
  icon: string;
  iconBg: string; 
  textColor?: string; 
}

@Component({
  selector: 'app-choose-plan',
  standalone: true, // (Assuming standalone based on your imports array)
  imports: [CommonModule, MatIconModule, MatRippleModule],
  templateUrl: './choose-plan.html',
  styleUrl: './choose-plan.css',
})
export class ChoosePlan {

  // 2. ADD THE OUTPUT EVENT EMITTER HERE
  @Output() planSelected = new EventEmitter<string>();

  selectedPlanId: string | null = null;

  plans: Plan[] = [
    {
      id: 'hourly',
      title: 'Hourly Plan',
      subtitle: 'Perfect for quick sessions',
      price: 1,
      currency: 'KES',
      period: 'per hour',
      icon: 'assets/icons/clock.png',
      iconBg: 'bg-[linear-gradient(134.45deg,_#F8C96C_15.3%,_#FCA780_81.76%)]',
      textColor: 'text-[#9333EA]'
    },
    {
      id: 'daily',
      title: 'Daily Plan',
      subtitle: 'Learn all day long',
      price: 12,
      currency: 'KES',
      period: 'per day',
      icon: 'assets/icons/calendar.png',
      iconBg: 'bg-[linear-gradient(134.45deg,_#3466EB_15.3%,_#98B4FF_81.76%)]',
      textColor: 'text-[#3466EB]'
    },
    {
      id: 'weekly',
      title: 'Weekly Plan',
      subtitle: 'Best value for a week',
      price: 77,
      currency: 'KES',
      period: 'per week',
      icon: 'assets/icons/calendar.png',
      iconBg: 'bg-[linear-gradient(134.45deg,_#16A34A_15.3%,_#1FF46E_81.76%)]',
      textColor: 'text-[#16A34A]'
    },
    {
      id: 'monthly',
      title: 'Monthly Plan',
      subtitle: 'Maximum savings',
      price: 299,
      currency: 'KES',
      period: 'per month',
      icon: 'assets/icons/calendar.png',
      iconBg: 'bg-[linear-gradient(90deg,_#C57CF0_0%,_#EA4C9F_100%)]',
      textColor: 'text-[#EA4C9F]'
    }
  ];

  selectPlan(planId: string) {
    this.selectedPlanId = planId;
    this.confirmSelection();
  }

  // 3. ADD THE CONFIRM FUNCTION HERE
  confirmSelection() {
    if (this.selectedPlanId) {
      this.planSelected.emit(this.selectedPlanId);
    } else {
      // Optional: Alert the user if they haven't clicked a plan yet
      alert('Please select a plan to continue');
    }
  }

}