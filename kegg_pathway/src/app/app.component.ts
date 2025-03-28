import { Component } from '@angular/core';
import { UploadComponent } from './upload/upload.component';
import { RouterOutlet } from '@angular/router';



@Component({
  selector: 'app-root',
  // imports: [RouterOutlet],
  imports: [RouterOutlet, UploadComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'kegg_pathway';
}
