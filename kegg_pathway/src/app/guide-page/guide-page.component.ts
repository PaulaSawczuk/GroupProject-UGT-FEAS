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
/**
 * The `GuidePageComponent` is responsible for displaying a guide page
 * with sections related to the application. It provides functionality
 * to navigate through different sections - Upload Page and Landing Page, view detailed content
 *
 * ### Key Features:
 * - Displays a list of guide sections with titles and previews.
 * - Allows users to open detailed content for each section.
 * - Provides navigation options to other parts of the application - Landing Page, Upload Page.
 */
export class GuidePageComponent {
  constructor(private router: Router) { console.log('GuidePageComponent loaded');}
  // Guide Content
  guideSections: GuideSection[] = [
    {
      title: 'File Upload',
      preview: 'To upload upload annotation and expression files...',
      fullContent: `[[IMAGE_1]]
      <strong>Step 1: Upload Your Files</strong><br>
      Click the “Upload” button <strong>(A)</strong> to select your files. You need at least one expression file and one annotation file to proceed.<br>
      <strong>Supported file formats:</strong> .csv and .txt.<br><br>

      <strong>Step 2: Access Information</strong><br>
      You will also be displayed with the check information if the required files were uploaded or not <strong>(C)</strong><br>
      But if you're still unsure about which files to upload, click the information button <strong>(D)</strong> at the top-right corner for guidance.<br><br>

      <strong>Open Project</strong><br>
      To open a project, click the “Open Project” button <strong>(B)</strong>.<br>
      <li>This will open a pop-up window where you can select the project file to upload.</li>
      <li>Once selected, the project file will be uploaded and you will be redirected to Display Page.</li>

      [[IMAGE_2]]
      <strong>Step 3: Manage Uploaded Files</strong><br>
      Upon uploading, you'll see a list of all selected files separated in two groups - Annotaion File List <strong>(E)</strong> and Expression File List <strong>(F)</strong> .<br>
      <li>To remove a file from the list, click the x button <strong>(G)</strong> next to the file.</li>
      <li>To change an order of your time points, drag the expression file to the designed location and drop it. You will be able to change the order of the files later on as well.</li>
      <li>To add additional files, click the “Upload” button again. You can upload more files at any time.</li><br>

      <strong>Step 4: Configure Settings</strong><br>
      You will see three settings options:<br><br>

      <strong>Number of Top-Expressed Pathways:</strong><br>
      <li>Enter the desired number or adjust it using the up or down arrows <strong>(I)</strong>.</li><br>

      <strong>Organism Specification:</strong><br>
      <li>Choose whether to specify an organism. <em>(Note: This feature is not yet implemented.)</em></li><br>

      <strong>Time Series Data:</strong><br>
      <li>Indicate if your data includes time series analysis <strong>(H)</strong>.</li><br>

      <strong>Final Step: Process and Visualise</strong><br>
      Once all settings are configured, click the “Process” button <strong>(J)</strong> to generate visualisations of the KEGG pathways.`,
      imagePaths: ['assets/newImg/Upload1.png', 'assets/newImg/Upload2.png'],
    },
    
    {
      title: 'Manage Files, Imports and Exports',
      preview: 'To upload extra files, open/save projects or export a mapping view...',
      fullContent: `[[IMAGE_1]]
                    <h3>File Management: Upload Extra Expression Files, Remove Files and Reorder Timepoints</h3>                 
                    <strong>Step 1: Open File Manager</strong><br>
                    At the top bar, click the <strong>File</strong> button <strong>(A)</strong>.<br>
                    And then click Manage Files <strong>(B)</strong> which will desplay a File Manager Modal <br><br>
                    [[IMAGE_2]]

                    <strong>Step 2: Manage Files</strong><br>
                    Manage Files modal contains two lists - Uploaded Annoatnion files <strong>(G)</strong> and Uploaded Expression Files <strong>(H)</strong> for which you can:<br>
                    
                    <h4>Upload Extra Expression Files</h4>
                    Click <strong>+ Add Expression Files</strong> button. A pop-up window will appear, allowing you to upload additional expression files if needed.<br>
                    <li>You can import multiple expression files</li>
                    <li>The new Expression files will be added to the list of Expression files and marked as green <strong>(I)</strong> </li><br>
                    
                    <h4>Remove Expression Files</h4>
                    To remove files from the Expression List click the x button next to the file from the list <strong>(J)</strong>.<br>

                    <h4>Reorder Expression Files</h4>
                    To reorder the expression files, drag the file to the desired position in the expression list and drop.<br>
                    
                    <strong>Step 3: Save the Changes</strong><br>
                    Once you are satisfied with the list of files, click the <strong>Apply Changes</strong> button <strong>(M)</strong>.<br>
                    <li>This will reprocess the mapping and display the previously chosen number of top pathways from all expression files.</li>
                    
                    <h3>Open, Save and Start a Project</h3> 
                    
                    <h4>Open Project</h4>
                    
                    <strong>Step 1: Open Project</strong><br>
                    Click the <strong>File</strong> button <strong>(A)</strong> at the top bar.<br>
                    Then click the <strong>Open Project</strong> button <strong>(D)</strong>.<br>
                    
                    <strong>Step 2: Select Project File</strong><br>
                    A pop-up window will appear, allowing you to select the project file to upload.<br>
                    Once selected, the project file will be uploaded and you will be redirected to Display Page.<br>
                    
                    <h4>Save Project</h4>

                    <strong>Step 1: Save Project</strong><br>
                    Click the <strong>File</strong> button <strong>(A)</strong> at the top bar.<br>
                    Then click the <strong>Save Project</strong> button <strong>(E)</strong>.<br>
                    
                    <strong>Step 2: Specify Project Name</strong><br>
                    A pop-up window will appear, allowing you to set a project name to save the project file as.<br>
                    Once selected, the project file will be saved under chosen name into your <strong>Downloads</strong> folder.</li><br>
                    
                    <h4>Start New Project</h4>
                    
                    <strong>Step 1: Start New Project</strong><br>
                    Click the <strong>File</strong> button <strong>(A)</strong> at the top bar.<br>
                    Then click the <strong>New Project</strong> button <strong>(C)</strong>.<br>
                    
                    <strong>Step 2: Confirm New Project</strong><br>
                    A pop-up window will appear, asking you to confirm if you want to start a new project.<br>
                    <li>This will remove all previously uploaded files and settings.</li>
                    <li>Click <strong>Yes</strong> to proceed.</li>
                    <Li>You will be redirected to the upload page from where you can start a new.</li><br>

                    <h3>Export Pathway Visualisation</h3>     
                    
                    <strong>Step 1: Access Export Options</strong><br>
                    Go to the <strong>File</strong> menu at the top bar <strong>(A)</strong>.<br><br>

                    <strong>Step 2: Initiate Export</strong><br>
                    Click the <strong>Export</strong> button in the dropdown <strong>(F)</strong>.<br><br>

                    <strong>Step 3: Choose Export Format</strong><br>
                    <li>You will have two options to export the image: <strong>PNG</strong> and <strong>SVG</strong>.</li>
                    <li>Click your desired format.</li><br>`,
                   imagePaths: ['assets/newImg/TopBar1.png','assets/newImg/FileManagement.png']
    },
    {
      title: 'Customise / Search',
      preview: 'To Customise visualiastion and Search for elements...',
      fullContent: `[[IMAGE_1]]
                    <h3>Customise the Colours of Certain Nodes on the Display</h3>
                    <strong>Step 1: Access the View Options</strong><br>
                    Go to the <strong>View</strong> menu <strong>(A)</strong> at the top bar.<br><br>

                    <strong>Step 2: Open Customisation</strong><br>
                    Click the <strong>Customise</strong> button <strong>(B)</strong>.<br>
                    <li>This will open a tab on the left side of the website with customisation options.</li><br>
                    [[IMAGE_2]]
                    <strong>Step 3: Change Colours</strong><br>
                    You can change the colours of up or down regulated genes and Paralogs:<br>
                    <li>Click the coloured box <strong>(F)</strong> to open a colour picker.</li>
                    <li>Pick a desired colour from the colour picker.</li><br>

                    <strong>Final Step: Close the Colour Picker</strong><br>
                    Once satisfied with the colour choice, click outside the colour picker to close it.<br><br>

                    <strong>To Close the Customisation Tab:</strong>
                    Click the <strong>x</strong> button in the top right corner of the tab <strong>(H)</strong>.
                    
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
                    <li>To select pathways, click the tick boxes in the <strong>Select</strong> column of the table <strong>(L)</strong>. You can select multiple pathways. The grayed out pathway indicate pathways that are already within your display.</li>
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
        imagePaths: ['assets/newImg/TopBar2.png', 'assets/newImg/Customise.png', 'assets/newImg/SearchForElements.png', 'assets/newImg/SearchPatwayHighlight.png', 'assets/View_SearchForPathway_AllKEGG.png' ]
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
        imagePaths: ['assets/newImg/TimeSliderPage.png','assets/newImg/TimeSlider.png']
    },
    {
      title: 'Display Interaction',
      preview: 'Display Interaction and Functionality...',
      fullContent:
        `<h3>Display Elements</h3>
        [[IMAGE_1]]
        <li><strong>Linked Pathway:</strong> Represented by the light blue rectangular box labeled <strong>(A)</strong>, this element serves as a gateway to another pathway
        visualisation. Clicking on this interactive element opens up a popout with a button that allows to navigate to related metabolic pathways</li>

        <li><strong>Enzyme: </strong> Rectangular boxes such as the one labeled <strong>(I)</strong>, enzymes are color-coded to reflect differential gene expression levels. The color
        spectrum transitions from in this case blue <strong>(C)</strong> for downregulation to red <strong>(B)</strong> upregulation (however it can be changed see Customisation
        section of this guide), indicating varying degrees of expression. Gray enzymes <strong>(I)</strong> signify neutral expression levels, indicating no significant change in gene
        activity. The legend <strong>(J)</strong> in the bottom corner provides a complete reference for interpreting these color variations. </li>

        <li><strong>Paralogs: </strong> Another boxes that is colour separated from the others are Paralogs <strong>(D)</strong> here represented in yellow as default however it can
        be changed in the Customisation section in View. (See Customisation section of this guide)</li>
        
        <li><strong>Compound:</strong> Illustrated by gray circles <strong>(E)</strong>, these elements represent metabolites or chemical compounds that participate in the
        biochemical reactions within the pathway.</li>

        <li><strong>Directionality:</strong> The flow and reversibility of reactions are indicated by arrows <strong>(K)</strong> and <strong>(L)</strong> along with distinctive line
        styles. Reversible reactions are represented by segmented lines, while irreversible reactions are depicted with solid straight lines. These directional indicators convey crucial
        information through both their color and size. The color reflects the differential expression of the associated genes, while the arrow size corresponds to the relative log2fold
        change magnitude of that particular pathway segment. As evidenced by arrows <strong>(K)</strong> and <strong>(L)</strong>, both colour intensity and arrow dimensions vary to
        represent different expression levels and fold changes between conditions.</li>

        <li><strong>Pathway Magnifier:</strong> You can zoom in if they click on the + or out if they on the - sign <strong>(G)</strong>(It is also possible to zoom in and zoom out using
        computer mouse). The feature labeled <strong>(H)</strong> functions as a navigation mini map, allowing to view the specific regions of interest within the pathway visualisation.
        This feature enhances the examination of complex pathway sections by providing detailed views of selected areas.</li>​

        [[IMAGE_2]]
        <li><strong>Annoation Popout:</strong> After clicking on any kind of node you will be displayed with a pop-out window that contains annoation and possibility of viewing that
        element within Kegg <strong>(M)</strong>. In case of pathway nodes, in addition you get an option to navigate to this pathway within the app by clikcing <strong>Launch</strong>
        button <strong>(N)</strong></li>`,
        imagePaths: ['assets/newImg/Display.png', 'assets/newImg/popout.png']
    },
    {
      title: 'Side Bar / Pathway Information',
      preview: 'Side Bar Functionality and Pathway Information...',
      fullContent:
        `<h3>Side Bar Functionality</h3>

        [[IMAGE_1]]
        The Side Bar, located on the left side of the website, displays a list <strong>(A)</strong> of top-expressed pathways. The number of pathways displayed depends on the number previously selected by the user.<br><br>
        <li>Under the Pathway title side bar displays the total number of pathways that had hits within users data</li>
        <li>Also by clicking <strong>See All</strong> button <strong>(C)</strong> it will open the modal with all the pathways (see more in <strong>Customise / Search -> Search for Pathway -> Highlight</strong> section of this guide ) </li>
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
        <li><strong>Contrast/Time Point</strong></li>
        <li><strong>Total number of genes</strong></li>
        <li><strong>Number of unique genes</strong></li>
        <li><strong>Number of affected enzymes</strong></li>`,
        imagePaths: ['/assets/newImg/SideBarPage.png', '/assets/newImg/SideBar1.png', '/assets/newImg/SideBar2.png', '/assets/newImg/InformationPage.png']
    },
  ];
  // Move to Upload Page when 'Get Started' button is clicked
  getStarted(): void {
    this.router.navigate(['/upload']);
  }

  selectedSection: GuideSection | null = null;
  
  // Open the modal with the selected guide section
  openModal(section: GuideSection): void {
    this.selectedSection = section;
  }
  // Close the modal
  closeModal(): void {
    this.selectedSection = null;
  }
  // Navigate back to the Landing Page
  goBackToLanding(): void {
    this.router.navigate(['/']);
  }
  // Format the content in the modals to accomodate images and text
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
