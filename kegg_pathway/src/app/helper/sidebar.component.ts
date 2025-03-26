// sidebar.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import {CommonModule} from '@angular/common'

@Component({
  selector: 'app-sidebar',
  standalone: true, // Make it standalone
  imports: [CommonModule], // Import CommonModule for ngFor and ngIf
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  @Input() isSidebarClosed = false;
  @Input() activeMenuItem: string | null = null;
  @Input() subMenuStates: { [key: string]: boolean } = {};
  @Input() menuItems: any[] = [];

  @Output() toggleSidebarEvent = new EventEmitter<void>();
  @Output() toggleSubMenuEvent = new EventEmitter<string>();
  @Output() menuItemClicked = new EventEmitter<string>();

  toggleSidebar(): void {
    this.toggleSidebarEvent.emit();
  }

  toggleSubMenu(menuItemKey: string): void {
    this.toggleSubMenuEvent.emit(menuItemKey);
  }

  onMenuItemClicked(item: any): void {
    this.menuItemClicked.emit(item.key);
  }
}