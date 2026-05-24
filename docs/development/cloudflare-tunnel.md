# Cloudflare Tunnel temporario

Use este fluxo quando nao houver dominio proprio configurado.

## Fluxo

```text
Painel publico -> https://<frontend>.trycloudflare.com
API publica    -> https://<api>.trycloudflare.com
```

O frontend deve apontar para a URL publica da API em
`src/environments/environment.development.ts`.

## Subir localmente

No backend:

```powershell
$env:ASPNETCORE_ENVIRONMENT = "Development"
$env:ASPNETCORE_URLS = "http://localhost:5080"
$env:ADMIN_FRONTEND_ORIGINS = "https://<frontend>.trycloudflare.com"
$env:ADMIN_COOKIE_CROSS_SITE = "true"
dotnet run --project C:\Repos\comandAI\src\ComandAI.Api\ComandAI.Api.csproj --launch-profile http
```

No frontend:

```powershell
Set-Location C:\Repos\comandAiFrontend
npm start
```

## Abrir tunnels

```powershell
cloudflared tunnel --url http://localhost:5080
```

```powershell
cloudflared tunnel --url http://localhost:4200
```

Copie as URLs `https://*.trycloudflare.com` exibidas pelo `cloudflared`.
