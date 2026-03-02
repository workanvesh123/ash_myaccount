import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Service for managing user avatar
 */
@Injectable({
  providedIn: 'root'
})
export class AvatarService {
  private platformId = inject(PLATFORM_ID);
  private avatarSignal = signal<string | null>(null);

  /**
   * Read-only signal of avatar URL
   */
  readonly avatar = this.avatarSignal.asReadonly();

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // Load saved avatar from localStorage
      const savedAvatar = localStorage.getItem('userAvatar');
      if (savedAvatar) {
        this.avatarSignal.set(savedAvatar);
      }
    }
  }

  /**
   * Set avatar from file
   */
  setAvatarFromFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        this.setAvatar(dataUrl);
        resolve(dataUrl);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  /**
   * Set avatar URL
   */
  setAvatar(url: string): void {
    this.avatarSignal.set(url);
    
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('userAvatar', url);
    }
  }

  /**
   * Clear avatar
   */
  clearAvatar(): void {
    this.avatarSignal.set(null);
    
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('userAvatar');
    }
  }

  /**
   * Get initials from name for default avatar
   */
  getInitials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
}
