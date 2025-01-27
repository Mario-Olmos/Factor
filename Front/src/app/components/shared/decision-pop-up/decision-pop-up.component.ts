import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-decision-pop-up',
  templateUrl: './decision-pop-up.component.html',
  styleUrl: './decision-pop-up.component.css'
})
export class DecisionPopUpComponent {
  @Output() deleteChoice = new EventEmitter<boolean>(); // Emite true o false
  @Output() closePopup = new EventEmitter<void>();


  /**
     * Confirma la elección del usuario.
     * @param deleteArticles Indica si se deben eliminar los artículos.
     */
  confirm(deleteArticles: boolean): void {
    this.deleteChoice.emit(deleteArticles);
  }

  /**
   * Cierra el pop-up sin realizar ninguna acción.
   */
  close(): void {
    this.closePopup.emit();
  }

  /**
   * Maneja el clic en el overlay para cerrar el pop-up.
   * @param event Evento de clic.
   */
  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('popup-overlay')) {
      this.close();
    }
  }
}
