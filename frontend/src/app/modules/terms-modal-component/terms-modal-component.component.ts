import { Component } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
@Component({
  selector: 'app-terms-modal-component',
  templateUrl: './terms-modal-component.component.html',
  styleUrls: ['./terms-modal-component.component.scss']
})
export class TermsModalComponentComponent {
  constructor(
    public dialogRef: MatDialogRef<TermsModalComponentComponent>,
  ){}
  agree() {
    this.dialogRef.close('agree');
  }

  disagree() {
    this.dialogRef.close('disagree');
  }
}
