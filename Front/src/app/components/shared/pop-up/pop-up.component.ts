// src/app/shared/pop-up/pop-up.component.ts

import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-pop-up',
  templateUrl: './pop-up.component.html',
  styleUrls: ['./pop-up.component.css']
})
export class PopUpComponent implements OnChanges {
  @Input() message: string = '';
  @Input() type: 'success' | 'error' | '' = '';
  @Input() isLarge: boolean = false; 
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  isVisible: boolean = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['message'] && this.message) {
      this.isVisible = true;
      // Ocultar el popup después de 2 segundos si no es una confirmación
      if (!this.isLarge) {
        setTimeout(() => {
          this.isVisible = false;
          this.cancel.emit();
        }, 2000);
      }
    }
  }

  /**
   * Maneja la confirmación del usuario.
   */
  public onConfirm(): void {
    this.isVisible = false;
    this.confirm.emit();
  }

  /**
   * Maneja la cancelación del usuario.
   */
  public onCancel(): void {
    this.isVisible = false;
    this.cancel.emit();
  }
}
