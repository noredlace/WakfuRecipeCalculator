export class RecipeModel {
  public urlID: string;
  public ItemID: string;
  public urlImage: string;
  public Name: string;
  public Type: string;
  public Recipe: ChildRecipeModel;
  public Level: string;
}

export class ChildRecipeModel {
  public urlID: string;
  public urlImage: string;
  public qty: string;
}
