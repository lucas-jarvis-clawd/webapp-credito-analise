#!/bin/bash

echo "🚀 Iniciando servidor de análise de crédito..."
echo "============================================="

# Verificar se as dependências estão instaladas
if [ ! -d "node_modules" ]; then
  echo "📦 Instalando dependências..."
  npm install
fi

# Verificar se o build existe
if [ ! -d "dist" ]; then
  echo "🔨 Compilando TypeScript..."
  npm run build
fi

# Criar diretório de logs se não existir
mkdir -p logs

echo ""
echo "✅ Servidor pronto!"
echo "📊 Sistema: Análise de Crédito"
echo "🌐 URL: http://localhost:3001"
echo "📚 Docs: README.md"
echo ""
echo "🧪 Para testar as APIs: ./test-api.sh"
echo "🌱 Para gerar dados fake: npm run seed"
echo ""
echo "Iniciando servidor em modo desenvolvimento..."
echo "============================================="

# Iniciar servidor
npm run dev