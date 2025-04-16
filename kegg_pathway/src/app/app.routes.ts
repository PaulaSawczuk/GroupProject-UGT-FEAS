import { Routes } from '@angular/router';
import { UploadComponent } from './upload/upload.component';
import { DisplayComponent } from './display/display.component';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { GuidePageComponent } from './guide-page/guide-page.component';

export const routes: Routes = [
  { path: '', component: LandingPageComponent, data: { animation: 'LandingPage' } },
  { path: 'upload', component: UploadComponent }, 
  { path: 'guide-page', component: GuidePageComponent, data: { animation: 'GuidePage' } },
  { path: 'display', component: DisplayComponent },
];