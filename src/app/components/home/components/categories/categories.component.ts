import { Component, OnInit, inject, signal } from '@angular/core';

import { CategoryService } from '../../../../core/services/category.service';

import { Category } from '../../../../core/models/category.model';

@Component({
  selector: 'app-categories',
  imports: [],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.css',
})
export class CategoriesComponent implements OnInit {
  private categoryService = inject(CategoryService);

  categories = signal<Category[]>([]);

  remaining = signal(0);

  loading = signal(true);

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.categoryService.getHomeCategories().subscribe({
      next: (res) => {
        this.categories.set(res.data);

        this.remaining.set(res.remaining);

        this.loading.set(false);
      },

      error: (err) => {
        console.error(err);

        this.loading.set(false);
      },
    });
  }
}
