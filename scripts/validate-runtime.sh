#!/bin/bash
# Runtime validation - Simulate browser environment checks
# Détecte les erreurs qui passeraient le build mais casseraient au runtime

set -e

echo "🧪 Runtime validation checks..."
cd "$(dirname "$0")/.."

ERRORS=0

echo ""
echo "✓ Runtime Check: Theme structure completeness"

# Vérifier que toutes les références theme correspondent à la structure réelle
THEME_FILE="frontend/src/theme.js"

# Extraire la structure du theme
if ! grep -q "typography: {" "$THEME_FILE"; then
    echo "❌ ERREUR: theme.typography absent du theme.js"
    ERRORS=$((ERRORS + 1))
fi

if ! grep -q "sizes: {" "$THEME_FILE"; then
    echo "❌ ERREUR: theme.typography.sizes absent"
    ERRORS=$((ERRORS + 1))
else
    echo "   ✅ theme.typography.sizes présent"
fi

if ! grep -q "weights: {" "$THEME_FILE"; then
    echo "❌ ERREUR: theme.typography.weights absent"
    ERRORS=$((ERRORS + 1))
else
    echo "   ✅ theme.typography.weights présent"
fi

if ! grep -q "accents: {" "$THEME_FILE"; then
    echo "❌ ERREUR: theme.accents absent (export direct)"
    ERRORS=$((ERRORS + 1))
else
    echo "   ✅ theme.accents présent"
fi

echo ""
echo "✓ Runtime Check: All theme.typography.sizes.* keys exist"

# Keys utilisées dans les composants
USED_SIZES=$(grep -roh "theme\.typography\.sizes\.\w\+" frontend/src/components/*.jsx 2>/dev/null | sort -u)
DEFINED_SIZES=$(grep -A 15 "sizes: {" "$THEME_FILE" | grep -o "\w\+:" | tr -d ':' | grep -v sizes)

echo "   Utilisées: $(echo "$USED_SIZES" | wc -l) clés"
echo "   Définies: $(echo "$DEFINED_SIZES" | wc -l) clés"

for key in $USED_SIZES; do
    size_key=$(echo "$key" | awk -F'.' '{print $NF}')
    if ! echo "$DEFINED_SIZES" | grep -q "^${size_key}$"; then
        echo "   ❌ ERREUR: theme.typography.sizes.$size_key utilisé mais non défini"
        ERRORS=$((ERRORS + 1))
    fi
done

if [ $ERRORS -eq 0 ]; then
    echo "   ✅ Toutes les clés sizes existent"
fi

echo ""
echo "✓ Runtime Check: All theme.typography.weights.* keys exist"

USED_WEIGHTS=$(grep -roh "theme\.typography\.weights\.\w\+" frontend/src/components/*.jsx 2>/dev/null | sort -u)
DEFINED_WEIGHTS=$(grep -A 8 "weights: {" "$THEME_FILE" | grep -o "\w\+:" | tr -d ':' | grep -v weights)

echo "   Utilisées: $(echo "$USED_WEIGHTS" | wc -l) clés"
echo "   Définies: $(echo "$DEFINED_WEIGHTS" | wc -l) clés"

for key in $USED_WEIGHTS; do
    weight_key=$(echo "$key" | awk -F'.' '{print $NF}')
    if ! echo "$DEFINED_WEIGHTS" | grep -q "^${weight_key}$"; then
        echo "   ❌ ERREUR: theme.typography.weights.$weight_key utilisé mais non défini"
        ERRORS=$((ERRORS + 1))
    fi
done

if [ $ERRORS -eq 0 ]; then
    echo "   ✅ Toutes les clés weights existent"
fi

echo ""
echo "✓ Runtime Check: All theme.accents.* keys exist"

USED_ACCENTS=$(grep -roh "theme\.accents\.\w\+" frontend/src/components/*.jsx 2>/dev/null | sort -u)
DEFINED_ACCENTS=$(grep -A 10 "accents: {" "$THEME_FILE" | grep -o "\w\+:" | tr -d ':' | grep -v accents)

echo "   Utilisées: $(echo "$USED_ACCENTS" | wc -l) clés"
echo "   Définies: $(echo "$DEFINED_ACCENTS" | wc -l) clés"

for key in $USED_ACCENTS; do
    accent_key=$(echo "$key" | awk -F'.' '{print $NF}')
    if ! echo "$DEFINED_ACCENTS" | grep -q "^${accent_key}$"; then
        echo "   ❌ ERREUR: theme.accents.$accent_key utilisé mais non défini"
        ERRORS=$((ERRORS + 1))
    fi
done

if [ $ERRORS -eq 0 ]; then
    echo "   ✅ Toutes les clés accents existent"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ]; then
    echo "✅ Runtime validation RÉUSSIE"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 0
else
    echo "❌ Runtime validation ÉCHOUÉE - $ERRORS erreur(s)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "💡 Ces erreurs causeraient 'Cannot read properties of undefined' au runtime"
    exit 1
fi
