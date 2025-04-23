import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { slideUpAnimation } from '../helper/route-animations';

interface GuideSection {
  title: string;
  preview: string;
  fullContent: string;
  imagePaths?: string[];
}

@Component({
  selector: 'app-guide-page',
  standalone: true, 
  imports: [CommonModule], 
  animations: [slideUpAnimation],
  templateUrl: './guide-page.component.html',
  styleUrls: ['./guide-page.component.css']
})
export class GuidePageComponent {
  constructor(private router: Router) { console.log('GuidePageComponent loaded');}
  
  guideSections: GuideSection[] = [
    {
      title: 'File Upload',
      preview: 'To upload upload annotation and expression files...',
      fullContent: `[[IMAGE_1]]
      <strong>Step 1: Upload Your Files</strong><br>
      Click the “Upload” button <strong>(A)</strong> to select your files. You need at least one expression file and one annotation file to proceed.<br>
      <strong>Supported file formats:</strong> .csv and .txt.<br><br>

      <strong>Step 2: Access Information</strong><br>
      If you're unsure about which files to upload, click the information button <strong>(B)</strong> at the top-right corner for guidance.<br><br>

      [[IMAGE_2]]
      <strong>Step 3: Manage Uploaded Files</strong><br>
      Upon uploading, you'll see a list of all selected files.<br>
      <li>To remove a file from the list, click the x button <strong>(C)</strong> next to the file.</li>
      <li>To add additional files, click the “Upload” button again. You can upload more files at any time.</li><br>

      <strong>Step 4: Configure Settings</strong><br>
      You will see three settings options:<br><br>

      <strong>Number of Top-Expressed Pathways:</strong><br>
      <li>Enter the desired number or adjust it using the up or down arrows <strong>(E)</strong>.</li><br>

      <strong>Organism Specification:</strong><br>
      <li>Choose whether to specify an organism. <em>(Note: This feature is not yet implemented.)</em></li><br>

      <strong>Time Series Data:</strong><br>
      <li>Indicate if your data includes time series analysis <strong>(D)</strong>.</li><br>

      <strong>Final Step: Process and Visualize</strong><br>
      Once all settings are configured, click the “Process” button <strong>(F)</strong> to generate visualisations of the KEGG pathways.`,
      imagePaths: ['assets/Upload_Image1.png', 'assets/Upload_Image2.png'],
    },
    
    {
      title: 'Add Files / Export Pathway',
      preview: 'To upload extra expression files or export mapping view...',
      fullContent: `<h3>Import Extra Expression Files</h3>
                    [[IMAGE_1]]
                    <strong>Step 1: Initiate File Import</strong><br>
                    At the top bar, click the <strong>File</strong> button <strong>(A)</strong>.<br><br>

                    <strong>Step 2: Import Extra Files</strong><br>
                    Click <strong>import files</strong> <strong>(B)</strong>. A pop-up window will appear, allowing you to upload additional expression files if needed.<br><br>
                    [[IMAGE_2]]
                    <strong>Step 3: Upload Extra Files</strong><br>
                    Within the pop-up, click the <strong>upload files</strong> button <strong>(C)</strong>.<br>
                    <li>You can import multiple expression files. The files will be displayed in a list within the pop-up.</li>
                    <li>To remove an unwanted upload, click the x button next to the file from the list.</li><br>

                    <strong>Step 4: Finalise and Reprocess</strong><br>
                    Once you are satisfied with the list of files, click the <strong>Add</strong> button <strong>(D)</strong>.<br>
                    <li>This will reprocess the mapping and display the previously chosen number of top pathways from all expression files.</li>
                    
                    <h3>Export Pathway Visualisation</h3>
                    <strong>Step 1: Access Export Options</strong><br>
                    Go to the <strong>File</strong> menu.<br><br>

                    <strong>Step 2: Initiate Export</strong><br>
                    Click the <strong>Export</strong> button in the dropdown <strong>(E)</strong>.<br><br>

                    <strong>Step 3: Choose Export Format</strong><br>
                    <li>You will have two options to export the image: <strong>PNG</strong> and <strong>SVG</strong>.</li>
                    <li>Click your desired format.</li><br>

                    <strong>Final Step: Download File</strong><br>
                    Once the desired format is selected, the file will automatically download to your computer.<br>
                    <li>You can find it in your <strong>Downloads</strong> folder.</li>`,
                   imagePaths: ['assets/ExtraFile_Image1.png', 'assets/ExtraFile_Image2.png']
    },
    {
      title: 'Customise / Search',
      preview: 'To Customise visualiastion and Search for elements...',
      fullContent: `[[IMAGE_1]]
                    <h3>Customise the Colors of Certain Nodes on the Display</h3>
                    <strong>Step 1: Access the View Options</strong><br>
                    Go to the <strong>View</strong> menu <strong>(A)</strong> at the top bar.<br><br>

                    <strong>Step 2: Open Customisation</strong><br>
                    Click the <strong>Customise</strong> button <strong>(B)</strong>.<br>
                    <li>This will open a tab on the left side of the website with customisation options.</li><br>
                    [[IMAGE_2]]
                    <strong>Step 3: Change Colors</strong><br>
                    You can change the colors of highly or low-expressed genes and isoforms:<br>
                    <li>Click the colored box <strong>(F)</strong> to open a color picker.</li>
                    <li>Pick a desired color from the color picker.</li><br>

                    <strong>Final Step: Close the Color Picker</strong><br>
                    Once satisfied with the color choice, click outside the color picker to close it.<br><br>

                    <strong>To Close the Customisation Tab:</strong>
                    Click the <strong>x</strong> button in the top right corner of the tab (H).
                    
                    <h3>Search for Certain Elements in the Display</h3>

                    <strong>Step 1: Access the View Options</strong><br>
                    Go to the <strong>View</strong> menu <strong>(A)</strong> at the top bar.<br><br>

                    <strong>Step 2: Open Search Options</strong><br>
                    Click <strong>Search</strong> <strong>(C)</strong> and then <strong>Pathway Elements</strong> <strong>(D)</strong>.<br>
                    <li>This will open a tab on the left side of the website with search options.</li><br>
                    [[IMAGE_3]]
                    <strong>Step 3: Choose an Element Category</strong><br>
                    You will see three options: <strong>Enzyme</strong>, <strong>Compound</strong>, and <strong>Pathway</strong>.<br>
                    <li>Choose the option corresponding to the element you want to find within the current display.</li>
                    <li>Tick the box next to the desired option <strong>(I)</strong>.</li><br>

                    <strong>Step 4: Search for the Element</strong><br>
                    A drop-down box <strong>(J)</strong> will appear with a list of elements in the current pathway belonging to the selected category.<br>
                    <li>Scroll through the list to find the element you are looking for.</li>
                    <li>Click on the element to zoom into it in the Visualisation Display.</li><br>

                    <h3>Search for Pathway</h3>

                    <strong>Step 1: Access the View Options</strong><br>
                    Go to the <strong>View</strong> menu <strong>(A)</strong> at the top bar.<br><br>

                    <strong>Step 2: Open Search for Pathway</strong><br>
                    Click the <strong>Search</strong> button <strong>(C)</strong>, then click <strong>Pathway</strong> <strong>(E)</strong>.<br>
                    <li>This will open a pop-out with two tabs for searching pathways.</li><br>
                    [[IMAGE_4]]
                    <strong>Highlight Tab <strong>(K):</strong></strong><br>
                    <li>Displays a table listing all the pathways where uploaded expression files found hits.</li>
                    <li>See information on the total number of pathways and how many you have selected above the table.</li>
                    <li>To select pathways, click the tick boxes in the <strong>Select</strong> column of the table <strong>(L)</strong>. You can select multiple pathways.</li>
                    <li>To unselect a pathway, click the tick box again.</li>
                    <li>Use the <strong>Select All</strong> and <strong>Clear All</strong> buttons <strong>(M)</strong> to quickly select or clear selections.</li>
                    <li>Once satisfied with your selections, click <strong>Search</strong> <strong>(N)</strong> to add these pathways to the end of the pathway list in the Side Bar.</li><br>
                    [[IMAGE_5]]
                    <strong>All KEGG Tab <strong>(O):</strong></strong><br>
                    <li>Allows searching for a pathway avaiable in KEGG API by typing the pathway name in the <strong>Search Pathway Box</strong> <strong>(U)</strong>.</li>
                    <li>A list of matching pathways to the search term will appear below the search box.<br>
                    <li>To add a pathway, click its name; it will be added to a list below the search box <strong>(P)</strong>.</li>
                    <li>You can add multiple pathways. To remove a pathway, click the <strong>x</strong> next to its name.</li>
                    <li>Once happy with the selection, click <strong>Search</strong> to add the pathways to the end of the pathway list in the Side Bar.</li><br>

                    <strong>Note:</strong><br>
                    1. The pop-out can be resized by dragging the bottom right corner for a more comfortable view of the table.<br>
                    2. Only one tab can be used at a time. Switching tabs will reset the selections in the closed tab.<br>
                    `,
        imagePaths: ['assets/View_TopBar.png', 'assets/View_Customise.png', 'assets/View_SearchForElements.png', 'assets/View_SearchForPathway_Highlight.png', 'assets/View_SearchForPathway_AllKEGG.png' ]
    },
    {
      title: 'Time Series',
      preview: 'Working with Time Series Data...',
      fullContent:
        `<strong>Working with Time Series Data</strong><br><br>

        If you have time series data, you can access tools to operate it at the bottom of the page, below the display.<br><br>
        [[IMAGE_1]]

        [[IMAGE_2]]
        <strong>Viewing Different Time Points</strong><br>
        <li>Use the <strong>slider</strong> <strong>(A)</strong> to move through different time points and see the display for each.</li><br>

        <strong>Creating a Timelapse</strong><br>
        - Click the <strong>Animate</strong> button <strong>(B)</strong> to create a timelapse of all the time points for a pathway.<br>
        - This will animate the display, showing all time points sequentially.<br>`,
        imagePaths: ['assets/TimeSeries_Image1.png','assets/TimeSeries_Image2.png']
    },
    {
      title: 'Display Interaction',
      preview: '...',
      fullContent:
        '',
        imagePaths: []
    },
    {
      title: 'Side Bar / Pathway Information',
      preview: 'Side Bar Functionality and Pathway Information...',
      fullContent:
        `<h3>Side Bar Functionality</h3>

        [[IMAGE_1]]
        The Side Bar, located on the left side of the website, displays a list <strong>(A)</strong> of top-expressed pathways. The number of pathways displayed depends on the number previously selected by the user.<br><br>
        
        [[IMAGE_2]]
        <strong>Sorting Pathways</strong><br>
        <li>Click the <strong>Sort</strong> button <strong>(B)</strong> to open a dropdown menu with sorting options for the list.</li><br>

        <strong>Expanding and Collapsing the Side Bar</strong><br>
        <li>To collapse the Side Bar and expand the Display View, click the arrows at the top right corner <strong>(C)</strong>.</li>
        <li>To reopen the Side Bar, click the same arrows on the closed bar <strong>(D)</strong>.</li><br>
        [[IMAGE_3]]
        <strong>Managing Tabs within the Side Bar</strong><br>
        If the <strong>Search</strong> or <strong>Customisation</strong> tabs are added to the Side Bar:<br>
        <li>Switch between options by clicking either the icon or the section name. The section icon will be highlighted <strong>(E)</strong> indicating the current section.</li>
        <li>To close the Search or Customisation sections, click the <strong>x</strong> button <strong>(F)</strong> at the top right of each section.</li>
        <li>Closing a section will automatically revert to the Pathway section, which is the default view.</li>
        <li>Note: The Pathway section cannot be closed as it is the default view of the Side Bar.</li><br>

        <h3>Information about the Pathway</h3>
        [[IMAGE_4]]
        Below the display, information about the pathway is shown, including:<br>
        <li><strong>Name</strong></li>
        <li><strong>Total number of genes</strong></li>
        <li><strong>Number of unique genes</strong></li>
        <li><strong>Number of affected enzymes</strong></li>`,
        imagePaths: ['/assets/SideBar_Image0.png', '/assets/SideBar_Image1.png', '/assets/SideBar_Image2.png', '/assets/StatsDisplay.png']
    },
  ];

  getStarted(): void {
    this.router.navigate(['/upload']);
  }

  selectedSection: GuideSection | null = null;

  openModal(section: GuideSection): void {
    this.selectedSection = section;
  }

  closeModal(): void {
    this.selectedSection = null;
  }

  goBackToLanding(): void {
    this.router.navigate(['/']);
  }

  splitContent(fullContent: string, imagePaths: string[] = []): { type: 'text' | 'image'; content: string }[] {
    const parts: { type: 'text' | 'image'; content: string }[] = [];
    const textParts = fullContent.split(/\[\[IMAGE_\d+\]\]/);
  
    textParts.forEach((textPart, index) => {
      if (textPart.trim()) {
        parts.push({ type: 'text', content: textPart.trim() });
      }
      if (imagePaths[index]) {
        parts.push({ type: 'image', content: imagePaths[index] });
      }
    });
  
    return parts;
  }
  
}
