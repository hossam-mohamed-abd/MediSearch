import { Component } from '@angular/core';
import { HeroComponent } from "./components/hero/hero.component";
import { PopularSearchesComponent } from "./components/popular-searches/popular-searches.component";
import { CategoriesComponent } from './components/categories/categories.component';
import { AiFeaturesComponent } from "./components/ai-features/ai-features.component";
import { HowItWorksComponent } from "./components/how-it-works/how-it-works.component";
import { StatisticsComponent } from "./components/statistics/statistics.component";
import { AiChatComponent } from "../ai-assistan/ai-assistan.component";
import { FooterComponent } from "../shared/footer/footer.component";
import { FeaturedMedicinesComponent } from "./components/featured-medicines/featured-medicines.component";
import { PharmaciesSectionComponent } from "./components/featured-pharmacies/featured-pharmacies.component";

@Component({
  selector: 'app-home',
  imports: [HeroComponent, PopularSearchesComponent, CategoriesComponent, AiFeaturesComponent, HowItWorksComponent, StatisticsComponent, AiChatComponent, FooterComponent, FeaturedMedicinesComponent, PharmaciesSectionComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {

}
