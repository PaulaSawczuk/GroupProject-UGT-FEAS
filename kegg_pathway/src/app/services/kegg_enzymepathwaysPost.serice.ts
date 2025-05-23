/*** 
 * // Date: 29/03/2025
 * // Jennifer O'Halloran
 * // IBIX2 Group Project 2025 
***/

/***
//----------------------------------------
// POST request service to backend Express Node API
// Makes Post Requests to Server.js via localhost
// PORT : 3000

***/

import { Injectable} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root',
})

// ------------ Creating Post Service Class -------------

export class enzymeApiServicePost {

  private apiUrl = 'http://localhost:4000/api/';

  constructor(private http: HttpClient) {}


  // ------------- Get Request for All EC Pathway Names and Codes ---------------
  // Sends request to backend to query KEGG
  // Returns Array of Pathway Names and Codes to store as Display Component Attributre for querying

  getPathwayNames(): Observable<any>{
    return this.http.get(this.apiUrl+'getPaths');
  }

  // ------------ Post Request for Enzyme Pathways -------------
  // Sends Enzyme Codes 
  // Returns Array of Pathway Objects (name:, pathway:)
  postEnzymeData(data: (any[]|string)): Observable<any[]>{
    return this.http.post<any>(this.apiUrl+'getPathways', data);

  }

  // ------------ Post Request for Mapping Data -------------
  // Sends single selected ec code (e.g. ec00030)
  // Returns Array of Nodes and Array of Links for visulisation
  postMapData(data: string): Observable<any[]>{
    return this.http.post<any>(this.apiUrl+'getMap', data);
  }


   // ------------ Multi Post Request for Mapping Data -------------
  // Sends list of pathways to get KGML for -- top 10 
  // Returns Array of Nodes and Array of Links for visulisation
  postALLMapData(data: (any[])): Observable<any[]>{
    return this.http.post<any>(this.apiUrl+'getMap2', data);
  }
}