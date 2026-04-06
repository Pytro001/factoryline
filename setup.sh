#!/bin/bash
set -e

echo ""
echo "╔══════════════════════════════╗"
echo "║   🏭  Factoryline Setup       ║"
echo "╚══════════════════════════════╝"
echo ""

# ── Check Ollama ──────────────────────────────────────────────────────────────
if ! command -v ollama &>/dev/null; then
  echo "▸ Ollama not found — installing via Homebrew..."
  if command -v brew &>/dev/null; then
    brew install ollama
    echo "✔ Ollama installed"
  else
    echo ""
    echo "⚠  Homebrew not found."
    echo "   Please install Ollama manually from: https://ollama.ai"
    echo "   Then run: npm run setup"
    exit 1
  fi
else
  echo "✔ Ollama is already installed"
fi

# ── Start Ollama service ──────────────────────────────────────────────────────
if ! pgrep -f "ollama serve" &>/dev/null; then
  echo "▸ Starting Ollama service..."
  ollama serve &>/dev/null &
  OLLAMA_PID=$!
  sleep 3
  echo "✔ Ollama service started (PID: $OLLAMA_PID)"
else
  echo "✔ Ollama service is already running"
fi

# ── Pull model ────────────────────────────────────────────────────────────────
echo "▸ Pulling llama3.2 model (~2 GB — this may take a few minutes on first run)..."
ollama pull llama3.2
echo "✔ Model ready"

# ── Install npm packages ──────────────────────────────────────────────────────
echo "▸ Installing npm packages..."
npm install
echo "✔ Packages installed"

echo ""
echo "╔══════════════════════════════╗"
echo "║   ✅  Setup complete!         ║"
echo "╚══════════════════════════════╝"
echo ""
echo "  Run:  npm run dev"
echo ""
