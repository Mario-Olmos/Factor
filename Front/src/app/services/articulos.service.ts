import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ArticulosService {

  httpClient = inject(HttpClient);
  baseUrl = 'ttp://localhost:3000/api/songs'

  getAll() {
    firstValueFrom(
      this.httpClient.get<any[]>(this.baseUrl)
    )
  }

  getById(songId: string) {
    firstValueFrom(
      this.httpClient.get<any[]>(`${this.baseUrl}/${songId}`)
    ) 
  }
}
