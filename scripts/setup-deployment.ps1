# PowerShell script to help setup deployment
# Run this to check prerequisites and guide through deployment setup

Write-Host "🚀 MyAccount Platform - Deployment Setup" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check Git
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
Write-Host ""

$gitInstalled = Get-Command git -ErrorAction SilentlyContinue
if ($gitInstalled) {
    Write-Host "✅ Git installed" -ForegroundColor Green
} else {
    Write-Host "❌ Git not found. Please install Git first." -ForegroundColor Red
    exit 1
}

# Check .NET
$dotnetInstalled = Get-Command dotnet -ErrorAction SilentlyContinue
if ($dotnetInstalled) {
    $dotnetVersion = dotnet --version
    Write-Host "✅ .NET installed (version $dotnetVersion)" -ForegroundColor Green
} else {
    Write-Host "⚠️  .NET not found. Install .NET 9 SDK" -ForegroundColor Yellow
}

# Check Node.js
$nodeInstalled = Get-Command node -ErrorAction SilentlyContinue
if ($nodeInstalled) {
    $nodeVersion = node --version
    Write-Host "✅ Node.js installed ($nodeVersion)" -ForegroundColor Green
} else {
    Write-Host "⚠️  Node.js not found. Install Node.js 20.x" -ForegroundColor Yellow
}

# Check Docker
$dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue
if ($dockerInstalled) {
    Write-Host "✅ Docker installed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Docker not found (optional)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Choose your deployment platform:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Azure (Recommended for production)" -ForegroundColor White
Write-Host "   - Best for .NET apps" -ForegroundColor Gray
Write-Host "   - Free tier available" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Railway (Easiest setup)" -ForegroundColor White
Write-Host "   - 5 minutes to deploy" -ForegroundColor Gray
Write-Host "   - `$5/month free credit" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Vercel (Frontend only)" -ForegroundColor White
Write-Host "   - Best for Angular apps" -ForegroundColor Gray
Write-Host "   - Generous free tier" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Docker (Self-hosted)" -ForegroundColor White
Write-Host "   - Full control" -ForegroundColor Gray
Write-Host "   - Requires VPS" -ForegroundColor Gray
Write-Host ""

$choice = Read-Host "Enter your choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🔵 Azure Deployment Setup" -ForegroundColor Blue
        Write-Host "=========================" -ForegroundColor Blue
        Write-Host ""
        Write-Host "Steps to deploy to Azure:" -ForegroundColor Yellow
        Write-Host "1. Create Azure account: https://azure.microsoft.com/free/" -ForegroundColor White
        Write-Host "2. Install Azure CLI: winget install Microsoft.AzureCLI" -ForegroundColor White
        Write-Host "3. Run: az login" -ForegroundColor White
        Write-Host "4. Follow instructions in DEPLOYMENT_GUIDE.md (Azure section)" -ForegroundColor White
        Write-Host ""
        Write-Host "Open DEPLOYMENT_GUIDE.md now? (Y/N)" -ForegroundColor Yellow
        $open = Read-Host
        if ($open -eq "Y" -or $open -eq "y") {
            Start-Process "DEPLOYMENT_GUIDE.md"
        }
    }
    "2" {
        Write-Host ""
        Write-Host "🚂 Railway Deployment Setup" -ForegroundColor Magenta
        Write-Host "===========================" -ForegroundColor Magenta
        Write-Host ""
        Write-Host "Steps to deploy to Railway:" -ForegroundColor Yellow
        Write-Host "1. Create account: https://railway.app/" -ForegroundColor White
        Write-Host "2. Connect your GitHub repository" -ForegroundColor White
        Write-Host "3. Create two projects (backend & frontend)" -ForegroundColor White
        Write-Host "4. Get Railway token and add to GitHub secrets" -ForegroundColor White
        Write-Host ""
        Write-Host "Open Railway website? (Y/N)" -ForegroundColor Yellow
        $open = Read-Host
        if ($open -eq "Y" -or $open -eq "y") {
            Start-Process "https://railway.app/"
        }
    }
    "3" {
        Write-Host ""
        Write-Host "▲ Vercel Deployment Setup" -ForegroundColor Cyan
        Write-Host "=========================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Steps to deploy to Vercel:" -ForegroundColor Yellow
        Write-Host "1. Install Vercel CLI: npm install -g vercel" -ForegroundColor White
        Write-Host "2. Run: cd frontend && vercel login" -ForegroundColor White
        Write-Host "3. Run: vercel link" -ForegroundColor White
        Write-Host "4. Get token: vercel token create" -ForegroundColor White
        Write-Host "5. Add VERCEL_TOKEN to GitHub secrets" -ForegroundColor White
        Write-Host ""
        Write-Host "Install Vercel CLI now? (Y/N)" -ForegroundColor Yellow
        $install = Read-Host
        if ($install -eq "Y" -or $install -eq "y") {
            npm install -g vercel
        }
    }
    "4" {
        Write-Host ""
        Write-Host "🐳 Docker Deployment Setup" -ForegroundColor Blue
        Write-Host "==========================" -ForegroundColor Blue
        Write-Host ""
        if ($dockerInstalled) {
            Write-Host "Docker is installed! ✅" -ForegroundColor Green
            Write-Host ""
            Write-Host "Build and run locally? (Y/N)" -ForegroundColor Yellow
            $run = Read-Host
            if ($run -eq "Y" -or $run -eq "y") {
                Write-Host ""
                Write-Host "Building and starting containers..." -ForegroundColor Yellow
                docker-compose up -d
                Write-Host ""
                Write-Host "✅ Containers started!" -ForegroundColor Green
                Write-Host "Frontend: http://localhost:4200" -ForegroundColor Cyan
                Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan
                Write-Host ""
                Write-Host "View logs: docker-compose logs -f" -ForegroundColor Gray
                Write-Host "Stop: docker-compose down" -ForegroundColor Gray
            }
        } else {
            Write-Host "Docker is not installed." -ForegroundColor Red
            Write-Host "Install Docker Desktop: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
        }
    }
    default {
        Write-Host "Invalid choice. Please run the script again." -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "📚 Resources:" -ForegroundColor Cyan
Write-Host "- DEPLOYMENT_GUIDE.md - Complete deployment guide" -ForegroundColor White
Write-Host "- .github/workflows/ - CI/CD pipeline files" -ForegroundColor White
Write-Host "- docker-compose.yml - Docker configuration" -ForegroundColor White
Write-Host ""
Write-Host "Need help? Check DEPLOYMENT_GUIDE.md" -ForegroundColor Yellow
Write-Host ""
