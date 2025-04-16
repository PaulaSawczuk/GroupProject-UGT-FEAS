import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { slideUpAnimation } from '../helper/route-animations';
@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css'],
  animations: [slideUpAnimation],
  standalone: true
})
export class LandingPageComponent {
  
  constructor(private router: Router) {}
  
  isGuideClicked: boolean = false;

  getStarted() {
    this.router.navigate(['/upload']);
  }

  openGuide() {
    console.log('Navigating to guide page...');
    this.isGuideClicked = true;
    this.router.navigate(['/guide-page']);
  }
}