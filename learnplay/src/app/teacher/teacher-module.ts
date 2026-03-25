import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { Navbar } from './components/dashboard/navbar/navbar';
import { Dashboard } from './components/dashboard/dashboard';
import { StaticInfo } from './components/dashboard/static-info/static-info';
import { FeatureCards } from './components/dashboard/feature-cards/feature-cards';
import { Profile } from './profile/profile';
import { ProfileEdit } from './profile/profile-edit';



import { TeacherLayout } from './components/layout/teacher-layout';



import { TeacherRoutingModule } from './teacher-routing-module';





@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    TeacherRoutingModule,
    Navbar,
    Dashboard,
    StaticInfo,
    FeatureCards,
    Profile,
    ProfileEdit,
    TeacherLayout
  ]
})
export class TeacherModule { }