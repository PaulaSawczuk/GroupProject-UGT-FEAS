import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';  // Import CommonModule

@Component({
  selector: 'app-project-name-modal',
  standalone: true,
  imports: [FormsModule, CommonModule],  // Add CommonModule here
  templateUrl: './project-name-modal.component.html',
  styleUrls: ['./project-name-modal.component.css']  // Correct the property name to styleUrls
})
export class ProjectNameModalComponent {
  projectName = '';
  showError: boolean = false;
  @Output() confirmed = new EventEmitter<string>();
  @Output() cancelled = new EventEmitter<void>();

  handleSave() {
    console.log('Project Name:', this.projectName);
    if (this.projectName.trim() === '') {
      this.showError = true;
    } else {
      this.showError = false;
      console.log('Project saved:', this.projectName);
      this.confirm();
    }
  }
  
  confirm(): void {
    if (this.projectName.trim()) {
      this.confirmed.emit(this.projectName.trim());
    }
  }

  cancel(): void {
    this.cancelled.emit();
  }
}