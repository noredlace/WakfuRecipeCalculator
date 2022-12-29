import { Component } from '@angular/core';
import { ProfessionModel } from './model/profession-model.model';
import { ProfessionsService } from './service/professions.service';
import { RecipesService } from './service/recipes.service';
import { AfterViewInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { RecipeModel } from './model/recipe-model.model';


type RecipeIngredient = {
  ItemID: string;
  ParentItemID: string;
  Name: string;
  Quantity: number;
  BaseIngredient: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent{
  title = 'wakfu-recipe-calculator';

  professionsList: any;
  allRecipesList: any = [];
  recipesList: any;
  recipesListDataSource = new MatTableDataSource<any>();

  professionName: any;

  recipeMinLevel: any;
  recipeMaxLevel: any;

  recipeName: any;
  recipeQuantity: any;

  recipeIngredients: any;

  displayedColumns: string[] = ['select','qty','recipename','recipeid','recipeingredients','recipetype','recipelevel'];

  @ViewChild(MatPaginator) paginator: MatPaginator;


  //Get DropDown List and All Recipes
  constructor(private professions:ProfessionsService, private recipes:RecipesService){
    //Get Professions Dropdown List from API
    this.professions.getProfessionList().subscribe(professionData => {
      this.professionsList = professionData;

      //Get Recipes for Each Profession
      this.professionsList.forEach((element: any) => {
        this.recipes.getRecipesList(element.profession).subscribe((recipeData : any) => {
          recipeData.forEach((recipe: any) => {
             this.allRecipesList.push(recipe);
          });
        });
      });
    });
  }

  //Generate Table of Recipes for Profession from Dropdown Selection
  getRecipesForProfession(){
    this.recipes.getRecipesList(this.professionName).subscribe(data =>
      {
        this.recipesList = data;
        var levelFilter = this.recipesList.filter((data: { Level: number; }) => data.Level >= (this.recipeMinLevel ?? 0) && data.Level <= (this.recipeMaxLevel ?? 999));
        this.recipesList = levelFilter;

        if(typeof this.recipeName !== 'undefined')
        {
          var dynamicRegex = new RegExp(this.recipeName, "i");

          var nameFilter = this.recipesList.filter( (data: any) => {
            return data.Name.match(dynamicRegex) !== null
          });

          this.recipesList = nameFilter;
        }

        //Set the Datasource data and paginator of the Table
        this.recipesListDataSource.data = this.recipesList;
        this.recipesListDataSource.paginator = this.paginator;
      });
  }

  //Submit Checked Row to query for all Recipes/SubRecipes
  btnSubmit(){
    //Need to get Quantity and RecipeID
    var recipeQuantity = (<HTMLInputElement>document.getElementsByClassName("mat-checkbox-checked")[0]?.parentElement?.parentElement?.children[1]?.children[0]).value;
    if (recipeQuantity == "")
    {
      recipeQuantity = "0";
    }

    this.recipeQuantity = parseInt(recipeQuantity);

    var recipeID = (<HTMLInputElement>document.getElementsByClassName("mat-checkbox-checked")[0]?.parentElement?.parentElement?.children[3]).innerText;

    var recipeName = (<HTMLInputElement>document.getElementsByClassName("mat-checkbox-checked")[0]?.parentElement?.parentElement?.children[2]).innerText;

    var recipeIngredients: RecipeIngredient[] = [{Name: recipeName, ParentItemID: recipeID, ItemID: recipeID, Quantity: parseInt("1"), BaseIngredient: "0"}];

    this.recipeIngredients = this.searchRecipes(recipeID, recipeIngredients);

    console.log(this.recipeIngredients);
  }

  //Recursive Function to search for all subRecipes
  searchRecipes(recipeID:string, recipeIngredients:RecipeIngredient[]){

    //Filter the All Recipes List for the RecipeID Provided
    var recipeFilter = this.allRecipesList.filter((data: { ItemID: string }) => data.ItemID == recipeID);

    //Stop if the RecipeID provided is not found in the list
    if (recipeFilter.length == 0)
    {
      console.log("Item " + recipeID + " is Base");
    }
    //If the RecipeID is found in the list, it means it has subRecipes
    //Add the Recipe Details into the Array and recurse with those subRecipes
    else
    {
      console.log("Item " + recipeID + " has Children");

      recipeFilter[0].Recipe.forEach( (el: any) => {
        var recipeObject: RecipeIngredient = {
          Name: el.Name,
          ParentItemID: recipeFilter[0].ItemID,
          ItemID: el.ItemID,
          Quantity: parseInt((el.qty).replace("x","")),
          BaseIngredient: "0"
        };
        recipeIngredients.push(recipeObject);
        this.searchRecipes(el.ItemID, recipeIngredients);
      });
    }

    return recipeIngredients;
  }
}

