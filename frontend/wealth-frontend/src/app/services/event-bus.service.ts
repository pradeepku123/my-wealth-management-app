import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventBusService {
  // Emits when a mutual fund-related change occurs (add/edit/delete)
  private mutualFundUpdatedSource = new Subject<any>();
  mutualFundUpdated$ = this.mutualFundUpdatedSource.asObservable();

  emitMutualFundUpdated(payload?: any) {
    this.mutualFundUpdatedSource.next(payload);
  }
}
