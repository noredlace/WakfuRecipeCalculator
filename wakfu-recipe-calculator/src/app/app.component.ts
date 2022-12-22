import { Component } from '@angular/core';
import { ProfessionModel } from './model/profession-model.model';
import { ProfessionsService } from './service/professions.service';
import { RecipesService } from './service/recipes.service';
import { DataSource } from '@angular/cdk/collections'
import { BehaviorSubject, Observable } from 'rxjs';
import { AfterViewInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent{
  title = 'wakfu-recipe-calculator';

  professionsList: any;
  recipesList: any;


  professionName: any;

  recipeMinLevel: any;
  recipeMaxLevel: any;

  recipeName: any;

  displayedColumns: string[] = ['select','qty','recipename','recipeid','recipeingredients','recipetype','recipelevel'];

  constructor(private professions:ProfessionsService, private recipes:RecipesService){
    this.professions.getProfessionList().subscribe(data => {
      this.professionsList = data;
    });
  }

  getRecipesForProfession(){
    this.recipes.getRecipesList(this.professionName).subscribe(data =>
      {

        if(typeof this.recipeName !== 'undefined')
        {
          debugger;
          this.recipesList = data

          var dynamicRegex = new RegExp(this.recipeName);

          var levelFilter = this.recipesList.filter((data: { Level: number; }) => data.Level >= (this.recipeMinLevel ?? 0) && data.Level <= (this.recipeMaxLevel ?? 999));

          var nameFilter = this.recipesList.filter((data: { Name: string;}) => data.Name.indexOf(this.recipeName) > -1)
          this.recipesList = levelFilter;
        }
        else
        {
          this.recipesList = data
          var levelFilter = this.recipesList.filter((data: { Level: number; }) => data.Level >= (this.recipeMinLevel ?? 0) && data.Level <= (this.recipeMaxLevel ?? 999));
          this.recipesList = levelFilter;
        }
      });
  }

  getRecipesForRecipeNames(){
    this.recipes.getRecipesList(this.professionName).subscribe(data =>
      {
        this.recipesList = data
        var filtered = this.recipesList.filter((data: { Level: number; }) => data.Level >= (this.recipeMinLevel ?? 0) && data.Level <= (this.recipeMaxLevel ?? 999));
        this.recipesList = filtered;
      });
  }

}
