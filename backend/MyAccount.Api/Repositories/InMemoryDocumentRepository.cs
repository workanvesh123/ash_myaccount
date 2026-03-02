using MyAccount.Api.Models;

namespace MyAccount.Api.Repositories;

public class InMemoryDocumentRepository : IDocumentRepository
{
    private readonly Dictionary<string, Document> _documents = new();

    public Task<Document> AddDocumentAsync(Document document)
    {
        _documents[document.DocumentId] = document;
        return Task.FromResult(document);
    }

    public Task<List<Document>> GetDocumentsByUserAsync(string userId)
    {
        var userDocuments = _documents.Values
            .Where(d => d.UserId == userId)
            .ToList();
        return Task.FromResult(userDocuments);
    }

    public Task<bool> DeleteDocumentAsync(string documentId, string userId)
    {
        if (!_documents.TryGetValue(documentId, out var document))
            return Task.FromResult(false);

        if (document.UserId != userId)
            return Task.FromResult(false);

        if (document.Status != "pending")
            return Task.FromResult(false);

        _documents.Remove(documentId);
        return Task.FromResult(true);
    }
}
