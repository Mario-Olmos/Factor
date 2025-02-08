import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-privileges-pop-up',
  templateUrl: './privileges-pop-up.component.html',
  styleUrls: ['./privileges-pop-up.component.css']
})
export class PrivilegesPopUpComponent {
  @Input() currentVotesThisWeek!: number;
  @Input() maxVotesThisWeek!: string;
  @Input() currentPublicationsThisMonth!: number;
  @Input() maxPublicationsThisMonth!: string;

  @Output() onClose = new EventEmitter<void>();

  public close(): void {
    this.onClose.emit();
  }
}
