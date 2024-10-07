import { Component, OnInit } from '@angular/core';
import { ArticlesService } from '../../services/articles.service'; 
import { Theme } from '../../models/theme.model';
import { Article } from '../../models/article.model'

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})

export class HomeComponent implements OnInit {
  temas: Theme[] = []; 
  articulos: Article[] = []; 

  constructor(private articleService: ArticlesService) {}

  ngOnInit(): void {
    this.cargarTemas();
    this.cargarArticulos();
  }

  cargarTemas(): void {
    this.articleService.getThemes().subscribe(temas => {
      this.temas = temas;
    });
  }

  cargarArticulos(): void {
    this.articleService.getArticles().subscribe(articulos => {
      this.articulos = articulos;
    });
  }

  likeArticle(articleId: string): void {
    // Implementa aquí la lógica para dar "me gusta"
  }

  DislikeArticle(articleId: string): void {
    // Implementa aquí la lógica para dar "no me gusta"
  }
}
