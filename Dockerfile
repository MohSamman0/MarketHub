FROM node:24-alpine AS frontend
WORKDIR /web
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY Directory.Build.props NuGet.Config ./
COPY backend/ backend/
RUN dotnet restore backend/MarketHub.Api/MarketHub.Api.csproj
COPY --from=frontend /web/dist/markethub/browser/ backend/MarketHub.Api/wwwroot/
RUN dotnet publish backend/MarketHub.Api/MarketHub.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app/ ./
USER root
RUN mkdir -p /app/App_Data && chown -R $APP_UID:$APP_UID /app
USER $APP_UID
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "MarketHub.Api.dll"]
