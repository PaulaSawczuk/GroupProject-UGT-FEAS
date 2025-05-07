import { Component } from '@angular/core';
import { UploadComponent } from './upload/upload.component';
import { RouterOutlet } from '@angular/router';
import { slideUpAnimation } from './helper/route-animations';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, UploadComponent],
  animations: [slideUpAnimation],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'kegg_pathway';
  prepareRoute(outlet: RouterOutlet) {
    return outlet?.activatedRouteData?.['animation'];
  }
}
