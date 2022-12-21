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

  constructor(private professions:ProfessionsService, private recipes:RecipesService){
    this.professions.getProfessionList().subscribe(data => {
      this.professionsList = data
    });

    this.professions.getProfessionList().subscribe(data => {
      this.professionsList = data
    });


  }

}

export class FormFieldOverviewExample {}
