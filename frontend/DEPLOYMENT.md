# Guia de Deployment - CreditAnalyzer Frontend

## 🚀 Deploy para Produção

### 1. Build da Aplicação

```bash
# Instalar dependências
npm install

# Criar build de produção
npm run build
```

O build será gerado na pasta `dist/`.

### 2. Variáveis de Ambiente

Crie um arquivo `.env.production` com as configurações:

```bash
REACT_APP_API_URL=https://api.creditanalyzer.com
REACT_APP_AUTH_TIMEOUT=3600000
REACT_APP_COMPANY_NAME=CreditAnalyzer
```

### 3. Servidor Web

#### Nginx
```nginx
server {
    listen 80;
    server_name creditanalyzer.com;
    root /var/www/creditanalyzer/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Apache
```apache
<VirtualHost *:80>
    ServerName creditanalyzer.com
    DocumentRoot /var/www/creditanalyzer/dist
    
    <Directory "/var/www/creditanalyzer/dist">
        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
</VirtualHost>
```

### 4. Docker

#### Dockerfile
```dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Docker Compose
```yaml
version: '3.8'
services:
  frontend:
    build: .
    ports:
      - "80:80"
    environment:
      - REACT_APP_API_URL=http://backend:3001/api
    depends_on:
      - backend
```

### 5. Vercel (Deploy Rápido)

```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### 6. Netlify

1. Conectar repositório ao Netlify
2. Configurar build:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Adicionar variáveis de ambiente no painel

### 7. AWS S3 + CloudFront

```bash
# Build da aplicação
npm run build

# Sync com S3
aws s3 sync dist/ s3://creditanalyzer-frontend --delete

# Invalidar cache CloudFront
aws cloudfront create-invalidation --distribution-id XXXX --paths "/*"
```

## 🔧 Configurações Avançadas

### Otimizações de Performance

1. **Code Splitting**: Já implementado com React lazy loading
2. **Bundle Analysis**: 
   ```bash
   npm install -D vite-bundle-analyzer
   npm run build:analyze
   ```

### Monitoramento

1. **Sentry** para error tracking
2. **Google Analytics** para métricas
3. **New Relic** para performance

### Segurança

1. **HTTPS** obrigatório
2. **Content Security Policy**
3. **Headers de segurança**

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
```

### CI/CD Pipeline

#### GitHub Actions
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm install
      
    - name: Run tests
      run: npm run test
      
    - name: Build
      run: npm run build
      
    - name: Deploy to S3
      run: aws s3 sync dist/ s3://${{ secrets.S3_BUCKET }} --delete
```

## 📊 Checklist de Deploy

- [ ] Build sem erros
- [ ] Testes passando
- [ ] Variáveis de ambiente configuradas
- [ ] URLs da API corretas
- [ ] HTTPS configurado
- [ ] Gzip/Brotli habilitado
- [ ] Cache headers configurados
- [ ] Error tracking ativo
- [ ] Backup do deploy anterior
- [ ] Monitoramento funcionando

## 🚨 Rollback

Em caso de problemas:

```bash
# AWS S3
aws s3 sync s3://creditanalyzer-backup/ s3://creditanalyzer-frontend/

# Docker
docker rollback creditanalyzer_frontend

# Netlify
netlify deploy --prod --dir=dist-backup
```

---

**Sempre teste em ambiente de staging antes do deploy em produção!** 🎯