#!/bin/bash
# Quick validation script - test all imports and build

set -e

echo "🧪 Phase 3 - Validation complète"
echo "================================"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT/frontend"

echo ""
echo "1️⃣ Checking for old theme references..."
if grep -r "theme.colors.neutral\|theme.colors.accent\|arcane" src/ --include="*.jsx" --include="*.js" 2>/dev/null; then
  echo "❌ Found old theme references!"
  exit 1
else
  echo "✅ No old theme references found"
fi

echo ""
echo "2️⃣ Building frontend..."
npm run build

echo ""
echo "✅ ALL CHECKS PASSED!"
echo ""
echo "Next: Test on Windows with:"
echo "  git pull origin feature/ui-hunting-radar"
echo "  cd frontend && npm run dev"
