#!/bin/bash
# TEST PLAN FOR ULTRA-PRUDENT LBC POST-CAPTCHA STRATEGY
# Date: 2026-06-26
# Goal: Verify that LBC blocking is prevented after CAPTCHA resolution

echo "🧪 TEST PLAN - ULTRA-PRUDENT LBC STRATEGY"
echo "========================================="
echo ""
echo "This test plan verifies that the new 90-second cooldown + 1-listing strategy"
echo "prevents LBC from blocking after CAPTCHA resolution."
echo ""

echo "PRE-REQUISITES:"
echo "1. Backend running: npm run dev (from backend/)"
echo "2. Frontend running: npm run dev (from frontend/)"
echo "3. LBC will trigger CAPTCHA within first scan (or do it manually)"
echo ""

echo "TEST 1: NORMAL SCRAPE (Without CAPTCHA)"
echo "========================================"
echo ""
echo "Command:"
echo 'curl -X POST http://localhost:3001/api/scrape/start \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{
echo '    "profile": "wizards-fr",
echo '    "sources": ["leboncoin"],
echo '    "filters": {
echo '      "series": "base",
echo '      "sensitivity": "prudent"
echo '    }
echo '  }'"'"
echo ""
echo "Expected Logs:"
echo "  ✅ No CAPTCHA detected"
echo "  ✅ [LBC] Navigation attempt 1/3: ..."
echo "  ✅ [LBC] Waiting 3000-6000ms before next listing fetch (normal)"
echo "  ✅ Fetch ~2 listings successfully"
echo "  ✅ No 'Accès temporairement restreint' errors"
echo ""
echo "Success Criteria: Completes without blocl errors, ~2 listings fetched"
echo ""

echo "TEST 2: POST-CAPTCHA STRATEGY (WITH CAPTCHA)"
echo "============================================="
echo ""
echo "Step 1: Start scan that triggers CAPTCHA"
echo "  Command:"
echo '  curl -X POST http://localhost:3001/api/scrape/start \'
echo '    -H "Content-Type: application/json" \'
echo '    -d '"'"'{...}'"'"
echo ""
echo "Step 2: Watch for CAPTCHA detection"
echo "  Expected Log: ⏳ CAPTCHA/DataDome Leboncoin détecté !"
echo "  → Chrome window appears with CAPTCHA"
echo ""
echo "Step 3: Resolve CAPTCHA manually"
echo "  → Solve the puzzle/click in the Chrome window"
echo "  → Résolution should take <1 minute"
echo ""
echo "Step 4: Watch backend logs for post-CAPTCHA sequence:"
echo "  Expected Logs (IN ORDER):"
echo "    1. ✅ CAPTCHA résolu ! Sauvegarde des cookies..."
echo "    2. ⏳ [LBC] Waiting 15s post-CAPTCHA before checking..."
echo "    3. [LBC] Rate limit detection..."
echo "       - If NO rate limit: [LBC] Post-CAPTCHA checks passed"
echo "       - If rate limit: ⏱️ Waiting extended 90s cooldown..."
echo "    4. [LBC] CAPTCHA just resolved - limiting to 1 listing"
echo "    5. [LBC] Waiting 8000-15000ms before next listing fetch (post-CAPTCHA)"
echo "    6. ✅ Fetch 1 listing successfully"
echo "    7. [End of scan]"
echo ""
echo "Step 5: Verify no blocking page appears"
echo "  ❌ Should NOT see: 'Accès temporairement restreint'"
echo "  ✅ Should see: Clean fetch of 1 listing"
echo ""
echo "Success Criteria:"
echo "  • CAPTCHA resolved successfully"
echo "  • Logs show 90s cooldown engaged"
echo "  • Exactly 1 listing fetched"
echo "  • NO 'Accès temporairement restreint' blocking page"
echo "  • Frontend shows user message about 30-min wait"
echo ""

echo "TEST 3: VERIFY COOLDOWN TIMING"
echo "==============================="
echo ""
echo "Expected timings:"
echo "  • CAPTCHA resolution: <300 seconds (user timeout)"
echo "  • Post-CAPTCHA initial wait: exactly 15 seconds"
echo "  • If rate limit detected: +90 seconds cooldown"
echo "  • Total time after CAPTCHA resolution:"
echo "    - No rate limit: ~15-20 seconds"
echo "    - With rate limit: ~105-110 seconds"
echo "  • Fetch: 8-15 seconds (random)"
echo ""
echo "Check: Look at logs timestamp to verify timing"
echo ""

echo "TEST 4: ERROR MESSAGES"
echo "======================="
echo ""
echo "Check frontend error messages:"
echo "  If still rate limited after 90s:"
echo '    Message: "Le Bon Coin bloque très agressivement... Attends au minimum 30-60 minutes"'
echo ""
echo "  If rate limit detected after CAPTCHA:"
echo '    Message: "Leboncoin impose un cooldown sévère... Attends 30 minutes"'
echo ""

echo "POST-TEST CHECKLIST:"
echo "==================="
echo ""
echo "[ ] Test 1 passed: Normal scrape without CAPTCHA works"
echo "[ ] Test 2 passed: CAPTCHA triggered and resolved"
echo "[ ] Test 2 passed: 90s cooldown logged"
echo "[ ] Test 2 passed: Only 1 listing fetched"
echo "[ ] Test 2 passed: No blocking page appeared"
echo "[ ] Test 3 passed: Timings match expectations"
echo "[ ] Test 4 passed: Error messages display correctly"
echo ""
echo "If ALL tests pass:"
echo "  ✅ STRATEGY VALIDATED - Ready for production"
echo ""
echo "If ANY test fails:"
echo "  ⏳ Review logs and adjust strategy"
echo "  Possible next steps:"
echo "    - Increase cooldown to 120s"
echo "    - Reduce to 0 listings post-CAPTCHA (stop after resolution)"
echo "    - Consider deferring to Vinted-only mode"
echo ""

echo "MANUAL TESTING ALTERNATIVE:"
echo "============================"
echo "If curl doesn't work, use the frontend UI:"
echo "  1. Open http://localhost:5173"
echo "  2. Select wizards-fr profile"
echo "  3. Click 'Scan' with LBC selected"
echo "  4. Wait for CAPTCHA (or trigger manually)"
echo "  5. Resolve CAPTCHA"
echo "  6. Watch logs and frontend for results"
echo ""

echo "DEBUG: Check metrics in response"
echo "================================"
echo "The scan response should include:"
echo ""
echo '{
echo '  "results": [...],
echo '  "lbc_metrics": {
echo '    "captcha_encountered": 1,
echo '    "captcha_resolved": 1,'
echo '    "rate_limits_hit": 0 or 1,'
echo '    "cooldown_triggered": 0 or 1,'
echo '    "delay_times_ms": [15000, 8000-15000, ...], '
echo '    "listings_fetched": 1,'
echo '    "success_rate": 100'
echo '  }'
echo '}'
echo ""
