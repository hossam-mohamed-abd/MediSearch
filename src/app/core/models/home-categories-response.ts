import { Category } from './category.model';
export interface HomeCategoriesResponse {
  success: boolean;
  total: number;
  remaining: number;
  data: Category[];
}