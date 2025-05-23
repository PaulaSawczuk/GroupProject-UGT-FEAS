
// Jennifer O'Halloran 
// 29/03/2025
//----------------------------------------
// POST request service to backend Express Node API
// Input : List of Enzymes From the input Data 
// Response : Array of Pathway Objects - Name and Pathway Code

import { Injectable, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root',
})


export class mapApiServicePost {

  private apiUrl = 'http://localhost:3000/api/getModel';

  constructor(private http: HttpClient) {}

  postEnzymetData(data: any): Observable<any>{
    return this.http.post<any>(this.apiUrl, data);
  }
}