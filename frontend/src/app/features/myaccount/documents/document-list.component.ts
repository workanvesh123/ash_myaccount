import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { DocumentsService, Document } from './documents.service';
import { MessageQueueService } from '../../../core/services/message-queue.service';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './document-list.component.html',
  styleUrls: ['./document-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentListComponent implements OnInit {
  private documentsService = inject(DocumentsService);
  private messageQueue = inject(MessageQueueService);
  private router = inject(Router);

  documents = signal<Document[]>([]);
  isLoading = signal(true);
  deletingId = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    await this.loadDocuments();
  }

  async loadDocuments(): Promise<void> {
    this.isLoading.set(true);
    try {
      const response = await this.documentsService.getDocuments().toPromise();
      if (response) {
        this.documents.set(response.documents);
      }
    } catch (error: any) {
      this.messageQueue.addError('Failed to load documents');
    } finally {
      this.isLoading.set(false);
    }
  }

  async deleteDocument(documentId: string): Promise<void> {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    this.deletingId.set(documentId);

    try {
      await this.documentsService.deleteDocument(documentId).toPromise();
      this.messageQueue.addSuccess('Document deleted successfully');
      await this.loadDocuments();
    } catch (error: any) {
      this.messageQueue.addError(
        error?.error?.message || 'Failed to delete document'
      );
    } finally {
      this.deletingId.set(null);
    }
  }

  navigateToUpload(): void {
    this.router.navigate(['/en/myaccount/documents/upload']);
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  getDocumentTypeLabel(type: string): string {
    return type === 'id' ? 'ID Document' : 'Proof of Address';
  }
}
