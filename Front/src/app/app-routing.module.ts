import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ArticuloListComponent } from './components/articulos/articulo-list/articulo-list.component';
import { ArticuloDetailComponent } from './components/articulos/articulo-detail/articulo-detail.component';

const routes: Routes = [
  { path: 'songs', component: ArticuloListComponent},
  { path: 'songs/:songId', component: ArticuloDetailComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
