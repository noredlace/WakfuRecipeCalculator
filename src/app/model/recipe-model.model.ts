export class RecipeModel {
  public ItemURL: string;
  public ItemID: number;
  public ItemImageURL: string;
  public Name: string;
  public Type: string;
  public Recipe: ChildRecipeModel;
  public Level: number;
}

export class ChildRecipeModel {
  public ItemURL: string;
  public ItemID: number;
  public ItemImageURL: string;
  public Name: string;
  public Quantity: number;
}
