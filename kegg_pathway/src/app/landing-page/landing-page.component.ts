import { Component } from '@angular/core';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css'],
  standalone: true
})
export class LandingPageComponent {
  getStarted() {
    // Implement navigation or action for Get Started
    console.log('Get Started clicked');
  }
}