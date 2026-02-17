#!/bin/bash
# ===========================================
# Komuchi — First-Time Setup
# ===========================================
# Run this once after cloning the repo:
#   chmod +x setup.sh && ./setup.sh
# ===========================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       Komuchi — First-Time Setup          ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════╝${NC}"
echo ""

cd "$(dirname "$0")"
PROJECT_ROOT=$(pwd)

# ---- Check prerequisites ----
echo "📋 Checking prerequisites..."
MISSING=0

if ! command -v node &>/dev/null; then
  echo -e "  ${RED}✗ Node.js not found${NC} — install from https://nodejs.org (v20+)"
  MISSING=1
else
  echo -e "  ${GREEN}✓ Node.js $(node -v)${NC}"
fi

if ! command -v pnpm &>/dev/null; then
  echo -e "  ${RED}✗ pnpm not found${NC} — install with: npm install -g pnpm"
  MISSING=1
else
  echo -e "  ${GREEN}✓ pnpm $(pnpm -v)${NC}"
fi

if ! command -v docker &>/dev/null; then
  echo -e "  ${RED}✗ Docker not found${NC} — install Docker Desktop from https://docker.com"
  MISSING=1
else
  echo -e "  ${GREEN}✓ Docker $(docker --version | cut -d' ' -f3 | tr -d ',')${NC}"
fi

if [ $MISSING -eq 1 ]; then
  echo ""
  echo -e "${RED}❌ Missing prerequisites. Install them and re-run this script.${NC}"
  exit 1
fi
echo ""

# ---- Create .env file ----
echo "📝 Setting up environment variables..."
if [ ! -f "$PROJECT_ROOT/apps/api/.env" ]; then
  if [ -f "$PROJECT_ROOT/apps/api/.env.example" ]; then
    cp "$PROJECT_ROOT/apps/api/.env.example" "$PROJECT_ROOT/apps/api/.env"
    echo -e "  ${GREEN}✓ Created apps/api/.env from .env.example${NC}"
    echo ""
    echo -e "  ${YELLOW}⚠️  IMPORTANT: Edit apps/api/.env and set your OPENAI_API_KEY${NC}"
    echo -e "  ${YELLOW}   Get one at: https://platform.openai.com/api-keys${NC}"
    echo ""
  else
    echo -e "  ${RED}✗ .env.example not found — creating default .env${NC}"
    cat > "$PROJECT_ROOT/apps/api/.env" << 'EOF'
DATABASE_URL="file:./prisma/dev.db"
API_PORT=3001
API_HOST=0.0.0.0
CORS_ORIGIN=http://localhost:3000,http://localhost:5174
NODE_ENV=development
REDIS_URL="redis://localhost:6379"
S3_BUCKET=komuchi
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_ENDPOINT=http://localhost:9000
TRANSCRIPTION_PROVIDER=openai
DEBRIEF_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000
MAX_UPLOAD_SIZE_MB=500
DIARIZATION_SERVICE_URL=http://localhost:8001
EOF
    echo -e "  ${YELLOW}⚠️  Edit apps/api/.env and set your OPENAI_API_KEY${NC}"
  fi
else
  echo -e "  ${GREEN}✓ apps/api/.env already exists${NC}"
fi
echo ""

# ---- Install dependencies ----
echo "📦 Installing dependencies..."
pnpm install
echo -e "  ${GREEN}✓ Dependencies installed${NC}"
echo ""

# ---- Build shared packages ----
echo "🔨 Building shared packages..."
pnpm build --filter=@komuchi/shared --filter=@komuchi/ui
echo -e "  ${GREEN}✓ Shared packages built${NC}"
echo ""

# ---- Setup database ----
echo "🗄️  Setting up database..."
cd "$PROJECT_ROOT/apps/api"
pnpm db:generate
pnpm db:push
cd "$PROJECT_ROOT"
echo -e "  ${GREEN}✓ Database ready${NC}"
echo ""

# ---- Start Docker infrastructure ----
echo "🐳 Starting Docker infrastructure (Redis, MinIO, Diarization)..."
docker compose up redis minio minio-init diarization -d 2>/dev/null || {
  echo -e "  ${YELLOW}⚠️  Docker compose failed — make sure Docker Desktop is running${NC}"
}
echo -e "  ${GREEN}✓ Docker services starting${NC}"
echo ""

# ---- Done ----
echo -e "${CYAN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║           ✅ Setup Complete!               ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════╝${NC}"
echo ""
echo "Next steps:"
echo ""
echo -e "  1. ${YELLOW}Edit apps/api/.env${NC} and set your OPENAI_API_KEY"
echo ""
echo -e "  2. Start all services:"
echo -e "     ${CYAN}./start-all.sh${NC}"
echo ""
echo -e "  3. For mobile development on a physical device,"
echo -e "     update ${YELLOW}apps/mobile/app.json${NC}:"
echo -e "     Change EXPO_PUBLIC_API_BASE_URL to ${CYAN}http://<YOUR-LAN-IP>:3001${NC}"
echo -e "     (Find your IP with: ${CYAN}ipconfig getifaddr en0${NC})"
echo ""
