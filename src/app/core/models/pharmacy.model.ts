export interface Pharmacy {
  id: number;
  name: string;
  logo_url?: string;
  address?: string;
  city_name?: string;
  medicines_count?: number;
  reviews_count?: number;
  avg_rating?: number;
}