import { Component } from '@angular/core';
import { ProfessionModel } from './model/profession-model.model';
import { ProfessionsService } from './service/professions.service';
import { RecipesService } from './service/recipes.service';
import { AfterViewInit, ViewChild } from '@angular/core';
import { RecipeModel } from './model/recipe-model.model';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';



//This is the list of Ingredients returned from submitting an Order
//RecipeQuantity refers to the amount needed for the Parent Craft (a.k.a ItemA uses ItemB 5 times. RecipeQuantity = 5)
//RequiredQuantity refers to the amount needed for the quantity ordered (a.k.a ItemA uses ItemB 5 times. We ordered 5 ItemA. RequiredQuantity = 25)
//BaseIngredient refers to if an item is craftable or not. True = Not Craftable. False = Craftable
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
  professionList: any;

  //Stores the API Return of all Recipes of every Profession. Used to identify Recipes across Professions when needed
  //a.k.a if Jeweler a recipe uses a Miner recipe, we can reference this variable to find out the Recipe Guts of that
  allRecipesList: any;

  //Stores the Recipes of the Selected Profession for rendering in the Data Table. Probably not needed as it should be identical to the recipesListDataSource.data
  professionRecipesList: any;

  //Stores the API Return of the Recipe for the Selected Profession. Renders the Data Table
  recipesListDataSource = new MatTableDataSource<any>();
  displayedColumns: string[] = ['select','qty','recipename','recipeid','recipeingredients','recipetype','recipelevel'];
  @ViewChild(MatPaginator) paginator: MatPaginator;

  //Stores the Filtered Name for the DataSource Table
  recipeName: any;

  //Stores the Quantity from the Datasource Table
  recipeQuantity: any;

  //Stores the Selected Profession Name from the Select Dropdown
  professionName: any = "All";

  //Stores the Input field of the Recipe Minimum and Maximum Levels
  recipeMinLevel: any;
  recipeMaxLevel: any;

  //This is the Built Ingredient List made after Submission that contains all the calculated resources
  recipeIngredients: any;

  //This is a List of the Base (NonCraftable) Ingredients
  //This is different than recipeIngredients in that this will add any duplicate elements together
  baseRecipeIngredients: any;

  //This is a property to enforce the loading card if the Recipes aren't loaded yet (a.k.a first API call)
  recipesPopulated: boolean = false;

  //Get DropDown List and All Recipes
  constructor(private recipes:RecipesService)
  {
    this.recipes.getAllRecipes().subscribe(recipeData => {
      this.professionRecipesList = recipeData;

      var professionList = ["All"];
      var allRecipesList: any[] = [];

      for (var professionName in recipeData)
      {
        professionList.push(professionName);

        this.professionRecipesList[professionName].forEach((recipe: any) => {
          allRecipesList.push(recipe);
        });
      }

      //Sort by Level ASC and then by Name ASC
      allRecipesList.sort((a, b) => a.Level - b.Level || (a.Name.toLocaleUpperCase() < b.Name.toLocaleUpperCase() ? -1 : 1));

      this.professionList = professionList;
      this.allRecipesList = allRecipesList;

      this.recipesListDataSource.paginator = this.paginator;
      this.recipesListDataSource.data = allRecipesList;


      this.recipesPopulated = true;
    });
  }

  getRecipesForProfession()
  {
    var currentProfession = this.professionName

    var currentProfessionRecipes: any[] = [];
    if(currentProfession == "All")
    {
      currentProfessionRecipes = this.allRecipesList;
    }
    else {
      currentProfessionRecipes = this.professionRecipesList[currentProfession];
    }

    var recipeFilter = currentProfessionRecipes.filter((data: { Level: number; }) => data.Level >= (this.recipeMinLevel ?? 0) && data.Level <= (this.recipeMaxLevel ?? 999));

    //If Recipe Name Filter was provided, filter the Data Source Table
    if(typeof this.recipeName !== 'undefined')
    {
      var dynamicRegex = new RegExp(this.recipeName, "i");

      var nameFilter = recipeFilter.filter( (data: any) => {
        return data.Name.match(dynamicRegex) !== null
      });

      recipeFilter = nameFilter;
    }

    //Set the Datasource data and paginator of the Table
    this.recipesListDataSource.paginator = this.paginator;
    this.recipesListDataSource.data = recipeFilter;
  }

  //Submit Checked Row to query for all Recipes/SubRecipes
  submitOrder()
  {
    //Need to get Quantity and RecipeID from the Table Rows Box
    //I'm stupid and there has to be a better way than Javascript Selectors...lol
    var recipeQuantity = (<HTMLInputElement>document.getElementsByClassName("mat-mdc-radio-checked")[0]?.parentElement?.parentElement?.children[1].children[0].children[0].children[1].children[0].children[0]).value;
    if (recipeQuantity == "" || undefined)
    {
      recipeQuantity = "0";
    }
    this.recipeQuantity = parseInt(recipeQuantity);

    var recipeID = (<HTMLInputElement>document.getElementsByClassName("mat-mdc-radio-checked")[0]).id

    var recipeObject = this.recipesListDataSource.data.filter((data: { ItemID: string }) => data.ItemID == recipeID);

    var recipeName = recipeObject[0].Name;
    var recipeURL = recipeObject[0].ItemURL;

    var recipeIngredients: RecipeIngredient[] = [{Name: recipeName, ParentItemID: parseInt(recipeID), ItemID: parseInt(recipeID), ItemURL: recipeURL, RecipeQuantity: this.recipeQuantity, RequiredQuantity: this.recipeQuantity, BaseIngredient: false}];

    this.recipeIngredients = this.searchRecipes(parseInt(recipeID), this.recipeQuantity, recipeIngredients);

    this.baseRecipeIngredients = this.returnBaseIngredients(this.recipeIngredients);

  }

  //Recursive Function to search for all subRecipes
  searchRecipes(recipeID:number, recipeQuantity:number, recipeIngredients:RecipeIngredient[])
  {

    //Filter the All Recipes List for the RecipeID Provided
    var recipeFilter = this.allRecipesList.filter((data: { ItemID: number }) => data.ItemID == recipeID);

    //Stop if the RecipeID provided is not found in the list
    if (recipeFilter.length == 0)
    {
      //console.log("Item " + recipeID + " is Base");
    }
    //If the RecipeID is found in the list, it means it has subRecipes
    //Add the Recipe Details into the Array and recurse with those subRecipes
    else
    {

      recipeFilter[0].Recipe.forEach( (el: any) => {

        //Determine if Child Ingredient is a Base Ingredient (a.k.a you cannot craft it)
        var recipeIsBase = this.allRecipesList.filter((data: { ItemID: number }) => data.ItemID == el.ItemID);

        var recipeObject: RecipeIngredient = {
          Name: el.Name,
          ParentItemID: recipeFilter[0].ItemID,
          ItemID: el.ItemID,
          ItemURL: el.ItemURL,
          RecipeQuantity: el.Quantity,
          RequiredQuantity: recipeQuantity * el.Quantity,
          BaseIngredient: false
        };

        //If there were no results in the Child Ingredient for a Recipe, then it is a Base Ingredient
        if (recipeIsBase.length == 0)
        {
          recipeObject.BaseIngredient = true
        }

        recipeIngredients.push(recipeObject);
        this.searchRecipes(el.ItemID, recipeQuantity * el.Quantity, recipeIngredients);

      });
    }
    return recipeIngredients;
  }

  //Given a list of recipeIngredient, return all the Base Ingredients (nonCraftable) so we know how much to gather via resources/drops
  returnBaseIngredients(recipeIngredients:RecipeIngredient[])
  {
    var baseRecipeIngredients: RecipeIngredient[] = [];
    recipeIngredients.forEach((el: any) => {
      if (el.BaseIngredient == true)
      {
        var baseRecipeIngredientAdded = baseRecipeIngredients.filter((data: {ItemID: number}) => data.ItemID == el.ItemID);

        if (baseRecipeIngredientAdded.length == 0)
        {
          baseRecipeIngredients.push(el);
        }
        else
        {
          for (var i = 0; i < baseRecipeIngredients.length; i++)
          {
            if(baseRecipeIngredients[i].ItemID == el.ItemID)
            {
              baseRecipeIngredients[i].RequiredQuantity = baseRecipeIngredients[i].RequiredQuantity + el.RequiredQuantity;
            }
          }
        }
      }
    });
    baseRecipeIngredients.sort((a, b) => a.Name.toLocaleUpperCase() < b.Name.toLocaleUpperCase() ? -1 : 1);

    return baseRecipeIngredients;
  }
}

