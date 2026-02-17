#!/bin/bash
# ===========================================
# Komuchi — Start All Services
# ===========================================
# Starts everything needed to run the full app:
#   • Docker infra (Redis, MinIO, Diarization)
#   • API server (port 3001)
#   • Worker process (background job processing)
#   • Mobile app (Expo, port 8081)
#
# Usage:
#   ./start-all.sh          # start all services
#   ./start-all.sh --no-mobile   # skip mobile (web dev only)
#   ./start-all.sh --stop        # stop all services
# ===========================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
DIM='\033[2m'
NC='\033[0m'

cd "$(dirname "$0")"
PROJECT_ROOT=$(pwd)
LOG_DIR="$PROJECT_ROOT/.logs"
mkdir -p "$LOG_DIR"

SKIP_MOBILE=false
STOP_MODE=false

for arg in "$@"; do
  case $arg in
    --no-mobile) SKIP_MOBILE=true ;;
    --stop) STOP_MODE=true ;;
  esac
done

# ---- Stop mode ----
if [ "$STOP_MODE" = true ]; then
  echo "🛑 Stopping all Komuchi services..."
  
  # Kill background Node processes
  if [ -f "$LOG_DIR/api.pid" ]; then
    kill "$(cat "$LOG_DIR/api.pid")" 2>/dev/null && echo "  Stopped API server" || true
    rm -f "$LOG_DIR/api.pid"
  fi
  if [ -f "$LOG_DIR/worker.pid" ]; then
    kill "$(cat "$LOG_DIR/worker.pid")" 2>/dev/null && echo "  Stopped Worker" || true
    rm -f "$LOG_DIR/worker.pid"
  fi
  if [ -f "$LOG_DIR/mobile.pid" ]; then
    kill "$(cat "$LOG_DIR/mobile.pid")" 2>/dev/null && echo "  Stopped Mobile (Expo)" || true
    rm -f "$LOG_DIR/mobile.pid"
  fi
  
  # Stop Docker services
  docker compose stop redis minio diarization 2>/dev/null && echo "  Stopped Docker services" || true
  
  echo -e "${GREEN}✅ All services stopped.${NC}"
  exit 0
fi

# ---- Pre-checks ----
echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       Komuchi — Starting Services         ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════╝${NC}"
echo ""

if [ ! -f "$PROJECT_ROOT/apps/api/.env" ]; then
  echo -e "${RED}❌ apps/api/.env not found. Run ./setup.sh first.${NC}"
  exit 1
fi

if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
  echo -e "${YELLOW}📦 Dependencies not installed. Running pnpm install...${NC}"
  pnpm install
fi

# ---- 1. Docker infrastructure ----
echo "🐳 Starting Docker infrastructure..."
if docker compose up redis minio minio-init diarization -d 2>/dev/null; then
  echo -e "  ${GREEN}✓ Redis, MinIO, Diarization starting${NC}"
else
  echo -e "  ${YELLOW}⚠️  Docker failed — is Docker Desktop running?${NC}"
  echo -e "  ${DIM}  Services will still work without diarization if Docker is unavailable.${NC}"
fi
echo ""

# Wait for Redis to be ready
echo -n "  Waiting for Redis..."
for i in $(seq 1 15); do
  if docker compose exec -T redis redis-cli ping 2>/dev/null | grep -q PONG; then
    echo -e " ${GREEN}ready${NC}"
    break
  fi
  if [ $i -eq 15 ]; then
    echo -e " ${YELLOW}timeout (may still be starting)${NC}"
  fi
  sleep 1
done
echo ""

# ---- 2. Build shared packages (if not built) ----
if [ ! -d "$PROJECT_ROOT/packages/shared/dist" ]; then
  echo "🔨 Building shared packages..."
  pnpm build --filter=@komuchi/shared --filter=@komuchi/ui
  echo -e "  ${GREEN}✓ Shared packages built${NC}"
  echo ""
fi

# ---- 3. API Server ----
echo "📡 Starting API server..."
# Kill old process if running
if [ -f "$LOG_DIR/api.pid" ]; then
  kill "$(cat "$LOG_DIR/api.pid")" 2>/dev/null || true
fi
cd "$PROJECT_ROOT/apps/api"
pnpm dev > "$LOG_DIR/api.log" 2>&1 &
echo $! > "$LOG_DIR/api.pid"
echo -e "  ${GREEN}✓ API server starting (PID: $(cat "$LOG_DIR/api.pid"))${NC}"
echo -e "  ${DIM}  Log: tail -f $LOG_DIR/api.log${NC}"
echo ""

# Wait for API to be ready
echo -n "  Waiting for API..."
for i in $(seq 1 20); do
  if curl -sf http://localhost:3001/api/health >/dev/null 2>&1; then
    echo -e " ${GREEN}ready${NC}"
    break
  fi
  if [ $i -eq 20 ]; then
    echo -e " ${YELLOW}timeout — check log${NC}"
  fi
  sleep 1
done
echo ""

# ---- 4. Worker process ----
echo "⚙️  Starting Worker process..."
if [ -f "$LOG_DIR/worker.pid" ]; then
  kill "$(cat "$LOG_DIR/worker.pid")" 2>/dev/null || true
fi
cd "$PROJECT_ROOT/apps/api"
pnpm dev:worker > "$LOG_DIR/worker.log" 2>&1 &
echo $! > "$LOG_DIR/worker.pid"
echo -e "  ${GREEN}✓ Worker starting (PID: $(cat "$LOG_DIR/worker.pid"))${NC}"
echo -e "  ${DIM}  Log: tail -f $LOG_DIR/worker.log${NC}"
echo ""

# ---- 5. Mobile app (optional) ----
if [ "$SKIP_MOBILE" = false ]; then
  echo "📱 Starting Mobile app (Expo)..."
  if [ -f "$LOG_DIR/mobile.pid" ]; then
    kill "$(cat "$LOG_DIR/mobile.pid")" 2>/dev/null || true
  fi
  cd "$PROJECT_ROOT/apps/mobile"
  pnpm start > "$LOG_DIR/mobile.log" 2>&1 &
  echo $! > "$LOG_DIR/mobile.pid"
  echo -e "  ${GREEN}✓ Expo starting (PID: $(cat "$LOG_DIR/mobile.pid"))${NC}"
  echo -e "  ${DIM}  Log: tail -f $LOG_DIR/mobile.log${NC}"
  echo ""
fi

# ---- Summary ----
# Get the machine's LAN IP for mobile device instructions
LAN_IP=$(ipconfig getifaddr en0 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}' || echo "<your-lan-ip>")

echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║          ✅ All Services Running!          ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════╝${NC}"
echo ""
echo "  📡 API Server:       http://localhost:3001"
echo "  ⚙️  Worker:           running (recording processing)"
echo "  🗄️  Redis:            localhost:6379"
echo "  📦 MinIO:            http://localhost:9001 (admin: minioadmin/minioadmin)"
echo "  🎙️  Diarization:      http://localhost:8001"
if [ "$SKIP_MOBILE" = false ]; then
  echo "  📱 Mobile (Expo):    Press 'i' in Expo log for iOS Simulator"
fi
echo ""
echo -e "${YELLOW}📱 For mobile on a physical device:${NC}"
echo -e "  Update apps/mobile/app.json → EXPO_PUBLIC_API_BASE_URL"
echo -e "  to: ${CYAN}http://${LAN_IP}:3001${NC}"
echo ""
echo -e "${DIM}Logs are in: $LOG_DIR/${NC}"
echo ""
echo "🛑 To stop everything:"
echo "   ./start-all.sh --stop"
echo ""
