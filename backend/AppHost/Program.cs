var builder = DistributedApplication.CreateBuilder(args);

// Add MyAccount API service
var myAccountApi = builder.AddProject("myaccount-api", "../MyAccount.Api/MyAccount.Api.csproj");

builder.Build().Run();
