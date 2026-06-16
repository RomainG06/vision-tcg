#!/bin/bash
# Validation script avant push - Phase 3
# Détecte les erreurs communes de références theme

set -e

echo "🔍 Validation avant push..."
cd "$(dirname "$0")/.."

ERRORS=0

# Check 1: Références theme incorrectes (sizes)
echo ""
echo "✓ Check 1: Theme references (typography.size vs sizes)"
if grep -r "theme\.typography\.size\." frontend/src/components/*.jsx 2>/dev/null; then
    echo "❌ ERREUR: Utilisez 'theme.typography.sizes' (avec un s)"
    echo "   Trouvé: theme.typography.size.*"
    echo "   Correct: theme.typography.sizes.headingLg, .bodyMd, etc."
    ERRORS=$((ERRORS + 1))
else
    echo "   ✅ Pas de theme.typography.size trouvé"
fi

# Check 1b: Références theme incorrectes (weights)
echo ""
echo "✓ Check 1b: Theme references (typography.weight vs weights)"
if grep -r "theme\.typography\.weight\." frontend/src/components/*.jsx 2>/dev/null; then
    echo "❌ ERREUR: Utilisez 'theme.typography.weights' (avec un s)"
    echo "   Trouvé: theme.typography.weight.*"
    echo "   Correct: theme.typography.weights.bold, .medium, etc."
    ERRORS=$((ERRORS + 1))
else
    echo "   ✅ Pas de theme.typography.weight trouvé"
fi

# Check 2: Références colors.accents vs accents direct
echo ""
echo "✓ Check 2: Accents references (colors.accents vs accents)"
if grep -r "theme\.colors\.accents\." frontend/src/components/*.jsx 2>/dev/null; then
    echo "⚠️  WARNING: Utilisez 'theme.accents' directement (export simplifié)"
    echo "   Trouvé: theme.colors.accents.*"
    echo "   Recommandé: theme.accents.hunterGold"
    echo "   (Les deux fonctionnent mais theme.accents est plus court)"
fi

# Check 3: Old theme keys (fantasy theme)
echo ""
echo "✓ Check 3: Old fantasy theme keys"
if grep -rE "theme\.colors\.(neutral|accent\.)" frontend/src/components/*.jsx 2>/dev/null; then
    echo "❌ ERREUR: Old fantasy theme keys détectés"
    echo "   Trouvé: theme.colors.neutral ou theme.colors.accent.*"
    echo "   Correct: theme.colors.text.*, theme.accents.*"
    ERRORS=$((ERRORS + 1))
else
    echo "   ✅ Pas de vieilles clés fantasy détectées"
fi

# Check 4: Imports react-markdown
echo ""
echo "✓ Check 4: react-markdown imports"
if grep -r "import.*react-markdown" frontend/src/components/*.jsx 2>/dev/null; then
    echo "   📦 react-markdown utilisé dans:"
    grep -l "import.*react-markdown" frontend/src/components/*.jsx
    
    # Vérifier que react-markdown est dans package.json
    if ! grep -q "react-markdown" frontend/package.json; then
        echo "   ❌ ERREUR: react-markdown utilisé mais absent de package.json"
        ERRORS=$((ERRORS + 1))
    else
        echo "   ✅ react-markdown présent dans package.json"
    fi
fi

# Check 5: Build frontend
echo ""
echo "✓ Check 5: Frontend build"
cd frontend
npm run build > /tmp/build.log 2>&1
if [ $? -eq 0 ]; then
    SIZE=$(grep "dist/assets/index" /tmp/build.log | awk '{print $2}')
    echo "   ✅ Build OK: $SIZE"
else
    echo "   ❌ ERREUR: Build failed"
    cat /tmp/build.log
    ERRORS=$((ERRORS + 1))
fi
cd ..

# Check 6: ESLint errors (si disponible)
echo ""
echo "✓ Check 6: ESLint (optional)"
if [ -f frontend/.eslintrc.json ]; then
    cd frontend
    npm run lint 2>&1 | tail -5
    cd ..
else
    echo "   ⏭️  ESLint non configuré (skip)"
fi

# Résumé
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ]; then
    echo "✅ Validation RÉUSSIE - Prêt à push"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 0
else
    echo "❌ Validation ÉCHOUÉE - $ERRORS erreur(s) détectée(s)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "💡 FIXES RECOMMANDÉS:"
    echo "   1. Corriger les erreurs listées ci-dessus"
    echo "   2. Relancer: ./scripts/validate-before-push.sh"
    echo "   3. Commit + push uniquement si validation passe"
    exit 1
fi
