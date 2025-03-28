import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DisplayComponent } from './display.component';
import { FileDataService } from '../services/file-data.service';


import { By } from '@angular/platform-browser';

describe('DisplayComponent', () => {
  let component: DisplayComponent;
  let fixture: ComponentFixture<DisplayComponent>;
  let fileDataServiceSpy: jasmine.SpyObj<FileDataService>;

  beforeEach(async () => {
    fileDataServiceSpy = jasmine.createSpyObj('FileDataService', ['getPathways']);
    
    // Mock pathways before creating the component
    fileDataServiceSpy.getPathways.and.returnValue(['Pathway A', 'Pathway B']);

    await TestBed.configureTestingModule({
      imports: [DisplayComponent], // Use `imports` for standalone components
      providers: [{ provide: FileDataService, useValue: fileDataServiceSpy }],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Trigger change detection to reflect updated pathways
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should display pathways if they exist', () => {
    const listItems = fixture.debugElement.queryAll(By.css('li'));
    expect(listItems.length).toBe(2);
    expect(listItems[0].nativeElement.textContent).toContain('Pathway A');
    expect(listItems[1].nativeElement.textContent).toContain('Pathway B');
  });

  it('should show a message when no pathways are available', () => {
    fileDataServiceSpy.getPathways.and.returnValue([]); // Simulate empty pathways
    fixture = TestBed.createComponent(DisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const message = fixture.debugElement.query(By.css('p'));
    expect(message.nativeElement.textContent).toContain('No pathways available to display.');
  });
});
