import { Routes } from '@angular/router';
import { LandingPageComponent } from './landing-page-module/components/landing-page-component/landing-page-component';

export const routes: Routes = [
    {
        path: '',
        component: LandingPageComponent
    },
    {
        path: 'who-are-you',
        loadChildren: () => import('./landing-page-module/landing-page-module-module').then(m => m.routes)
    }
];
