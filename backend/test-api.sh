#!/bin/bash

BASE_URL="http://localhost:3001"
echo "🧪 Testando APIs do Sistema de Crédito"
echo "========================================"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para testar endpoint
test_endpoint() {
  local method=$1
  local endpoint=$2
  local data=$3
  local auth=$4
  local desc=$5
  
  echo -e "\n${YELLOW}🔍 Testando: $desc${NC}"
  echo "   $method $endpoint"
  
  if [ ! -z "$auth" ]; then
    if [ ! -z "$data" ]; then
      response=$(curl -s -X $method "$BASE_URL$endpoint" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $auth" \
        -d "$data")
    else
      response=$(curl -s -X $method "$BASE_URL$endpoint" \
        -H "Authorization: Bearer $auth")
    fi
  else
    if [ ! -z "$data" ]; then
      response=$(curl -s -X $method "$BASE_URL$endpoint" \
        -H "Content-Type: application/json" \
        -d "$data")
    else
      response=$(curl -s -X $method "$BASE_URL$endpoint")
    fi
  fi
  
  if echo "$response" | grep -q '"success":true\|"status":"OK"'; then
    echo -e "   ${GREEN}✅ Sucesso${NC}"
  else
    echo -e "   ${RED}❌ Erro${NC}"
    echo "   Response: $response"
  fi
}

# 1. Health Check
test_endpoint "GET" "/health" "" "" "Health Check"

# 2. Login
echo -e "\n${YELLOW}🔐 Fazendo login...${NC}"
login_response=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}')

if echo "$login_response" | grep -q '"success":true'; then
  token=$(echo "$login_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
  echo -e "${GREEN}✅ Login realizado com sucesso${NC}"
  echo "   Token: ${token:0:50}..."
else
  echo -e "${RED}❌ Falha no login${NC}"
  echo "   Response: $login_response"
  exit 1
fi

# 3. Validar token
test_endpoint "POST" "/api/auth/validate" "" "$token" "Validação de Token"

# 4. Configurações de scoring
test_endpoint "GET" "/api/score/defaults" "" "$token" "Configurações Padrão de Scoring"

# 5. Listar usuários (admin only)
test_endpoint "GET" "/api/auth/users" "" "$token" "Listar Usuários"

# 6. Configurações do sistema
test_endpoint "GET" "/api/config/scoring" "" "$token" "Configurações de Scoring"

echo -e "\n${GREEN}🎉 Testes básicos concluídos!${NC}"
echo -e "\n${YELLOW}📝 Para testar com dados reais:${NC}"
echo "   1. Execute: npm run seed"
echo "   2. Teste endpoints de clientes, scores e limites"
echo -e "\n${YELLOW}🌐 Servidor rodando em:${NC} $BASE_URL"
echo -e "${YELLOW}📚 Documentação:${NC} README.md"