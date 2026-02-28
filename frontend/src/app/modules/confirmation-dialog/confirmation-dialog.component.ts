import { AuthService } from '@/app/auth.service';
import { Component } from '@angular/core';

@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss'],
})
export class ConfirmationDialogComponent {
  bookingTypeResort: string;
  showCancelBtn: any = true;

  constructor(private authService: AuthService) {
    const status = localStorage.getItem('showCancel');
    this.showCancelBtn = status !== 'no';
  }

  /**
   * Called only when the user wants to fully clear their booking and start over.
   * NOT called when clicking Yes to go back and modify the selection.
   */
  clearData() {
    localStorage.setItem('showCancel', 'yes');
    this.authService.clearBookingRooms(this.bookingTypeResort);
  }
}
