import { Injectable } from '@angular/core';

export interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
  suggestions: string[];
}

/**
 * Service for checking password strength
 */
@Injectable({
  providedIn: 'root'
})
export class PasswordStrengthService {
  /**
   * Check password strength
   */
  checkStrength(password: string): PasswordStrength {
    if (!password) {
      return {
        score: 0,
        label: 'Too weak',
        color: '#dc3545',
        suggestions: ['Password is required']
      };
    }

    let score = 0;
    const suggestions: string[] = [];

    // Length check
    if (password.length >= 8) score++;
    else suggestions.push('Use at least 8 characters');

    if (password.length >= 12) score++;

    // Lowercase check
    if (/[a-z]/.test(password)) score++;
    else suggestions.push('Add lowercase letters');

    // Uppercase check
    if (/[A-Z]/.test(password)) score++;
    else suggestions.push('Add uppercase letters');

    // Number check
    if (/\d/.test(password)) score++;
    else suggestions.push('Add numbers');

    // Special character check
    if (/[^A-Za-z0-9]/.test(password)) score++;
    else suggestions.push('Add special characters (!@#$%^&*)');

    // Common patterns check
    if (/^(password|123456|qwerty)/i.test(password)) {
      score = Math.max(0, score - 2);
      suggestions.push('Avoid common passwords');
    }

    // Normalize score to 0-4
    const normalizedScore = Math.min(4, Math.floor(score / 1.5));

    const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['#dc3545', '#fd7e14', '#ffc107', '#28a745', '#20c997'];

    return {
      score: normalizedScore,
      label: labels[normalizedScore],
      color: colors[normalizedScore],
      suggestions: suggestions.slice(0, 3) // Max 3 suggestions
    };
  }
}
