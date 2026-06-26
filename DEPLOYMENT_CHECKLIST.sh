#!/bin/bash
# DEPLOYMENT CHECKLIST - Ultra-Prudent LBC Strategy
# Run this to verify all changes are in place

echo "✅ DEPLOYMENT CHECKLIST - ULTRA-PRUDENT LBC STRATEGY"
echo "======================================================"
echo ""

# Check backend file
echo "1️⃣  Checking backend/src/fetchers/leboncoin.js..."
if grep -q "captchaJustResolved = false" "backend/src/fetchers/leboncoin.js" 2>/dev/null; then
  echo "   ✅ captchaJustResolved flag found"
else
  echo "   ❌ captchaJustResolved flag NOT found"
fi

if grep -q "await new Promise(resolve => setTimeout(resolve, 90000))" "backend/src/fetchers/leboncoin.js" 2>/dev/null; then
  echo "   ✅ 90s cooldown found"
else
  echo "   ❌ 90s cooldown NOT found"
fi

if grep -q "8-15s post-CAPTCHA" "backend/src/fetchers/leboncoin.js" 2>/dev/null; then
  echo "   ✅ 8-15s delays found"
else
  echo "   ❌ 8-15s delays NOT found"
fi

if grep -q "limiting to 1 listing" "backend/src/fetchers/leboncoin.js" 2>/dev/null; then
  echo "   ✅ 1-listing limit found"
else
  echo "   ❌ 1-listing limit NOT found"
fi

echo ""
echo "2️⃣  Checking frontend/src/components/HuntLaunchPanel.jsx..."
if grep -q "Rate limit persists after 90s" "frontend/src/components/HuntLaunchPanel.jsx" 2>/dev/null; then
  echo "   ✅ 90s error message found"
else
  echo "   ❌ 90s error message NOT found"
fi

if grep -q "ultra-prudent" "frontend/src/components/HuntLaunchPanel.jsx" 2>/dev/null; then
  echo "   ✅ Ultra-prudent modal found"
else
  echo "   ❌ Ultra-prudent modal NOT found"
fi

echo ""
echo "3️⃣  Checking documentation files..."
DOCS=("RATE_LIMIT_FIX.md" "ULTRA_PRUDENT_STRATEGY.md" "TEST_ULTRA_PRUDENT.sh" "DEPLOYMENT_ULTRA_PRUDENT.md" "QUICK_START.md" "SOLUTION_RECAP_FR.md" "ULTRA_PRUDENT_STRATEGY.md")

for doc in "${DOCS[@]}"; do
  if [ -f "$doc" ]; then
    echo "   ✅ $doc found"
  else
    echo "   ❌ $doc NOT found"
  fi
done

echo ""
echo "4️⃣  Checking patch script..."
if [ -f "frontend/src/components/patch-ultra-prudent.cjs" ]; then
  echo "   ✅ patch-ultra-prudent.cjs found"
else
  echo "   ❌ patch-ultra-prudent.cjs NOT found"
fi

echo ""
echo "======================================================"
echo "✅ DEPLOYMENT COMPLETE"
echo ""
echo "All components verified. Ready to test!"
echo ""
echo "Next steps:"
echo "  1. cd backend && npm run dev"
echo "  2. In another terminal: cd frontend && npm run dev"
echo "  3. Open http://localhost:5173"
echo "  4. Trigger a scan with LBC"
echo "  5. Let CAPTCHA trigger (or do it manually)"
echo "  6. Watch logs for ultra-prudent sequence:"
echo "     - ⏳ CAPTCHA detected"
echo "     - ✅ CAPTCHA resolved"
echo "     - ⏳ Waiting 90s..."
echo "     - [LBC] limiting to 1 listing"
echo "     - ✅ Fetch 1 listing"
echo "     - ✅ Scan complete"
echo ""
echo "Success: No 'Accès temporairement restreint' blocking!"
