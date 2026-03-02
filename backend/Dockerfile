# Backend Dockerfile for .NET 9
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj files and restore dependencies
COPY ["MyAccount.Api/MyAccount.Api.csproj", "MyAccount.Api/"]
RUN dotnet restore "MyAccount.Api/MyAccount.Api.csproj"

# Copy everything else and build
COPY . .
WORKDIR "/src/MyAccount.Api"
RUN dotnet build "MyAccount.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "MyAccount.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Set environment variables
ENV ASPNETCORE_URLS=http://+:80
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "MyAccount.Api.dll"]
