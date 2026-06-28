import { Component } from '@angular/core';
import { HeroComponent } from "./components/hero/hero.component";
import { PopularSearchesComponent } from "./components/popular-searches/popular-searches.component";
import { TrendingMedicinesComponent } from "./components/trending-medicines/trending-medicines.component";
import { CategoriesComponent } from './components/categories/categories.component';
import { FeaturedPharmaciesComponent } from "./components/featured-pharmacies/featured-pharmacies.component";
import { AiFeaturesComponent } from "./components/ai-features/ai-features.component";
import { HowItWorksComponent } from "./components/how-it-works/how-it-works.component";
import { StatisticsComponent } from "./components/statistics/statistics.component";
import { AiChatComponent } from "../ai-assistan/ai-assistan.component";
import { FooterComponent } from "../shared/footer/footer.component";

@Component({
  selector: 'app-home',
  imports: [HeroComponent, PopularSearchesComponent, TrendingMedicinesComponent, CategoriesComponent, FeaturedPharmaciesComponent, AiFeaturesComponent, HowItWorksComponent, StatisticsComponent, AiChatComponent, FooterComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {

}
