import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Document {
  documentId: string;
  filename: string;
  uploadDate: string;
  status: 'pending' | 'approved' | 'rejected';
  documentType: 'id' | 'proof_of_address';
}

export interface DocumentListResponse {
  documents: Document[];
}

export interface DocumentUploadResponse {
  documentId: string;
  filename: string;
  uploadDate: string;
  status: string;
  documentType: string;
}

export interface DeleteDocumentResponse {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/documents`;

  getDocuments(): Observable<DocumentListResponse> {
    return this.http.get<DocumentListResponse>(this.apiUrl);
  }

  uploadDocument(file: File, documentType: string): Observable<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);

    return this.http.post<DocumentUploadResponse>(`${this.apiUrl}/upload`, formData);
  }

  deleteDocument(documentId: string): Observable<DeleteDocumentResponse> {
    return this.http.delete<DeleteDocumentResponse>(`${this.apiUrl}/${documentId}`);
  }
}
