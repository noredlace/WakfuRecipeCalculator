import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class RecipesService {

  constructor(private http:HttpClient) { }

  getRecipesList(professionName:string)
  {
      let apiURL = "https://express.noredlace.com/api/wakfu/profession/" + professionName
      return this.http.get(apiURL);
  }

  getAllRecipes()
  {
    let apiURL = "https://express.noredlace.com/api/wakfu/recipes"
    return this.http.get(apiURL);
  }
}
