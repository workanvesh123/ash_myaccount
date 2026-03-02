using MyAccount.Api.Models;
using MyAccount.Api.Repositories;
using Serilog;

namespace MyAccount.Api.Features.DocumentUpload;

public static class DocumentUploadEndpoints
{
    public static void MapDocumentUploadEndpoints(this RouteGroupBuilder group)
    {
        var endpoints = group.MapGroup("/documents")
            .WithTags("Document Upload")
            .WithOpenApi();

        endpoints.MapPost("/upload", UploadDocument)
            .WithName("UploadDocument")
            .WithSummary("Upload a document")
            .WithDescription("Uploads a KYC document (ID or proof of address). Max file size: 5MB. Allowed types: PDF, JPG, PNG")
            .DisableAntiforgery()
            .Produces<DocumentResponse>(200)
            .Produces(400)
            .Produces(401);

        endpoints.MapGet("", GetDocuments)
            .WithName("GetDocuments")
            .WithSummary("Get user documents")
            .WithDescription("Retrieves all documents uploaded by the authenticated user")
            .Produces<DocumentListResponse>(200)
            .Produces(401);

        endpoints.MapDelete("/{id}", DeleteDocument)
            .WithName("DeleteDocument")
            .WithSummary("Delete a document")
            .WithDescription("Deletes a pending document. Only pending documents can be deleted.")
            .Produces<DeleteDocumentResponse>(200)
            .Produces(400)
            .Produces(401);
    }

    private static async Task<IResult> UploadDocument(
        HttpContext context,
        IDocumentRepository documentRepository)
    {
        var logger = Log.ForContext(typeof(DocumentUploadEndpoints));
        var userId = GetUserIdFromToken(context);
        
        if (string.IsNullOrEmpty(userId))
            return Results.Unauthorized();

        // Check content length before reading form
        const long maxFileSize = 5 * 1024 * 1024; // 5MB
        if (context.Request.ContentLength > maxFileSize)
        {
            logger.Warning("Document upload rejected for user {UserId} - File too large: {Size} bytes", 
                userId, context.Request.ContentLength);
            return Results.BadRequest(new { Message = "File size must be less than 5MB" });
        }

        var form = await context.Request.ReadFormAsync();
        var file = form.Files["file"];
        var documentType = form["documentType"].ToString();

        if (file == null || file.Length == 0)
            return Results.BadRequest(new { Message = "No file uploaded" });

        // Validate file size (5MB max)
        if (file.Length > 5 * 1024 * 1024)
            return Results.BadRequest(new { Message = "File size must be less than 5MB" });

        // Validate file type
        var allowedTypes = new[] { "application/pdf", "image/jpeg", "image/png" };
        if (!allowedTypes.Contains(file.ContentType))
            return Results.BadRequest(new { Message = "Only PDF, JPG, and PNG files are allowed" });

        // Read file data
        using var memoryStream = new MemoryStream();
        await file.CopyToAsync(memoryStream);
        var fileData = memoryStream.ToArray();

        var document = new Document(
            DocumentId: Guid.NewGuid().ToString(),
            UserId: userId,
            Filename: file.FileName,
            UploadDate: DateTime.UtcNow,
            Status: "pending",
            DocumentType: documentType,
            FileData: fileData
        );

        await documentRepository.AddDocumentAsync(document);
        
        logger.Information("Document uploaded successfully for user {UserId}: {Filename} ({Size} bytes)", 
            userId, document.Filename, fileData.Length);

        return Results.Ok(new DocumentResponse(
            document.DocumentId,
            document.Filename,
            document.UploadDate,
            document.Status,
            document.DocumentType
        ));
    }

    private static async Task<IResult> GetDocuments(
        IDocumentRepository documentRepository,
        HttpContext context)
    {
        var userId = GetUserIdFromToken(context);
        if (string.IsNullOrEmpty(userId))
            return Results.Unauthorized();

        var documents = await documentRepository.GetDocumentsByUserAsync(userId);

        var response = new DocumentListResponse(
            documents.Select(d => new DocumentResponse(
                d.DocumentId,
                d.Filename,
                d.UploadDate,
                d.Status,
                d.DocumentType
            )).ToList()
        );

        return Results.Ok(response);
    }

    private static async Task<IResult> DeleteDocument(
        string id,
        IDocumentRepository documentRepository,
        HttpContext context)
    {
        var userId = GetUserIdFromToken(context);
        if (string.IsNullOrEmpty(userId))
            return Results.Unauthorized();

        var deleted = await documentRepository.DeleteDocumentAsync(id, userId);

        if (!deleted)
            return Results.BadRequest(new { Message = "Document not found or cannot be deleted" });

        return Results.Ok(new DeleteDocumentResponse(
            Success: true,
            Message: "Document deleted successfully"
        ));
    }

    private static string GetUserIdFromToken(HttpContext context)
    {
        var authHeader = context.Request.Headers.Authorization.ToString();
        if (string.IsNullOrEmpty(authHeader))
            return string.Empty;

        return authHeader.Replace("Bearer ", "");
    }
}
