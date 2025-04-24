# EnStrap.int

EnStrap.int is a user-friendly web-based application designed to support interactive visualisation of time-series differential gene expression data, focusing on uncovering metabolic flux changes. This application allows users to upload their gene expression data, including an annotation file, to generate dynamic metabolic pathway maps, explore pathway-level regulation patterns over time and under different experimental conditions, filter results by gene families or contrasts, and export the resulting visualisations for downstream use. 
The tool aims to empower researchers, especially those without programming expertise, to explore pathway-level changes over time and across experimental conditions.  

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.3. For more information about Angular CLI, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

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
      - [File Upload](#file-upload)
      - [File Menu](#file-menu)
        - [Import Files](#import-files)
        - [Export Pathway](#export-pathway)
      - [View Menu](#view-menu)
        - [Customise](#customise)
        - [Search](#search)
          - [Pathway Elements](#pathway-elements)
          - [For Pathway](#for-pathway)
        - [Help Menu](#help-menu)
        - [Display Interaction](#display-interaction)
        - [Time Series](#time-series)
        - [Pathway Information](#pathway-information)
  - [Hands-on Example](#hands-on-example)  


## Installation 

**To get the application up and running on users local machine, follow the steps below:**

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

## Navigating EnStrap.Int

### Welcome Page  

![Welcome Page](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/Welcome_Page.png)  

*Fig.1. Welcome page for the users.*  

The welcome page is the first screen users will see when they launch the EnStrap.int application.

- Clicking button (**A**) navigates to the Upload Page, where users can submit their data (expression files and annotation file).
- Button (**B**) opens the User Guide, providing an overview of EnStrap.int’s features and how to use them effectively.  

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

Clicking Button (**C**) in (**Fig.2**) will take you to the File Upload page, just like Button (**A**) in (**Fig.1**).  

#### File Upload  

![Upload Image1](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/Upload_Image1.png)  

![Upload Image2](https://github.com/PaulaSawczuk/GroupProject-UGT-FEAS/blob/main/kegg_pathway/src/assets/Upload_Image2.png)

#### File Menu 

##### Import Files    

##### Export Pathway   
 
###### Pathway Elements    

###### For Pathway


#### Display Interaction  


#### View Menu  

##### Customise   

##### Search 


#### Help Menu 


#### Time Series


#### Pathway Information


## Hands-on Example


  



