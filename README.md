# EnStrap.int

EnStrap.int is a user-friendly web-based application designed to integrate and visualise KEGG pathways with time-series differential gene expression data, focusing on uncovering metabolic flux changes. This application allows users to upload their gene expression data, including an annotation file, to generate dynamic metabolic pathway maps, explore pathway-level regulation patterns over time and under different experimental conditions, filter results by gene families or contrasts, and export the resulting visualisations for downstream use. 
The tool aims to empower researchers, especially those without programming expertise, to explore pathway-level changes over time and across experimental conditions.  

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.3. For more information refer to the official [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page. The application was built using TypeScript/JavaScript for logic and functionality, HTML for structuring web content, and CSS for styling and layout.

## Table of Contents

- [EnStrap.int](#enstrapint)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
    - [Cloning the Repository](#1-cloning-the-repository)
    - [Installing Dependencies](#2-installing-dependencies)
    - [Starting the Application](#3-starting-the-application)
  - [EnStrap.int Test Data and File Format Requirements](#enstrapint-test-data-and-file-format-requirements)
    - [File Format Requirements ](#file-format-requirements)
  - [The Visualisation](#the-visualisation)
  - [Navigating EnStrap.int](#navigating-enstrapint)
    - [Welcome Page](#welcome-page)
    - [Guide Section](#guide-section)
      - [File Upload](#1-file-upload)
      - [File Menu](#2-file-menu)
        - [Import Extra Files](#a-import-extra-files)
        - [Export Pathway Visualisation](#b-export-pathway-visualisation)
      - [View Menu](#3-view-menu)
        - [Customise](#a-customise)
        - [Search](#b-search)
      - [Help Menu](#4-help-menu)
      - [Display Interaction](#5-display-interaction)
      - [Time Series](#6-time-series)
      - [Side Bar Functionality and Pathway Information](#7-side-bar-functionality-and-pathway-information)
  - [Hands-on Example](#hands-on-example)
    - [References](#references)  


## Installation 

To get the application up and running on users local machine, follow the steps below:

### 1. Cloning the Repository  
  Open the terminal or command prompt and run:  

  ```bash  
  git clone https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS.git
  ```

  Alternatively, you can clone the repository directly using VS Code.

- Open the Project in Your IDE  
  Navigate to the project folder and open it using your preferred IDE (e.g., VS Code).

- Navigate to the kegg_pathway Directory
  The app must be run from the kegg_pathway directory. Move into this directory by running:

  ```bash
  cd ./kegg_pathway
  ```

### 2. Installing Dependencies  
  In the terminal, run the following command to install all required dependencies:  

  ```bash
  npm install
  ```
### 3. Starting the Application  
  Once the installation is complete, start the application with:  

  ```bash
  npm start
  ```

  This will launch the app in your default web browser.
  
**Note:** Ensure that Node.js and npm are installed on your system follow instructions on the official [Node.js](https://nodejs.org/en/download/) download site.

## EnStrap.int Test Data and File Format Requirements  

When EnStrap.int is launched, the data for testing the app can be accessed via [Test Data Folder](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/tree/main/TestData) on GitHub. The tool supports files in .csv and .txt formats only. The data must include at least one *expression file* and its corresponding *annotation file*. 

### File Format Requirements  
The tool is designed to work with two types of files that contain different information, identified by specific column naming conventions.  

#### 1. Expression File Format:

a). *Required columns:*  
- A column named "gene" (for matching genes across files).
- A column named "log2foldchange" (for file identification).  

b). *Format considerations:*  
- Column names are case-insensitive (can be upper, lower, or mixed case).
- The "gene" column must contain string data.
- The "log2foldchange" column must contain numeric data.  

**Note:**  If the dataset includes time series data, each expression file should be named according to its corresponding time point (e.g., 1hr, Day1, Day12 or 30Mins).  

The below image shows two different expression file formats but both recognised by EnStrap.int.  

![ExpressionFile.png](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/READMEFile_Images/ExpressionFile.png)  
*Fig. 1a. Shows two different expression file formats.*    


#### 2. Annotation File Format:

a). *Identification criteria:*   
Must have at least **ONE** of the following:
- A column named "sequence.name" (for gene matching) **OR**
- A column named "annotation.go.id" **OR**
- A column named "enzyme.code" **OR**.
- **AND** a column with "enzyme" in its name (this is a must have, e.g.,"enzyme.code" contains this term).


b). *Format considerations:*
- Column names are case-insensitive (the tool converts all to lowercase for processing).
- All columns in the annotation file should contain string data.  

The system ensures compatibility by transforming all column names to lowercase before processing, allowing users to enter column names in any case format while maintaining the tool's functionality.  

The below image shows two different annotation file formats but both recognised and accepted by EnStrap.int.  

![ExpressionFile.png](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/READMEFile_Images/AnnotationFile.png)  
*Fig. 1b. Shows two different annotation file formats.*  

## The Pathway Visualisation     
  
The pathway visualization was developed using GoJS library, which provides powerful diagram creation capabilities for complex biochemical networks. The figure below illustrates a representative example of the pathway visualization interface with its key elements.   

![Visualisation_Image](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/READMEFile_Images/Visualisation_Image.png)  
*Fig. 2. Shows example of pathway elements.*  


### Visualisation Features  

**Linked Pathway:** Represented by the light blue rectangular box labelled (**A**), this element serves as a gateway to another pathway visualization. Clicking on this interactive element opens a pop-up window which contains informationabout the pathway but also allows users to navigate to related metabolic pathways, facilitating comprehensive exploration of interconnected biochemical processes as below in [Display Interaction](#5-display-interaction).    

**Enzyme:** Depicted by rectangular boxes such as the one labelled (**D**), enzymes are colour-coded to reflect differential gene expression levels. The colour spectrum transitions from blue (**J**) to red (**B**), indicating varying degrees of expression. Gray enzymes (**D**) signify neutral expression levels, indicating no significant change in gene activity. The legend (**F**) in the bottom corner provides a complete reference for interpreting these colour variations.    

**Compound:** Illustrated by gray circles (**C**), these elements represent metabolites or chemical compounds that participate in the biochemical reactions within the pathway.    

**Directionality:** The flow and reversibility of reactions are indicated by arrows (**G**) and (**H**) along with distinctive line styles. Reversible reactions are represented by segmented lines, while irreversible reactions are depicted with solid straight lines. These directional indicators convey crucial information through both their colour and size. The colour reflects the differential expression of the associated genes, while the arrow size corresponds to the relative log2fold change magnitude of that particular pathway segment. As evidenced by arrows (**G**) and (**H**), both colour intensity and arrow dimensions vary to represent different expression levels and fold changes between conditions.  

**Pathway Magnifier:** The users can zoom in if they click on the **+** or out if they click on the **-** sign. The feature labeled (**I**) functions as a navigation aid, allowing users to view the specific regions of interest within the pathway visualization. This feature enhances the examination of complex pathway sections by providing detailed views of selected areas.    

## Navigating EnStrap.int

### Welcome Page  

![Welcome Page](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/READMEFile_Images/Welcome_Page.png)  
*Fig. 3. Users welcome page.*  

The welcome page is the first screen users will see when they launch the EnStrap.int application.

- Clicking "Get Started" button (**A**) navigates to the Upload Page, where users can submit their data (expression and annotation files).
- Clicking "Open Project" button (**C**) allows the user to open a project that was saved earlier on.
- The "Guide" Button (**B**) opens the User Guide, providing an overview of EnStrap.int’s features and how to use them.  

### Guide Section  

![Guide Page](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/READMEFile_Images/Guide_Page.png)  
*Fig. 4. Users guide page.* 

The guide provides detailed instructions on how to use the key features of EnStrap.Int, which includes:

- File Upload
- Customisation and Search
- Interaction Display
- Adding Files
- Exporting Pathways
- Opening, Saving and Starting a Project
- Time Series Analysis
- Side bar and Pathway Information

Clicking "Get Started" button (**C**) in (**Fig. 4**) will take you to the File Upload page, just like "Get Started" Button (**A**) in (**Fig. 3**).  

#### 1. File Upload  

![Upload Image1](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/READMEFile_Images/Upload_Image1.png)  
*Fig. 5a. Initial file upload page.* 

This is where the user uploads the data files:  

##### **Upload Users Files**
Click "Upload" button (**A**), as previously described in the [EnStrap.int Test Data and File Format Requirements](#enstrapint-test-data-and-file-format-requirements) section, the user must upload at least one expression file and one annotation file to proceed. Clicking "Open Project" button (**D**) will open an already saved project, just like "Open Project" Button (**C**) in (**Fig. 3**).    


##### **Access Upload Instructions**
In case the user is unsure about the type of files to upload, click the information icon (**B**) at the top-right corner for guidance.  In addition, at the bottom of the "Upload Files" (**A**) button, there is description of what files the user is supposed to load and an indication of whether the files were loaded or not.   


![Upload Image2](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/READMEFile_Images/Upload_Image2.png)  
*Fig. 5b. Managing Uploaded Files and Configuring Options.*  

##### **Manage Uploaded Files**
After uploading the files, they will be separated into "Annotation Files" and "Expression Files". If the user has uploaded multiple time-series expression files they can be ordered by drag and drop option.  
Just as in [File Upload](#1-file-upload) there is a description on top of the page labelled (**D**) which tells the users what files they have uploaded, if a certain file is missing it will show a **X not uploaded**.  

- To remove a file, click the **X** button (**C**) next to it.
- To add more files, simply click the "Upload Files" button again.  

##### **Configure Settings**
User can customise how the data will be processed by adjusting the following options:  

##### a). **Number of Top-Expreesed Pathways:**  
   - Enter the desired number of pathways or use the up/down arrows (**E**) to specify how many of the top-expressed KEGG pathways should be visualised, the defualt value is 10.  

##### b). **Organism Specification:**  
   - The user can choose to specify the organism or not (**A**).

##### c). **Time Series Data:**  
   - User must indicate whether the dataset includes time series analysis (**A**) or not.
   
##### **Process and Visualise**
Click the "Process" button (**F**) once all settings are configured to generate visualisations of the KEGG pathways.


#### 2. File Menu 

![ExtraFile Image1](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/READMEFile_Images/ExtraFile_Image1.png)   
*Fig. 6a. File menu options.*  

To access file-related options, click the "File" menu (**A**) located in the top menu bar.
   
##### a). Manage Files  
Click "Manage Files" (**B**) which will open a pop-up window where the user can add expression files. Take note that **only expression files are accepted here-annotation files are not supported**. 
        

![ExtraFile_Image2](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/READMEFile_Images/ManageFile_Image.png)  
*Fig. 6b. Upload extra files page*

- In the pop-up window, click "+Add Expression Files" (**G**), the user can select multiple expression files.
- The user may also wish to remove expression files that were initially uploaded, by clicking the **X** icon labelled next to the file name (**I**). Once removed, the file will appear below the “Add Expression Files” button, along with a “Restore” option labelled (**J**) in case the user changes their mind.
-  Order of the expression files can be changed by drag and drop option, if the user wishes to see them in a different order on the [Time Series](#6-time-series).
- Once user is happy with the changes they have made to the expression files, by clicking the "Apply Changes" button (**D**) the files will be uploaded and that will trigger reprocessing the mapping and displaying the previously selected number of top pathways from all expression files.  

##### b). New Project  
Clicking the “New Project” button (**C**) will restart EnStrap.int and take the user to the [File Upload](#1-file-upload) page . If the user was currently working on an unsaved project, it will be lost if the user confirms the alert.    

##### c). Open Project  
Clicking the “Open Project” button (**D**) will open the file browser, allowing the user to open a project that was previously saved.    

##### d). Save Project  
Clicking the “Save Project” button (**E**) opens the pop-up window shown below:      
![SaveProjectImage](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/READMEFile_Images/SaveProjectImage.png)   
*Fig. 6c. Pick a name for a project and save it.*  

The user can enter a project name in the text field labelled (**K**), and then choose to either click “Save” (**L**) to store the project or “Cancel” (**M**) to close the window without saving.  

##### e). Export Pathway Visualisation  
Click on the "Export" button in the [File Menu](#2-file-menu) dropdown (**E**) to access the export feature functionalities.

![Export_Image](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/READMEFile_Images/Export_Image.png)  
*Fig. 6d. Export image options.*  

   **Choose Export Format**  
   The user will have two options to export the visualisation, as either **PNG** format (**G**)  or **SVG** format (**H**), by clicking the desired format it will save the image in the /Downloads folder on users device with the chosen extension.    

#### 3. View Menu     

To access view-related options, click the "View" menu (**A**) located on the top of the menu bar.  

![View TopBar](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/View_TopBar.png)  
*Fig. 7a. View menu options.*  

##### a). Customise  

##### i). Open Customisation  
- Click the "Customise" button (**B**) to open the customisation panel, which will appear on the left side of the application window as a tab in the side bar.       
  
![View Customise](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/READMEFile_Images/View_Customise.png)  
*Fig. 7b. The customisation page.*    

##### ii). Change Colours  
The user can modify the colours used to represent up or down regulated genes and paralogs:
- Click the coloured box (**F**) to open the colour picker.
- Select your desired colour from the palette.    

##### iii). Close the Colour Picker
Once the user has selected the colour and is satisfied with the choice, simply click anywhere outside the colour picker to close it and this will apply your colour of choice to the visualisation.    

##### iv). Close Customisation Tab
- To remove the customisation panel for the side bar, click the **X** button located in the top-right corner of the tab (**H**).
- To just close the tab and keep it in the side bar, click on any other tab available on the side bar - Pathway or Search tab (if exists in the side bar).    

##### b). Search 
To access the search options user should go to the [View Menu](#3-view-menu) (**A**) at the top bar. To open the search panel, click "Search" button (**C**) which will display two options:  
  
###### i). *Search For Pathway Elements*  
If the user would like to search by elements within the pathway, click  "Pathway Elements" button (**D**). This will open a search options on the left side of the application window (as a tab in the side bar).  

![View SearchForElements](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/READMEFile_Images/View_SearchForElements.png)  
*Fig. 7c. Pathway elements page.*    

Within the panel, the user can choose from three search categories: **Enzyme, Compound and Pathway** by ticking the box next to the desired option (**I**), this will display a drop-down list within a chosen category.  

  **For example:**
  If the user select the **Enzyme** labelled (**I**), a drop-down box (**J**) will appear displaying a list of enzymes in the current pathway. The user can scroll down through the list and click on a specific enzyme to zoom into it within the visualisation display, it will appear with a blue highlight.    


###### ii). *Search For Pathway*  

If the user wants to search for a specific pathway: Below the "Pathway Elements" button (**D**) in the "Search" panel (accessed via the [View Menu](#3-view-menu)), click on the "For Pathway" button (**E**). Ihis will open a pop-up window containing two tabs that will allow user to search and navigate to different pathways.   

![View_SearchForPathway_Highlight](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/READMEFile_Images/View_SearchForPathway_Highlight.png)  
*Fig. 7d. Display pathways with hits and all KEGG pathways online.*   

**Highlight Tab:**
- This tab displays a table listing all pathways where hits were found in the uploaded expression files; those colored in grey (**P**) are the pathways already present in the display (the top-ranked pathways). The pathways are listed together with their "Pathway number" and the number of differentially expressed "Enzymes". Information about the total number of pathways and the number of pathways currently selected is shown above the table.
- To select pathways, tick the boxes in the "Select" column of the table (**L**) and to deselect a pathway, simply click the checkbox again.
- Use the "Select All" and "Clear All" buttons (**M**) to quickly select or deselect all pathways.
- Once user is satisfied with the selection,, click the "Search" button (**N**) to add the chosen pathways to the end of the pathway list in the side bar, and the added pathways will be highlighted in blue.       

**All KEGG Online Search Tab**  

![View_SearchForPathway_AllKEGG](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/READMEFile_Images/View_SearchForPathway_AllKEGG.png)   
*Fig. 7e. Online KEGG pathway search page.*  

The KEGG Online Search tab allows users to search for pathway names directly from the KEGG API by typing into the "Search Pathway Box" labelled (**U**).  

- As the user begins typing, a list of matching pathway names will appear below the search box.  
- To add the pathway, simply click on its name and it will be added to the list beneath the search box (**P**).
- To remove a particular pathway, click on **X** next to its name.
- Once the desired pathways are selected, click the "Search" button (**R**) at the bottom of the page to add them to the end of the pathway list in the Side bar. The user can add multiple pathways.

*Important things to note for the user:* 
- The pop-up window can be resized by dragging its bottom-right corner, allowing for a more comfortable view of the pathway table.
- Only one tab can be active at a time. Switching between tabs (**K**) or (**O**), will reset any selections made in the previously opened tab.    

#### 4. Help Menu   
The Help Menu provides access to the [Guide Section](#guide-section), which users can refer to if they are unsure how to use a specific feature-especially when they are on the main application window rather than on the [Welcome Page](#welcome-page).   


#### 5. Display Interaction    
The figures illustrate the interactive features of the visualisations.  

##### a). Pathway Dynamic Hyperlink  
When a user clicks on a linked pathway name — for example, the one labeled (**A**) in the visualisation — the application dynamically renders the selected pathway. See figure below:  

![InteractivityHyperlink_Image2](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/InteractivityHyperlink_Image2.png)  
*Fig. 8a. Navigation from pathway name to pathway visualisation.*   

##### b). Pop-up Windows  

![Interactivity_Image1](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/READMEFile_Images/Interactivity_Image1.png)       
*Fig. 8b.  Interactivity visualisation.*       

i). *Enzyme:*  
Click on the "Enzyme" label (**B**), it opens a pop-up window displaying detailed information about the selected enzyme, which includes: 
- Enzyme name.
- Enzyme code (EC).
- Mean logFC.
- Associated gene(s), including paralogs where applicable logFC value.
- A hyperlink that takes the user to KEGG database where more information about that particular enzyme can be found.  

ii). *Compound:*  
Clicking on a "Compound" label (**C**) opens a pop-up window with details about the selected compound, which includes:

- Enzyme code
-  A hyperlink that takes the user to KEGG database where more information about that compound can be found.      
 
#### 6. Time Series  
![TimeSeries_Image1](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/READMEFile_Images/TimeSeries_Image2.png)   
*Fig. 9. Time series and animation display.*    

The figure above illustrates how users can explore different time points, with names as labeled in the uploaded expression files, by using the slider (**A**) to move through the different time points and observe how the pathway changes over time.  

To create a timelapse animation of the pathway across all time points, click the "Animate" button (**B**). The animation will sequentially display changes across each time point, providing a dynamic view of pathway evolution.  

#### 7. Side Bar Functionality and Pathway Information      
##### a). Side Bar Functionality  
![SideBar_Image0](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/READMEFile_Images/SideBar_Image0.png)  
*Fig. 11a. Side bar functionality.*     

The sidebar, located on the left side of the interface, displays a list of top-expressed pathways labelled (**A**) in **Fig. 11b.** The number of pathways shown corresponds to the value specified earlier by the user on the [File Upload](#1-file-upload) page (see **Fig. 5b**). In addition to displaying the top pathways, the sidebar also indicates the total number of pathways in which expression hits were detected which can be accessed by clicking "See All" button or by going to View -> Search -> For Pathway.    

![SideBar_Image1](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/READMEFile_Images/SideBar_Image1.png)      
*Fig. 11b. Sorting pathways and expanding/collapsing the side bar.*    

**Sorting Pathways:** To sort pathways, click the "Sort" button (**B**) which opens a dropdown menu with four main sorting options; in alphabetical order, either ascending or descending sequence, and by the differentially expressed enzymes (from highest to lowest or vice versa).  

**Expanding and Collapsing the Side Bar:** For the user to collapse the side bar and expand the main display view, click the arrows at the top right corner (**C**). To reopen the side bar, click the same arrows on the collapsed bar (**D**).   

![SideBar_Image2](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/READMEFile_Images/SideBar_Image2.png)   
*Fig. 11c. Merging tabs within the side bar.*     

If the [Search](#b-search) and [Customise](#a-customise) tabs are added to the side bar, the user can easily switch between them by clicking the relevant icon or section name. The currently active section will have its icon highlighted (**E**).    

To close the [Search](#b-search) and [Customise](#a-customise) sections, click on the **X** button (**F**) at the top right of each section. Closing a section automatically reverts to the "Pathways" section, which is the default view.  

**Note:** The "Pathways" section cannot be closed as it is the defualt view of the sidebar.  

#### b). Pathway Information  

![StatsDisplay](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/READMEFile_Images/StatsDisplay.png)    
*Fig. 11d. Summary of the visualised pathway.*     

The panel displayed at the bottom of the screen provides key information about the currently visualised pathway. This includes:
- The name of the pathway currently being viewed.
- Name of the contrast file/Time point you currently in.
- The total number of genes present in the pathway.
- The number of unique genes represented in the visualisation.
- The number of enzymes differentially expressed in the pathway being visualised.   

## Hands-on Example   

This section demonstrates how a user can explore and interact with data using EnStrap.int, step-by-step, using a real dataset as an example.  

**Objective:** To view genes that were downregulated in the Glycolysis/Gluconeogenesis pathway on the second day after treatment (expression file in Contrast2), in response to heat stress. We will use the data in the [Test Data Folder](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/tree/main/TestData) on GitHub.   

### Step 1: Uploading Data  

![HandsOn_Upload](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/READMEFile_Images/HandsOn_Upload.png)  
*Fig. 12. The EnStrap.int upload page showing file selection.*  

Navigate to the "Upload Files" page and upload three expression files and the annotation file. Once uploaded you can drag and drop the exppression files to put them in the desired order (to be viewed on the time-series slider).  

The user will have to specify the number of pathways to be displayed (11 in this case), whether the dataset contains time series data or not (in our case it contains a time-series) and whether it is from an organism /plant (plant in our case). After completing the selections, the user can click the “Process” button to begin data integration and analysis.  

### Step 2: Visualising Pathways
Once processed, a list of pathways is displayed in the sidebar. Selecting a pathway (e.g., “Glycolysis / Gluconeogenesis”) opens an interactive visualisation, which shows expression changes with colour-coded enzymes, compounds (grey circle) and linked pathways (blue rectangles).  

![HandsOn_Visualisation](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/READMEFile_Images/HandsOn_Visualisation.png)  
*Fig. 13. The list of pathways with the Glycolysis/Gluconeogenesis pathway.*  

The number of differentially expressed enzymes in the information about the pathway includes both high and low.    

### Step 3: Exploring Additional Files  
![HandsOn_ManageFiles](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/READMEFile_Images/HandsOn_ManageFiles.png)   
*Fig. 14. Illustrates the process of adding extra expression files after the initial upload.*  

To add more expression files (Contrast 6 and 12), go to the file menu and click on "Manage Files", then "Add Expreesion Files". You can orders the files by "drag and drop", the newly added files will appear in a green colour at the bottom of the expression files initially loaded.  
If the user applies the changes another pop-up window will appear, showing the "Top Pathways Comparison Summary", which includes the pathways added, similar and removed from the top 11 enriched pathways on the display (in other words, it compares old top enriched pathways and new [with new added files] top enriched pathways). After clicking the “Okay” button, the updated list of “Pathways” will be displayed, including any newly added pathways. Users can observe the change by noting the updated number of pathways listed beneath the “Pathways” sidebar, which in this case increased from 126 to 130 (see **Figure. 15** below).   

![HandsOn_NewPathwaylist](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/READMEFile_Images/HandsOn_NewPathwaylist.png)  
*Fig. 15. Shows the inital list before adding extra files and the new list after adding extra files.*  

### Step 4: Tracking Changes Over Time  

Use the time slider to move between different time points (e.g., Contrast 0, Contrast 1, Contrast 2) and observe how the visualised pathway changes in time due to heat stress.  

![HandsOn_TPCOmparison](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/READMEFile_Images/HandsOn_TPCOmparison.png)
*Fig. 16. Time slider.*  

As shown in the figure above:
•	At Time Point 1 (**Contrast0**):  At Contrast 0, 23 genes are involved, with 8 enzymes differentially expressed.
•	A Time Point 2 (**Contrast1**): The response appears to subside, with 43 genes and 12 differentially expressed enzymes after Contrast 1.
•	At Time Point 3 (**Contrast2**): At Contrast 2, the number of affected genes increases significantly to 74, with 13 enzymes showing differential expression, indicating a stronger transcriptional response at this stage. Note that most of the enzymes are coloured purple (13), which indicates that they are downregulated/lowly expressed.

### Step 6: Searching for Downregulated Enzyme

You may wish to search for a downregulated enzyme within the Glycolysis pathway on day 2. You can click on the "View menu", then "Pathway Elements" then tick the "Enzyme" checkbox and search for the "phosphoglycerate mutase" which upon selection will appear in the display with a blue highlight. You can click on te enzyme a pop-up window will appear and if you want more information about the enzyme click on the "View on KEGG" hyperlink which will take you to the KEGG database.  

![HandsOn_Enzyme](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/READMEFile_Images/HandsOn_Enzyme.png)  
*Fig. 17. Searching for the enzyme phosphoglycerate mutase(PGM).*   

### Step 7: Searching for Pathways
You may also search for addition pathways that were not intially in the top pathways displayed (the 11 pathways selected at the initial upload). Click on the "Search" button in the [View Menu](#3-view-menu) and choose the "For Pathway" option.

#### Highlight Tab  
We will add the "Pyruvate metabolism" and "Fructose and mannose metabolism" pathways. Once there are selected, they will be appended at the end of the pathway list in the display highlighted in blue.   

![HandsOn_Highlighted](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/READMEFile_Images/HandsOn_Highlighted.png)
*Fig. 18. Search for pathways that are not included in the top-ranked display list.*  

#### KEGG Online  

The user can click on "KEGG Online" tab to search through the KEGG database, when the pathway is added to the list just like above it will be highlighted in blue.  

![HandsOn_KEGG](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/READMEFile_Images/HandsOn_KEGG.png)
*Fig. 19. Searching for pathways online via KEGG.*  

### References

Kourani, M., Anastasiadi, M., Hammond, P. J., Mohareb, F. (2024, September). Prolonged heat stress in *Brassica napus* during flowering negatively impacts yield and alters glucosinolate and sugars metabolism. bioRxiv. Accessed on May 4, 2025, from https://www.biorxiv.org/content/10.1101/2024.04.01.587615v2.



