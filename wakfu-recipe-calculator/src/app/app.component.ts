import { Component } from '@angular/core';
import { ProfessionModel } from './model/profession-model.model';
import { ProfessionsService } from './service/professions.service';
import { RecipesService } from './service/recipes.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'wakfu-recipe-calculator';

  professionsList: any;
  recipesList: any;

  professionName: any;

  recipeMinLevel: 0;
  recipeMaxLevel: 0;

  constructor(private professions:ProfessionsService, private recipes:RecipesService){
    this.professions.getProfessionList().subscribe(data => {
      this.professionsList = data;
    });
  }

  getRecipesForProfession(professionname:string, recipeMinLevel:number, recipeMaxLevel:number){
    this.recipes.getRecipesList(professionname).subscribe(data => { this.recipesList = data});

    //var filtered = this.recipesList.filter((data: { Level: number; }) => data.Level >= recipeMinLevel && data.Level <= recipeMaxLevel);

    //this.recipesList = filtered;
  }

}
