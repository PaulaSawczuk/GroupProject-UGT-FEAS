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

// Create a modal for entering a project name.
export class ProjectNameModalComponent {
  projectName = '';
  showError: boolean = false;
  @Output() confirmed = new EventEmitter<string>();
  @Output() cancelled = new EventEmitter<void>();
  
  // Get the project name from the input field.
  // This will be used to save the project name.
  // This will be used to show an error message if the project name is empty.
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
  // Confirm if the user wants to save the project name.
  // This will emit the project name to the parent component.
  // This will close the modal.
  confirm(): void {
    if (this.projectName.trim()) {
      this.confirmed.emit(this.projectName.trim());
    }
  }
  // Cancel if the user does not want to save the project name.
  // This will close the modal.
  cancel(): void {
    this.cancelled.emit();
  }
}