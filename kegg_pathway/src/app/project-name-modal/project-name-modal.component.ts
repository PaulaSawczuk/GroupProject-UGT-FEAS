import { Component, EventEmitter, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-project-name-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './project-name-modal.component.html',
  styleUrl: './project-name-modal.component.css'
})
export class ProjectNameModalComponent {
  projectName = '';
  @Output() confirmed = new EventEmitter<string>();
  @Output() cancelled = new EventEmitter<void>();

  confirm(): void {
    if (this.projectName.trim()) {
      this.confirmed.emit(this.projectName.trim());
    }
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
