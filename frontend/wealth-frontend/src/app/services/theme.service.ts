import { Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'wealth-tracker-theme';
  currentTheme = signal<Theme>('light');

  constructor() {
    this.initializeTheme();
  }

  private initializeTheme() {
    const savedTheme = localStorage.getItem(this.THEME_KEY) as Theme;
    if (savedTheme) {
      this.setTheme(savedTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setTheme(prefersDark ? 'dark' : 'light');
    }
  }

  setTheme(theme: Theme) {
    this.currentTheme.set(theme);
    localStorage.setItem(this.THEME_KEY, theme);

    // Apply to body
    document.body.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-theme', theme); // Just in case

    // Toggle bootstrap dark mode if needed (Bootstrap 5.3+ supports this via data-bs-theme)
    document.documentElement.setAttribute('data-bs-theme', theme);
  }

  toggleTheme() {
    const newTheme = this.currentTheme() === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  isDark(): boolean {
    return this.currentTheme() === 'dark';
  }
}
