import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-subscription-plan',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './subscription-plan.html'
})
export class SubscriptionPlanComponent implements OnInit {
  showForm = false;
  courseId = '';

  form = {
    name: '',
    description: '',
    amount: null as number | null,
    billingType: ''
  };

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    this.courseId = this.route.snapshot.paramMap.get('courseId') ?? '';
  }

  submitForm() {
    const payload = { ...this.form, courseId: this.courseId };
    console.log('Subscription payload:', payload);
    // TODO: call API with payload
    this.cancelForm();
  }

  cancelForm() {
    this.showForm = false;
    this.form = { name: '', description: '', amount: null, billingType: '' };
  }

  goBack() {
    this.router.navigate(['/courses/dashboard', this.courseId]);
  }
}
