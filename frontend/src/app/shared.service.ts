import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  private fetchRoomListSubject = new Subject<void>();

  fetchRoomList$ = this.fetchRoomListSubject.asObservable();

  constructor() { }

  triggerFetchRoomList() {
    this.fetchRoomListSubject.next();
  }
}
