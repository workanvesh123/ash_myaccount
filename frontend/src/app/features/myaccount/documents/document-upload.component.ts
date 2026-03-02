import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DocumentsService } from './documents.service';
import { MessageQueueService } from '../../../core/services/message-queue.service';

@Component({
  selector: 'app-document-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './document-upload.component.html',
  styleUrls: ['./document-upload.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentUploadComponent {
  private documentsService = inject(DocumentsService);
  private messageQueue = inject(MessageQueueService);
  private router = inject(Router);

  selectedFile = signal<File | null>(null);
  documentType = signal<'id' | 'proof_of_address'>('id');
  isUploading = signal(false);
  previewUrl = signal<string | null>(null);

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        this.messageQueue.addError('File size must be less than 5MB');
        return;
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        this.messageQueue.addError('Only PDF, JPG, and PNG files are allowed');
        return;
      }

      this.selectedFile.set(file);

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.previewUrl.set(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        this.previewUrl.set(null);
      }
    }
  }

  setDocumentType(type: 'id' | 'proof_of_address'): void {
    this.documentType.set(type);
  }

  async uploadDocument(): Promise<void> {
    const file = this.selectedFile();
    if (!file) {
      this.messageQueue.addError('Please select a file');
      return;
    }

    this.isUploading.set(true);

    try {
      await this.documentsService.uploadDocument(file, this.documentType()).toPromise();
      
      this.messageQueue.addSuccess('Document uploaded successfully');
      await this.router.navigate(['/en/myaccount/documents']);
    } catch (error: any) {
      this.messageQueue.addError(
        error?.error?.message || 'Failed to upload document'
      );
    } finally {
      this.isUploading.set(false);
    }
  }

  removeFile(): void {
    this.selectedFile.set(null);
    this.previewUrl.set(null);
  }

  cancel(): void {
    this.router.navigate(['/en/myaccount/documents']);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
