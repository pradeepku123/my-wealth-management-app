import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SessionTimeoutService {
  private timeoutId: any;
  private timerIntervalId: any;
  private readonly TIMEOUT_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly WARNING_DURATION = 1 * 60 * 1000; // 1 minutes before timeout
  
  private sessionExpired = new Subject<void>();
  private sessionWarning = new Subject<number>();
  private remainingTime = new BehaviorSubject<number>(this.TIMEOUT_DURATION);
  private showTimer = new BehaviorSubject<boolean>(false);

  sessionExpired$ = this.sessionExpired.asObservable();
  sessionWarning$ = this.sessionWarning.asObservable();
  remainingTime$ = this.remainingTime.asObservable();
  showTimer$ = this.showTimer.asObservable();

  constructor(private router: Router) {
    this.setupActivityListeners();
  }

  startSession() {
    this.resetTimer();
  }

  resetTimer() {
    this.clearTimer();
    this.remainingTime.next(this.TIMEOUT_DURATION);
    this.showTimer.next(false);
    
    this.timeoutId = setTimeout(() => {
      this.logout();
    }, this.TIMEOUT_DURATION);
    
    this.startTimerDisplay();
  }

  private startTimerDisplay() {
    this.clearTimerDisplay();
    const startTime = Date.now();
    
    this.timerIntervalId = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, this.TIMEOUT_DURATION - elapsed);
      this.remainingTime.next(remaining);
      
      // Show timer only during warning period (last 2 minutes)
      const shouldShowTimer = remaining <= this.WARNING_DURATION && remaining > 0;
      this.showTimer.next(shouldShowTimer);
      
      if (remaining === 0) {
        this.clearTimerDisplay();
      }
    }, 1000);
  }

  private clearTimerDisplay() {
    if (this.timerIntervalId) {
      clearInterval(this.timerIntervalId);
    }
  }

  private clearTimer() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.clearTimerDisplay();
  }

  private setupActivityListeners() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, () => {
        if (localStorage.getItem('token')) {
          this.resetTimer();
        }
      }, true);
    });
  }

  private logout() {
    localStorage.removeItem('token');
    this.sessionExpired.next();
  }

  stopSession() {
    this.clearTimer();
    this.remainingTime.next(this.TIMEOUT_DURATION);
    this.showTimer.next(false);
  }
}