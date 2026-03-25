import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardLayout } from './components/dashboard-layout/dashboard-layout';
import { ParentPage } from './components/parent-page/parent-page';
import { AddChild } from './components/add-child/add-child';
import { ChildDetails } from './components/child-details/child-details';
import { SelectLearner } from './components/select-learner/select-learner';
import { authGuard } from '../guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: DashboardLayout,
    canActivate: [authGuard],
    data: { role: 'GUARDIAN' },
    children: [
      { path: '', component: ParentPage },
      { path: 'add-child', component: AddChild },
      { path: 'child/:id', component: ChildDetails },
      { path: 'select-learner', component: SelectLearner }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ParentRoutingModule { }
