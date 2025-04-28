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

When EnStrap.int is launched, the data for testing the app can be accessed via [Test Data Folder on GitHub](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/tree/main/TestData). The tool supports files in .csv and .txt formats only. The data must include at least one *expression file* and its corresponding *annotation file*. 

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



#### 2. Annotation File Format:

a). *Identification criteria:*   
Must have at least **ONE** of the following:
- A column named "sequence.name" (for gene matching) **OR**
- A column named "annotation.go.id" **OR**
- A column named "enzyme.code" **OR**.
- BOTH a column with "go" in its name **AND** a column with "enzyme" in its name (e.g., "annotation.go.id" and "enzyme.code" or any other column names containing these terms).


b). *Format considerations:*
- Column names are case-insensitive (the tool converts all to lowercase for processing).
- All columns in the annotation file should contain string data.  

The system ensures compatibility by transforming all column names to lowercase before processing, allowing users to enter column names in any case format while maintaining the tool's functionality.

## The Pathway Visualisation     
  
The pathway visualization was developed using the GoJS library, which provides powerful diagramming capabilities for complex biochemical networks. The figure below illustrates a representative example of the pathway visualization interface with its key interactive elements.   

![Visualisation_Image](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/Visualisation_Image.png)    

### Visualisation Features  

**Linked Pathway:** Represented by the light blue rectangular box labeled (**A**), this element serves as a gateway to another pathway visualization. Clicking on this interactive element allows users to navigate to related metabolic pathways, facilitating comprehensive exploration of interconnected biochemical processes as below in [Display Interaction](#5-display-interaction).  

**Enzyme:** Depicted by rectangular boxes such as the one labeled (**D**), enzymes are color-coded to reflect differential gene expression levels. The color spectrum transitions from blue (**J**) to red (**B**), indicating varying degrees of expression. Gray enzymes (**D**) signify neutral expression levels, indicating no significant change in gene activity. The legend (**F**) in the bottom corner provides a complete reference for interpreting these color variations.    

**Compound:** Illustrated by gray circles (**C**), these elements represent metabolites or chemical compounds that participate in the biochemical reactions within the pathway.    

**Directionality:** The flow and reversibility of reactions are indicated by arrows (**G**) and (**H**) along with distinctive line styles. Reversible reactions are represented by segmented lines, while irreversible reactions are depicted with solid straight lines. These directional indicators convey crucial information through both their color and size. The color reflects the differential expression of the associated genes, while the arrow size corresponds to the relative log2fold change magnitude of that particular pathway segment. As evidenced by arrows (**G**) and (**H**), both color intensity and arrow dimensions vary to represent different expression levels and fold changes between conditions.  

**Pathway Magnifier:** The feature labeled (**I**) functions as a navigation aid, allowing users to zoom in or out on specific regions of interest within the pathway visualization. This feature enhances the examination of complex pathway sections by providing detailed views of selected areas.    

## Navigating EnStrap.int

### Welcome Page  

![Welcome Page](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/Welcome_Page.png)  

*Fig. 1. Users welcome page.*  

The welcome page is the first screen users will see when they launch the EnStrap.int application.

- Clicking "Get Started" button (**A**) navigates to the Upload Page, where users can submit their data (expression and annotation files).
- The "Guide" Button (**B**) opens the User Guide, providing an overview of EnStrap.int’s features and how to use them effectively.  

### Guide Section  

![Guide Page](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/Guide_page.png)  

*Fig. 2. Users guide page.* 

The guide provides detailed instructions on how to use the key features of EnStrap.Int, which includes:

- File Upload
- Customisation and Search
- Interaction Display
- Adding Files and Exporting Pathways
- Time Series Analysis
- Side bar and Pathway Information

Clicking "Get Started" button (**C**) in (**Fig. 2**) will take you to the File Upload page, just like "Get Started" Button (**A**) in (**Fig. 1**).  

#### 1. File Upload  

![Upload Image1](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/Upload_Image1.png) 

*Fig. 3a. Initial file upload page.* 

This is where the user uploads the data files:  

##### **Upload Users Files**
Click "Upload" button (**A**), as previously described in the [EnStrap.int Test Data and File Format Requirements](#enstrapint-test-data-and-file-format-requirements) section, the user must upload at least one expression file and one annotation file to proceed.  

##### **Access Upload Instructions**
In case the user is unsure about the type of files to upload, click the information icon (**B**) at the top-right corner for guidance.  


![Upload Image2](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/Upload_Image2.png)  

*Fig. 3b. Managing Uploaded Files and Configuring Options.**

##### **Manage Uploaded Files**
After uploading, a list of selected files will appear.  

- To remove a file, click the **X** button (**C**) next to it.
- To add more files, simply click the "Upload" button again.  

##### **Configure Settings**
User can customise how the data will be processed by adjusting the following options:  

###### a). **Number of Top-Expreesed Pathways:**  
   - Enter the desired number of pathways or use the up/down arrows (**E**) to specify how many of the top-expressed KEGG pathways should be visualised.  

###### b). **Organism Specification:**  
   - The user can choose to specify the organism or not.

###### c). **Time Series Data:**  
   - User must indicate whether the dataset includes time series analysis (**D**) or not.
   
##### **Process and Visualise**
Click the "Process" button (**F**) once all settings are configured to generate visualisations of the KEGG pathways.


#### 2. File Menu 

![ExtraFile Image1](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/ExtraFile_Image1.png)   

*Fig. 4a. File menu options.*  

To access file-related options, click the "File" menu (**A**) located in the top menu bar.
   
##### a). Import Extra Files  
Click "Import Files" (**B**) which will open a pop-up window where the user can upload additional expression files. Take note that **only expression files are accepted here-annotation files are not supported**. 
        

![ExtraFile_Image2](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/ExtraFile_Image2.png)  
*Fig. 4b. Upload extra files page*

- In the pop-up window, click "Choose Files" (**C**), the user can select multiple expression files.
- After selecting the extra files, click the "Add" button (**D**) to upload them. This will trigger reprocessing the mapping and displaying the previously selected number of top pathways from all expression files.  

##### b). Export Pathway Visualisation  
Click on the "Export" button in the [File Menu](#2-file-menu) dropdown (**E**) to access the export feature functionalities.

   **IMAGE**  
   
*Fig. 4c. Export pathway visulaisation page.*  

   ###### i). *Choose Export Format*  
   The user will have two options to export the visualisation, as either **PNG** or **SVG**. Then click to choose the desired format.  

   ###### ii). *Download File*  
   Once the user has selected the desired format,and click the "Download" button, the image will automatically be saved to your computer in the Downloads folder.  

   
#### 3. View Menu     

To access view-related options, click the "View" menu (**A**) located on the top of the menu bar.  

![View TopBar](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/View_TopBar.png)  

*Fig. 5a. View menu options.*  

##### a). Customise  

###### i). Open Customisation  
- Click the "Customise" button (**B**) to open the customisation panel, which will appear on the left side of the application window.  
  
![View Customise](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/View_Customise.png)  

*Fig. 5b. The customisation page.*    

###### ii). Change Colours  
The user can modify the colours used to represent high or low expressed genes including isoforms:
- Click the coloured box (**F**) to open the colour picker.
- Select your desired colour from the palette.    

###### iii). Close the Colour Picker
Once the user has selectected the colour and is satisfied with the choice, simply click anywhere outside the colour picker to close it.  

###### iv). Close Customisation Tab
To exit the customisation panel, click the **X** button located in the top-right corner of the tab (**H**).  


##### b). Search 
To access the search options user should go to the [View Menu](#3-view-menu) (**A**) at the top bar. To open the search panel, click "Search" button (**C**).  
  
###### i). *Search For Pathway Elements*  
If the user would like to search by elements within the pathway, click  "Pathway Elements" button (**D). This will open a search options on the left side of the application window.  

![View SearchForElements](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/View_SearchForElements.png)  

*Fig. 5c. Pathway elements page.*    

Within the panel, the user can choose from three search categories: **Enzyme, Compound and Pathway** by ticking the box next to the desired option (**I**).  

  **For example:**
  If the user select the **Element**, a drop-down box (**J**) will appear displaying a list of elements relevant to the selected category in the current pathway. The user can scroll down through the list and click on a specific element to zoom into it within the visualisation display.  

  

###### ii). *Search For Pathway*  

If the user is looking to search for a specific pathway: Next to "Pathway Elements" button (**D**) in the "Search" panel (accessed via the [View Menu](#3-view-menu)), click on the "For Pathway" button (**E**). Ihis will open a pop-up window containing two tabs that will allow user to search and navigate different pathways.   

![View_SearchForPathway_Highlight](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/View_SearchForPathway_Highlight.png)  

*Fig. 5d. Display pathways with hits and all KEGG pathways online.*   

**Highlight Tab:**
- This tab displays a table listing all pathways where hits were found in the uploaded expression files. Information about the total number of pathways and the number of pathways currently selected is shown above the table.
- To select pathways, tick the boxes in the "Select" column of the table (**L**) and to deselect a pathway, simply click the checkbox again.
- Use the "Select All" and "Clear All" buttons (**M**) to quickly select or deselect all pathways.
- Once user is satisfied with the selection,, click the "Search" button (**N**) to add the chosen pathways to the end of the pathway list in the side bar.  

**All KEGG Online Search Tab**  

![View_SearchForPathway_AllKEGG](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/View_SearchForPathway_AllKEGG.png)  
*Fig. 5e. Online KEGG pathway search page.*  

The KEGG Online Search tab allows users to search for pathway names directly from the KEGG API by typing into the "Search Pathway Box" (**U**).  

- As the user begins typing, a list of matching pathway names will appear below the search box.  
- To add the pathway, simply click on its name and it will be added to the list beneath the search box (**P**).
- To remove a particular pathway, click on **X** next to its name.
- Once the desired pathways are selected, click the "Search" button at the bottom of the page to add them to the end of the pathway list in the Sidebar. The user can add multiple pathways.

*Important things to note for the user:* 
- The pop-up window can be resized by dragging its bottom-right corner, allowing for a more comfortable view of the pathway table.
- Only one tab can be active at a time. Switching between tabs will reset any selections made in the previously opened tab.  

#### 4. Help Menu   
The Help Menu provides access to the [Guide Section](#guide-section), which users can refer to if they are unsure how to use a specific feature-especially when they are on the main application window rather than the [Welcome Page](#welcome-page). 


#### 5. Display Interaction    
The figures illustrate the interactive features of the visualisations.  

##### a). Pathway Dynamic Hyperlink  
When a user clicks on a linked pathway name — for example, the one labeled (**A**) in the visualisation — the application dynamically renders the selected pathway. See figure below:  

![InteractivityHyperlink_Image2](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/InteractivityHyperlink_Image2.png)  
*Fig. 6a. Navigation from pathway name to pathway visualisation.*   

##### b). Pop-Out Windows  

![Interactive_Image1](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/Interactive_Image1.png)      
*Fig. 6b.  Visualisation interactivity.*       

i). *Enzyme:*  
Click on the "Enzyme" label (**B**), opens a pop-up window displaying detailed information about the selected enzyme, which includes: 
- Enzyme key identifier
- Enzyme Commission (EC) code
- Associated gene(s), including isoforms where applicable
- Log2 fold change (logFC) value
- Enzyme name  

ii). *Compound:*  
Clicking on a "Compound" label (**C**) opens a pop-up window with details about the selected compound, which includes:

- Compound key identifier
- Enzyme Commission number   
 
#### 6. Time Series  
![TimeSeries_Image1](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/TimeSeries_Image1.png)
![TimeSeries_Image2](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/TimeSeries_Image2.png)
  

*Fig. 7. Time series animation display.*    

The figure above illustrate how users can explore different time points, with names as labeled in their uploaded expression files, by using the slider (**A**) to move through the different time points and observe how the pathway changes over time.  

To create a timelapse animation of the pathway across all time points, click the "Animate" button (**B**). The animation will sequentially display changes across each time point, providing a dynamic view of pathway evolution.  

#### 7. Side Bar Functionality and Pathway Information      
##### a). Side Bar Functionality  
![SideBar_Image0](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/SideBar_Image0.png)  
*Fig. 8a. Side bar functionality.*     
The side bar, located on the left side of the interface, displays a list labelled (**A**) in (**Fig. 8b**) of top-expressed pathways. The number of pathways shown depends on the number previously selected by the user.    

![SideBar_Image1](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/SideBar_Image1.png)    
*Fig. 8b. Sorting pathways and expanding/collapsing the side bar.*    

**Sorting Pathways:** To sort pathways, click the "Sort" button (**B**) which opens a dropdown menu with two main sorting options; alphabetical order in either ascending or descending sequence.  

**Expanding and Collapsing the Side Bar:** For the user to collapse the side bar and expand the main display view, click the arrows at the top right corner (**C**). To reopen the side bar, click the same arrows on the collapsed bar (**D**).   

![SideBar_Image2](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/SideBar_Image2.png)  
*Fig. 8c. Merging tabs within the side bar.*     

If the [Search](#b-search) and [Customise](#a-customise) tabs are added to the side bar, the user can easily switch between them by clicking the relevant icon or section name. The currently active section will be highlighted (**E**).    

To close the [Search](#b-search) and [Customise](#a-customise) sections, click on the **X** button (**F**) at the top right of each section. Closing a section automatically reverts to the "Pathways" section, which is the default view.  

**Note:** The "Pathways" section cannot be closed as it is the defualt view of the side bar.  

#### b). Pathway Information  

![StatsDisplay](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/StatsDisplay.png)  
*Fig. 8d. Summary of the visualised pathway.*     

The panel displayed at the bottom of the screen provides key information about the currently visualised pathway. This includes:
- The name of the pathway currently being viewed.
- The total number of genes present in the pathway.
- The number of unique genes represented in the visualisation.
- The number of enzymes differentially regulated by the genes based on the uploaded data.  

## Hands-on Example


  



