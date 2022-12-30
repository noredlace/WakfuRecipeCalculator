import { Component } from '@angular/core';
import { ProfessionModel } from './model/profession-model.model';
import { ProfessionsService } from './service/professions.service';
import { RecipesService } from './service/recipes.service';
import { AfterViewInit, ViewChild } from '@angular/core';
import { RecipeModel } from './model/recipe-model.model';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';


type RecipeIngredient = {
  ItemID: number;
  ParentItemID: number;
  ItemURL: string;
  Name: string;
  RecipeQuantity: number;
  RequiredQuantity: number;
  BaseIngredient: boolean;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent{
  title = 'wakfu-recipe-calculator';

  //Stores the API Return of all Available Professions. Used in Select Dropdown
  professionsList: any;

  //Stores the API Return of all Recipes of every Profession. Used to identify Recipes across Professions when needed
  //a.k.a if Jeweler a recipe uses a Miner recipe, we can reference this variable to find out the Recipe Guts of that
  allRecipesList: any = [];

  //Not sure if needed
  recipesList: any;

  //Stores the API Return of the Recipe for the Selected Profession. Renders the Data Table
  recipesListDataSource = new MatTableDataSource<any>();
  displayedColumns: string[] = ['select','qty','recipename','recipeid','recipeingredients','recipetype','recipelevel'];
  @ViewChild(MatPaginator) paginator: MatPaginator;

  //Stores the Selected Profession Name from the Select Dropdown
  professionName: any;

  //Stores the Input field of the Recipe Minimum and Maximum Levels
  recipeMinLevel: any;
  recipeMaxLevel: any;

  //Stores the Filtered Name for the DataSource Table
  recipeName: any;

  //Stores the Quantity from the Datasource Table
  recipeQuantity: any;

  //This is the Built Ingredient List made after Submission that contains all the calculated resources
  recipeIngredients: any;


  //Get DropDown List and All Recipes
  constructor(private professions:ProfessionsService, private recipes:RecipesService){
    //Get Professions Dropdown List from API
    this.professions.getProfessionList().subscribe(professionData => {
      this.professionsList = professionData;

      //Get Recipes for Each Profession. This is to be used for
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
  submitOrder(){
    //Need to get Quantity and RecipeID from the Table Rows Box
    //I'm stupid and there has to be a better way than Javascript Selectors...lol
    var recipeQuantity = (<HTMLInputElement>document.getElementsByClassName("mat-mdc-radio-checked")[0]?.parentElement?.parentElement?.children[1].children[0].children[0].children[1].children[0].children[0]).value;
    if (recipeQuantity == "")
    {
      recipeQuantity = "0";
    }
    this.recipeQuantity = parseInt(recipeQuantity);

    var recipeID = (<HTMLInputElement>document.getElementsByClassName("mat-mdc-radio-checked")[0]).id

    var recipeObject = this.recipesListDataSource.data.filter((data: { ItemID: string }) => data.ItemID == recipeID);

    var recipeName = recipeObject[0].Name;
    var recipeURL = recipeObject[0].urlID;

    var recipeIngredients: RecipeIngredient[] = [{Name: recipeName, ParentItemID: parseInt(recipeID), ItemID: parseInt(recipeID), ItemURL: recipeURL, RecipeQuantity: this.recipeQuantity, RequiredQuantity: this.recipeQuantity, BaseIngredient: false}];

    this.recipeIngredients = this.searchRecipes(recipeID, this.recipeQuantity, recipeIngredients);

    console.log(this.recipeIngredients);

    //console.log(this.allRecipesList);
  }

  //Recursive Function to search for all subRecipes
  searchRecipes(recipeID:string, recipeQuantity:number, recipeIngredients:RecipeIngredient[]){

    //Filter the All Recipes List for the RecipeID Provided
    var recipeFilter = this.allRecipesList.filter((data: { ItemID: string }) => data.ItemID == recipeID);

    //Stop if the RecipeID provided is not found in the list
    if (recipeFilter.length == 0)
    {
      //console.log("Item " + recipeID + " is Base");
    }
    //If the RecipeID is found in the list, it means it has subRecipes
    //Add the Recipe Details into the Array and recurse with those subRecipes
    else
    {
      //console.log("Item " + recipeID + " has Children");

      recipeFilter[0].Recipe.forEach( (el: any) => {

        //Determine if Child Ingredient is a Base Ingredient (a.k.a you cannot craft it)
        var recipeIsBase = this.allRecipesList.filter((data: { ItemID: string }) => data.ItemID == el.ItemID);

        var recipeObject: RecipeIngredient = {
          Name: el.Name,
          ParentItemID: recipeFilter[0].ItemID,
          ItemID: el.ItemID,
          ItemURL: el.urlID,
          RecipeQuantity: parseInt((el.qty).replace("x","")),
          RequiredQuantity: recipeQuantity * parseInt((el.qty).replace("x","")),
          BaseIngredient: false
        };

        //If there were no results in the Child Ingredient for a Recipe, then it is a Base Ingredient
        if (recipeIsBase.length == 0)
        {
          recipeObject.BaseIngredient = true
        }

        recipeIngredients.push(recipeObject);
        this.searchRecipes(el.ItemID, recipeQuantity * parseInt((el.qty).replace("x","")), recipeIngredients);

      });
    }

    return recipeIngredients;
  }
}

