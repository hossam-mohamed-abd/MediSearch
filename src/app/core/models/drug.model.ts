export interface Drug {
  id: number;
  name: string;
  active_substance: string;
  dosage_form: string;
  strength: string;
  manufacturer: string;
  description?: string;
  image_url?: string;
  category_name?: string;
  min_price?: number;
  pharmacy_count?: number;
  alternatives_count?: number;
  is_available?: boolean;
  is_favorite?: boolean;
}



export interface FeaturedMedicinesResponse {
  success: boolean;
  hasMore: boolean;
  data: Drug[];
}


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