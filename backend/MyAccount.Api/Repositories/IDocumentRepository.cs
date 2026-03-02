using MyAccount.Api.Models;

namespace MyAccount.Api.Repositories;

public interface IDocumentRepository
{
    Task<Document> AddDocumentAsync(Document document);
    Task<List<Document>> GetDocumentsByUserAsync(string userId);
    Task<bool> DeleteDocumentAsync(string documentId, string userId);
}
