import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-pop-up',
  templateUrl: './pop-up.component.html',
  styleUrls: ['./pop-up.component.css']
})
export class PopUpComponent implements OnChanges {
  @Input() message: string = '';
  @Input() type: 'success' | 'error' | '' = '';
  @Output() closed = new EventEmitter<void>();

  isVisible: boolean = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['message'] && this.message) {
      this.isVisible = true;
      setTimeout(() => {
        this.isVisible = false;
        this.closed.emit(); 
      }, 2000);
    }
  }
}