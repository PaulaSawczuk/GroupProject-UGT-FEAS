
import { Injectable } from '@angular/core';
import { FileDataService } from './file-data.service';

@Injectable({
  providedIn: 'root',
})

export class ProjectLoaderService {
  constructor(private fileDataService: FileDataService) {}

  /**
   * The `loadProjectFiles` method is responsible for processing and loading
   * a set of project-related files into the application. It takes an array
   * of file objects (each containing a name and content) and a display component
   * to update the UI with the loaded data.
   *
   * @param fileContents - Array of objects representing files with `name` and `content`.
   * @param displayComponent - The component responsible for displaying the loaded data.
   */
  async loadProjectFiles(fileContents: { name: string, content: string }[], displayComponent: any) {
    for (const file of fileContents) {
      console.log('Processing file:', file.name);
      // Parse the file content from JSON format
      const content = JSON.parse(file.content);

      // Handle each file based on its name and update the appropriate service or component
      switch (file.name) {
        case 'multipleCombinedArray.txt':
          // Sets multiple combined arrays in the FileDataService
          this.fileDataService.setMultipleCombinedArrays(content);
          break;
        case 'combineData.txt':
          // Sets combined data in the FileDataService
          this.fileDataService.setCombinedData(content);
          break;
        case 'annoData.txt':
          // Sets annotation data with a default file name
          // this.fileDataService.setAnnotationData('DefaultFile', content);
          try {
            Object.entries(content).forEach(([filename, data]) => {
              this.fileDataService.setAnnotationData(filename, data as string[][]);
            });
          } catch (error) {
            console.error('Failed to parse annotation data:', error);
          }

          break;
        case 'expressData.txt':
          // Sets expression data in the FileDataService
          this.fileDataService.setExpressionData(content);
          break;
        case 'pathways.txt':
          // Sets pathway data in the FileDataService
          this.fileDataService.setPathways(content);
          break;
        case 'pathwayResponse.txt':
          // Updates the display component with pathway response data
          displayComponent.pathwayResponse = content;
          break;
        case 'pathwayNumber.txt':
          // Updates the display component with pathway number data
          displayComponent.pathwayNumber = content;
          break;
        case 'pathwayCount.txt':
          // Sets pathway count in the FileDataService
          this.fileDataService.setPathwayCount(content);
          break;
        case 'uploadedexpressFiles.txt':
          // Sets uploaded expression files and updates the display component
          this.fileDataService.setUploadedExpressionFiles(content);
          displayComponent.UploadedExpressionFiles = content;
          break;
        case 'uploadedAnnoFile.txt':
           // Sets uploaded annotation files and updates the display component
          this.fileDataService.setUploadedAnnoationFiles(content);
          displayComponent.UploadedAnnoationFiles = content;
          break;
        case 'filteredGenes.txt':
          // Updates the display component with filtered genes data
          displayComponent.filteredGenes = content;
          break;
        case 'enzymeList.txt':
          // Updates the display component with enzyme list data
          displayComponent.enzymeList = content;
          break;
        case 'allPathwayData.txt':
          // Updates the display component with all pathway data
          displayComponent.ALLpathwayData = content;
          break;
        case 'AllKeggPathways.txt':
          // Updates the display component with all KEGG pathways data
          displayComponent.AllKeggPathways = content;
          break;
        case 'pathwayTally.txt':
          // Updates the display component with pathway tally data
          displayComponent.pathwayTally = content;
          break;
        case 'highlightedPathways.txt':
          // Updates the display component with highlighted pathways data
          displayComponent.highlightedPathways = content;
          break;
        case 'MapData.txt':
          // Updates the display component with map data
          displayComponent.mapData = content;
          break;
        case 'loadedPathwayData.txt':
          // Updates the display component with loaded pathway data
          displayComponent.loadedPathwayData = content;
          break;
        case 'thispathways.txt':
          // Updates the display component with pathways data
          displayComponent.pathways = content;
          break;
        case 'colourArray.txt':
          // Updates the display component with color array data
          displayComponent.colourArray = content;
          break;
        case 'statsArray.txt':
          // Updates the display component with statistics array data
          displayComponent.StatsArray = content;
          break;
        case 'ExpressionFileNames.txt':
          // Updates the display component with expression file names
          displayComponent.ExpressionFileNames = content;
          break;
        case 'pathwayData.txt':
          // Updates the display component with pathway data
          displayComponent.pathwayData = content;
          break;
      }
    }
    // Marks the project as saved in the display component
    displayComponent.isProjectSaved = true;
  }
}
