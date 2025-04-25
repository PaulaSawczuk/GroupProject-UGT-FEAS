# EnStrap.int

EnStrap.int is a user-friendly web-based application designed to support interactive visualisation of time-series differential gene expression data, focusing on uncovering metabolic flux changes. This application allows users to upload their gene expression data, including an annotation file, to generate dynamic metabolic pathway maps, explore pathway-level regulation patterns over time and under different experimental conditions, filter results by gene families or contrasts, and export the resulting visualisations for downstream use. 
The tool aims to empower researchers, especially those without programming expertise, to explore pathway-level changes over time and across experimental conditions.  

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.3. For more information refer to the official [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page. The application is built using TypeScript/JavaScript for logic and functionality, HTML for structuring web content, and CSS for styling and layout.

## Table of Contents

- [EnStrap.int](#enstrapint)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
    - [Cloning the Repository](#1-cloning-the-repository)
    - [Installing Dependencies](#2-installing-dependencies)
    - [Starting the Application](#3-starting-the-application)
  - [Test Data and Data Format](#test-data-and-data-format)
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
      - [Pathway Information](#7-pathway-information)
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
  
**Note:** Ensure that Node.js and npm are installed on your system.

## Test Data and Data Format  

When EnStrap.int is launched, the data for testing the app can be accessed via [Test Data Folder on GitHub](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/tree/main/TestData). The tool supports files in .csv and .txt formats only. The data must include at least one *expression file* and its corresponding *annotation file*.  

## Navigating EnStrap.int

### Welcome Page  

![Welcome Page](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/Welcome_Page.png)  

*Fig.1. Welcome page for the users.*  

The welcome page is the first screen users will see when they launch the EnStrap.int application.

- Clicking "Get Started" button (**A**) navigates to the Upload Page, where users can submit their data (expression files and annotation file).
- The "Guide" Button (**B**) opens the User Guide, providing an overview of EnStrap.int’s features and how to use them effectively.  

### Guide Section  

![Guide Page](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/Guide_page.png)  

*Fig.2. The users guide page.* 

The guide provides detailed instructions on how to use the key features of EnStrap.Int, including:

- File Upload
- Customisation and Search
- Interaction Display
- Adding Files and Exporting Pathways
- Time Series Analysis
- Sidebar and Pathway Information

Clicking "Get Started" button (**C**) in (**Fig.2**) will take you to the File Upload page, just like "Get Started" Button (**A**) in (**Fig.1**).  

#### 1. File Upload  

![Upload Image1](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/Upload_Image1.png) 

*Fig.3a. Initial file upload page.* 

This is where the user uploads the data files:  

##### **Upload Users Files**
Click "Upload" button (**A**), as previously described in the [Test Data and Data Format](#test-data-and-data-format) section, the user must upload at least one expression file and one annotation file to proceed.  

##### **Access Upload Instructions**
In case the user is unsure about the type of files to upload, click the information icon (**B**) at the top-right corner for guidance.  


![Upload Image2](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/Upload_Image2.png)  

*Fig.3b. Managing Uploaded Files and Configuring Options.**

##### **Manage Uploaded Files**
After uploading, a list of selected files will appear.  

- To remove a file, click the **X** button (**C**) next to it.
- To add more files, simply click the "Upload" button again.  

##### **Configure Settings**
User can customise how the data will be processed by adjusting the following options:  

###### a). **Number of Top-Expreesed Pathways:**  
   - Enter the desired number of pathways or use the up/down arrows (**E**)to specify how many of the top-expressed KEGG pathways should be visualised.  

###### b). **Organism Specification:**  
   - The user can choose to specify the organism or not.

###### c). **Time Series Data:**  
   - User must indicate whether the dataset includes time series analysis (**D**).
   
##### **Process and Visualise**
Click the "Process" button (**F**) once all settings are configured to generate visualisations of the KEGG pathways.


#### 2. File Menu 

![ExtraFile Image1](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/ExtraFile_Image1.png)   

*Fig.4a. File menu options.*  

To access file-related options, click the "File" menu (**A**) located in the top menu bar.
   
##### a). Import Extra Files  
Click "Import Files" (**B**) which will open a pop-up window where you can upload additional expression files. 
        

![ExtraFile_Image2](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/ExtraFile_Image2.png)  

- In the pop-up window, click "Choose Files" (**C**), the user can select multiple files and note that **only expression files are accepted here-annotation files are not supported**.
- After selecting the extra files, click the "Add" button (**D**) to upload them. This will trigger reprocessing the mapping and displaying the previously selected number of top pathways from all expression files.  

##### b). Export Pathway Visualisation  
Click on the "Export" button in the [File Menu](#2-file-menu) dropdown (**E**).

   **IMAGE**

   ###### i). *Choose Export Format*
   - The user will have two options to export the visualisation, as either **PNG** or **SVG**.
   - Click to choose desired format.  

   ###### ii). *Download File*
   - Once the user has selected the desired format,and click the "Download" button, the image will automatically be saved to your computer in the Downloads folder.  

   
#### 3. View Menu     

To access view-related options, click the "View" menu (**A**) located on the top of the menu bar..  

![View TopBar](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/View_TopBar.png)  

##### a). Customise  

###### i). Open Customisation  
- Click the "Customise" button (**B**) to open the customisation panel, which will appear on the left side of the application window.  
  
![View Customise](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/View_Customise.png)  

###### ii). Change Colours  
The user can modify the colours used to represent of high or low expressed genes including isoforms:
- Click the coloured box (**F**) to open the colour picker.
- Select your desired colour from the palette.    

###### iii). Close the Colour Picker
Once the user has selectected the colour and is satisfied with the choice, simply click anywhere outside the colour picker to close it.  

###### iv). Close Customisation Tab
To exit the customisation panel, click the **X** button located in the top-right corner of the tab (**H**).  


##### b). Search 
To access the search options user should go to the [View Menu](#3-view-menu) (**A**) at the top bar.
- To open the search panel, click "Search" button (**C**).  
  
###### i). *Pathway Elements*  
If the user would like to search by elements within the pathway, click  "Pathway Elements" button (**D). This will open a search options on the left side of the application window.  

![View SearchForElements](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/View_SearchForElements.png)  


Within the panel, the user can choose from three search categories: **Enzyme, Compound and Pathway** by ticking the box next to the desired option (**I**).  

  **For example:**
  If the user select the **Element**, a drop-down box (**J**) will appear displaying a list of elements relevant to the selected category in the current pathway. The user can scroll down through the list and click on a specific element to zoom into it within the visualisation display.  

###### ii). *For Pathway*  

If the user looking to search for a specific pathway: Next to "Pathway Ements" button (**D**) in the "Search" panel (accessed via the [View Menu](#3-view-menu)), click on the "For Pathway" button (**E**). Ihis will open a pop-up window containing two tabs that allow you to search and navigate different pathways.   

![View_SearchForPathway_Highlight](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/View_SearchForPathway_Highlight.png)  

**Highlilight Tab:**
- 

![View_SearchForPathway_AllKEGG](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/View_SearchForPathway_AllKEGG.png)  


#### 4. Help Menu   
The Help Menu provides access to the [Guide Section](#guide-section), which users can refer to if they are unsure how to use a specific feature-especially when they are on the main application window rather than the [Welcome Page](#welcome-page). 


#### 5. Display Interaction  
 
 
#### 6. Time Series


#### 7. Pathway Information


## Hands-on Example


  



