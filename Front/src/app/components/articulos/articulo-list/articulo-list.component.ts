import { Component, inject } from '@angular/core';
import { ArticulosService } from '../../../services/articulos.service';

@Component({
  selector: 'app-articulo-list',
  templateUrl: './articulo-list.component.html',
  styleUrl: './articulo-list.component.css'
})
export class ArticuloListComponent {

  articulosService = inject(ArticulosService);

  async ngOnInit() {
    const songs = await this.articulosService.getAll();
    console.log(songs);
  }

}
