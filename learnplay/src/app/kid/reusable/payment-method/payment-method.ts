import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';

// Reusing the interface from your previous code
export interface Plan {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  currency: string;
  period: string;
  icon: string;
  iconBg: string;
  textColor: string;
}

@Component({
  selector: 'app-payment-method',
  imports: [CommonModule, MatIconModule, MatRippleModule, FormsModule],
  templateUrl: './payment-method.html',
  // styleUrl: './payment-method.css',
  styles: [`
    /* Smooth accordion transition */
    .accordion-content {
      transition: max-height 0.3s ease-in-out, opacity 0.3s ease-in-out;
      max-height: 0;
      opacity: 0;
      overflow: hidden;
    }
    .accordion-content.expanded {
      max-height: 1000px; /* Arbitrary large height */
      opacity: 1;
    }
  `]
})
export class PaymentMethod {

  // Input: The plan selected in the previous step
  @Input() plan!: Plan; 
  
  // Output: When payment is successful
  @Output() paymentComplete = new EventEmitter<void>();
  @Output() backToPlans = new EventEmitter<void>();

  selectedMethodId: string | null = null;
  isProcessing: boolean = false;

  // Form Models
  mpesaNumber: string = '';
  airtelNumber: string = '';
  cardDetails = {
    number: '',
    holder: '',
    expiry: '',
    cvv: '',
    recurring: false
  };

  toggleMethod(methodId: string) {
    if (this.selectedMethodId === methodId) {
      this.selectedMethodId = null; // Close if already open
    } else {
      this.selectedMethodId = methodId; // Open new
    }
  }

  processPayment(method: string) {
    // Here you would integrate with your Payment Gateway API
    this.isProcessing = true;
    console.log(`Processing ${method} payment for plan: ${this.plan.title}`);
    
    // Simulate success
    setTimeout(() => {
        this.isProcessing = false;

        this.paymentComplete.emit();
    }, 1500);
  }

}
