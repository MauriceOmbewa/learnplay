import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { KidsDashboard } from './components/kids-dashboard/kids-dashboard';
import { MainContent } from './components/main-content/main-content';
import { SubjectLessons } from './components/subject-lessons/subject-lessons';
import { LessonUnit } from './components/lesson-unit/lesson-unit';
import { UnitContent } from './components/unit-content/unit-content';
import { authGuard } from '../guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: KidsDashboard,
    canActivate: [authGuard],
    data: { role: 'GUARDIAN' },
    children: [
      { path: '', component: MainContent },
      // 1. Subject Page (Displays Units)
      { path: 'subject/:subjectId/:gsId', component: SubjectLessons },
      
      // 2. Unit Page (Displays Lessons) - Notice we keep :subjectId in the path
      { path: 'subject/:subjectId/unit/:unitId', component: LessonUnit },
      
      // 3. Content Page (Displays Video/Notes) - Notice we keep subjectId and unitId
      { path: 'subject/:subjectId/unit/:unitId/lesson/:lessonId', component: UnitContent },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class KidRoutingModule {}
