import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ProfessionsService {

  constructor(private http:HttpClient) { }

  getProfessionList()
  {
      let apiURL = "https://express.noredlace.com/api/wakfu/professions"
      return this.http.get(apiURL);
  }
}
