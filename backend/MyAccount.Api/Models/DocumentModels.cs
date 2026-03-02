namespace MyAccount.Api.Models;

public record Document(
    string DocumentId,
    string UserId,
    string Filename,
    DateTime UploadDate,
    string Status, // "pending", "approved", "rejected"
    string DocumentType, // "id", "proof_of_address"
    byte[] FileData
);

public record DocumentResponse(
    string DocumentId,
    string Filename,
    DateTime UploadDate,
    string Status,
    string DocumentType
);

public record DocumentListResponse(
    List<DocumentResponse> Documents
);

public record DeleteDocumentResponse(
    bool Success,
    string Message
);
