// project-loader.service.ts
import { Injectable } from '@angular/core';
import { FileDataService } from './file-data.service';

@Injectable({
  providedIn: 'root',
})
export class ProjectLoaderService {
  constructor(private fileDataService: FileDataService) {}

  async loadProjectFiles(fileContents: { name: string, content: string }[], displayComponent: any) {
    for (const file of fileContents) {
      console.log('Processing file:', file.name);
      const content = JSON.parse(file.content);

      switch (file.name) {
        case 'multipleCombinedArray.txt':
          this.fileDataService.setMultipleCombinedArrays(content);
          break;
        case 'combineData.txt':
          this.fileDataService.setCombinedData(content);
          break;
        case 'annoData.txt':
          this.fileDataService.setAnnotationData('DefaultFile', content);
          break;
        case 'expressData.txt':
          this.fileDataService.setExpressionData(content);
          break;
        case 'pathways.txt':
          this.fileDataService.setPathways(content);
          break;
        case 'pathwayResponse.txt':
          displayComponent.pathwayResponse = content;
          break;
        case 'pathwayNumber.txt':
          displayComponent.pathwayNumber = content;
          break;
        case 'pathwayCount.txt':
          this.fileDataService.setPathwayCount(content);
          break;
        case 'uploadedexpressFiles.txt':
          this.fileDataService.setUploadedExpressionFiles(content);
          displayComponent.UploadedExpressionFiles = content;
          break;
        case 'uploadedAnnoFile.txt':
          this.fileDataService.setUploadedAnnoationFiles(content);
          break;
        case 'filteredGenes.txt':
          displayComponent.filteredGenes = content;
          break;
        case 'enzymeList.txt':
          displayComponent.enzymeList = content;
          break;
        case 'allPathwayData.txt':
          displayComponent.ALLpathwayData = content;
          break;
        case 'AllKeggPathways.txt':
          displayComponent.AllKeggPathways = content;
          break;
        case 'pathwayTally.txt':
          displayComponent.pathwayTally = content;
          break;
        case 'highlightedPathways.txt':
          displayComponent.highlightedPathways = content;
          break;
        case 'MapData.txt':
          displayComponent.mapData = content;
          break;
        case 'loadedPathwayData.txt':
          displayComponent.loadedPathwayData = content;
          break;
        case 'thispathways.txt':
          displayComponent.pathways = content;
          break;
        case 'colourArray.txt':
          displayComponent.colourArray = content;
          break;
        case 'statsArray.txt':
          displayComponent.StatsArray = content;
          break;
        case 'ExpressionFileNames.txt':
          displayComponent.ExpressionFileNames = content;
          break;
        case 'pathwayData.txt':
          displayComponent.pathwayData = content;
          break;
      }
    }

    displayComponent.isProjectSaved = true;
  }
}
