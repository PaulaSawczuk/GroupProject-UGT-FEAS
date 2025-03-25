import { Routes } from '@angular/router';
import { UploadComponent } from './upload/upload.component';
import { DisplayComponent } from './display/display.component';

export const routes: Routes = [
  { path: '', component: UploadComponent },   // Ensure this route exists for the root path
  { path: 'display', component: DisplayComponent },
];