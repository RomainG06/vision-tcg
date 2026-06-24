# 📋 Configuration Chasse - Spécifications UI/UX

**Date** : 2026-06-15  
**Design System** : Hunting Dashboard  
**Priorité** : Phase 4

---

## 🎯 Objectif

Permettre à l'utilisateur de **configurer un profil de chasse** avant de lancer le scraping.

**Promesse** : "Configure ta chasse en 30 secondes, lance, et reçois les meilleures opportunités"

---

## 📐 Layout

```
┌───────────────────────────────────────────────────────────┐
│  ← Retour                    🎯 Configuration de chasse   │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  📦 PROFIL DE CHASSE                                      │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ [Wizards FR ▼]                                      │ │
│  └─────────────────────────────────────────────────────┘ │
│  Options : Wizards FR, Lots anciens, Bonnes affaires,   │
│            Cartes précises, Scellé, Custom              │
│                                                           │
│  📅 BLOC / PÉRIODE                                        │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ [Wizards ▼]                                         │ │
│  └─────────────────────────────────────────────────────┘ │
│  Options : Tous, Wizards, EX, D&P, N&B, XY, S&L, E&B... │
│                                                           │
│  🃏 TYPE D'ANNONCE                                       │
│  ☑ Lot     ☑ Carte seule     ☐ Scellé     ☐ Accessoires│
│                                                           │
│  🌍 LANGUE                                               │
│  ⦿ FR      ○ EN      ○ JP      ○ Toutes                 │
│                                                           │
│  💰 PRIX MAXIMUM                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ [    150 €    ]                                     │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  📍 DISTANCE MAXIMUM                                     │
│  ├───────●────────┤  50 km                              │
│  0              100                                      │
│                                                           │
│  🌐 PLATEFORMES                                          │
│  ☑ Leboncoin     ☑ Vinted     ☐ Facebook (bientôt)     │
│                                                           │
│  ⭐ SCORE MINIMUM                                        │
│  ├─────────────●─┤  70                                  │
│  0              100                                      │
│                                                           │
│  🔔 ALERTES                                              │
│  [●────────] Activées                                   │
│  Recevoir une notification pour opportunités > 80       │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │         🎯 LANCER LA CHASSE         │
│  └─────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────┘
```

---

## 🎨 Styles Inline React

### **Container Principal**
```javascript
{
  maxWidth: '800px',
  margin: '0 auto',
  padding: theme.spacing.xl,
  background: theme.colors.primary.deepDark,
  borderRadius: theme.borders.radiusLarge,
  border: `2px solid ${theme.colors.primary.slate}`,
}
```

### **Header**
```javascript
{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: theme.spacing.xl,
  paddingBottom: theme.spacing.lg,
  borderBottom: `2px solid ${theme.accents.hunterGold}`,
}
```

**Titre** :
```javascript
{
  fontSize: theme.typography.size.xxlarge,
  fontWeight: theme.typography.weight.bold,
  color: theme.colors.text.primary,
  textShadow: `0 0 24px ${theme.accents.hunterGold}60`,
}
```

### **Section Label**
```javascript
{
  fontSize: theme.typography.size.small,
  fontWeight: theme.typography.weight.bold,
  color: theme.accents.hunterGold,
  textTransform: 'uppercase',
  letterSpacing: '1.5px',
  marginTop: theme.spacing.lg,
  marginBottom: theme.spacing.sm,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing.xs,
}
```

### **Dropdown (Select)**
```javascript
{
  width: '100%',
  padding: theme.spacing.md,
  background: theme.colors.primary.slate,
  border: `2px solid ${theme.colors.primary.slate}`,
  borderRadius: theme.borders.radiusMedium,
  color: theme.colors.text.primary,
  fontSize: theme.typography.size.base,
  fontWeight: theme.typography.weight.medium,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  outline: 'none',
}

// :focus
{
  borderColor: theme.accents.manaCyan,
  boxShadow: `0 0 12px ${theme.accents.manaCyan}40`,
}

// :hover
{
  borderColor: theme.accents.hunterGold,
}
```

### **Checkbox**
```javascript
// Container
{
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing.sm,
  cursor: 'pointer',
}

// Input (hidden, styled with custom box)
{
  appearance: 'none',
  width: '24px',
  height: '24px',
  border: `2px solid ${theme.colors.primary.slate}`,
  borderRadius: theme.borders.radiusSmall,
  background: theme.colors.primary.midnight,
  cursor: 'pointer',
  position: 'relative',
}

// :checked
{
  background: theme.accents.manaCyan,
  borderColor: theme.accents.manaCyan,
}

// Checkmark (::after sur :checked)
{
  content: '✓',
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  color: theme.colors.primary.obsidian,
  fontSize: '16px',
  fontWeight: 'bold',
}

// Label
{
  color: theme.colors.text.primary,
  fontSize: theme.typography.size.base,
}
```

### **Radio Button**
Même style que checkbox mais avec `borderRadius: '50%'`

### **Input Number**
```javascript
{
  width: '100%',
  padding: theme.spacing.md,
  background: theme.colors.primary.slate,
  border: `2px solid ${theme.colors.primary.slate}`,
  borderRadius: theme.borders.radiusMedium,
  color: theme.colors.text.primary,
  fontSize: theme.typography.size.large,
  fontWeight: theme.typography.weight.bold,
  textAlign: 'center',
  outline: 'none',
}

// :focus
{
  borderColor: theme.accents.hunterGold,
  boxShadow: `0 0 12px ${theme.accents.hunterGold}40`,
}
```

### **Slider (Range)**
```javascript
// Container
{
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing.md,
  marginTop: theme.spacing.sm,
}

// Input range
{
  flex: 1,
  height: '6px',
  background: theme.colors.primary.slate,
  borderRadius: '3px',
  outline: 'none',
  appearance: 'none',
  cursor: 'pointer',
}

// Thumb (webkit/moz)
{
  width: '20px',
  height: '20px',
  background: theme.accents.manaCyan,
  borderRadius: '50%',
  border: `3px solid ${theme.colors.primary.obsidian}`,
  boxShadow: `0 0 12px ${theme.accents.manaCyan}80`,
  cursor: 'grab',
}

// Thumb :active
{
  boxShadow: `0 0 20px ${theme.accents.manaCyan}`,
  cursor: 'grabbing',
}

// Value label
{
  fontSize: theme.typography.size.large,
  fontWeight: theme.typography.weight.bold,
  color: theme.accents.hunterGold,
  minWidth: '60px',
  textAlign: 'right',
}
```

### **Toggle Switch**
```javascript
// Container
{
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing.sm,
  cursor: 'pointer',
}

// Switch track
{
  width: '56px',
  height: '28px',
  background: theme.colors.primary.slate,
  borderRadius: '14px',
  position: 'relative',
  transition: 'background 0.3s ease',
}

// :checked track
{
  background: theme.accents.successGreen,
}

// Switch thumb
{
  width: '22px',
  height: '22px',
  background: theme.colors.text.primary,
  borderRadius: '50%',
  position: 'absolute',
  top: '3px',
  left: '3px',
  transition: 'left 0.3s ease',
  boxShadow: theme.shadows.medium,
}

// :checked thumb
{
  left: '31px',
}

// Label
{
  fontSize: theme.typography.size.base,
  color: theme.colors.text.secondary,
}
```

### **Bouton Principal "Lancer la chasse"**
```javascript
{
  width: '100%',
  padding: `${theme.spacing.lg} ${theme.spacing.xl}`,
  background: `linear-gradient(135deg, ${theme.accents.hunterGold}, ${theme.accents.manaCyan})`,
  border: 'none',
  borderRadius: theme.borders.radiusMedium,
  color: theme.colors.primary.obsidian,
  fontSize: theme.typography.size.large,
  fontWeight: theme.typography.weight.bold,
  cursor: 'pointer',
  marginTop: theme.spacing.xl,
  boxShadow: `0 4px 16px ${theme.accents.hunterGold}60`,
  transition: 'all 0.2s ease',
}

// :hover
{
  transform: 'translateY(-2px)',
  boxShadow: `0 8px 24px ${theme.accents.hunterGold}80`,
}

// :active
{
  transform: 'translateY(0)',
}

// :disabled
{
  opacity: 0.5,
  cursor: 'not-allowed',
}
```

---

## 🔄 États

### **Validation Errors**
```javascript
// Error message sous input
{
  color: theme.accents.preyRed,
  fontSize: theme.typography.size.small,
  marginTop: theme.spacing.xs,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing.xs,
}
```

**Exemple** : "⚠️ Veuillez sélectionner au moins une plateforme"

### **Loading State (submit)**
```javascript
{
  pointer-events: 'none',
  opacity: 0.7,
}
```

Bouton devient : "⏳ Lancement en cours..."

---

## 📱 Responsive

### **Mobile (< 768px)**
- Checkboxes/radios : stack vertical
- Slider value : dessous (pas à droite)
- Padding : 16px

### **Tablet (768px+)**
- Checkboxes : inline (3 par ligne)
- Layout comme desktop

---

## ⌨️ Keyboard

- **Tab** : naviguer entre champs
- **Space** : toggle checkbox/radio/switch
- **Arrow up/down** : slider
- **Enter** : submit formulaire

---

## 📦 Composant React

```javascript
// frontend/src/pages/ConfigChasse.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import theme from '../theme';

function ConfigChasse() {
  const navigate = useNavigate();
  const [config, setConfig] = useState({
    profil: 'wizards_fr',
    bloc: 'wizards',
    types: ['lot', 'single'],
    langue: 'fr',
    prixMax: 150,
    distanceMax: 50,
    plateformes: ['leboncoin', 'vinted'],
    scoreMin: 70,
    alertes: true,
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    // Sauvegarder config dans backend
    // Rediriger vers /scan avec config
    navigate('/scan', { state: { config } });
  };

  const validate = () => {
    const newErrors = {};
    if (config.plateformes.length === 0) {
      newErrors.plateformes = 'Sélectionnez au moins une plateforme';
    }
    if (config.types.length === 0) {
      newErrors.types = 'Sélectionnez au moins un type d\'annonce';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <div style={containerStyle}>
      <form onSubmit={handleSubmit}>
        {/* Sections avec tous les inputs */}
        <button type="submit" disabled={loading} style={submitButtonStyle}>
          {loading ? '⏳ Lancement...' : '🎯 LANCER LA CHASSE'}
        </button>
      </form>
    </div>
  );
}

export default ConfigChasse;
```

---

## ✅ Checklist

- [ ] Créer `ConfigChasse.jsx` avec formulaire complet
- [ ] Implémenter validation inline (errors state)
- [ ] Custom checkboxes/radios avec styles hunting
- [ ] Custom slider avec thumb cyan
- [ ] Custom toggle switch
- [ ] Submit → sauvegarder config dans localStorage/backend
- [ ] Redirect vers `/scan` avec config en state
- [ ] Tests keyboard navigation
- [ ] Tests responsive (mobile, tablet)

---

**Estimation** : ~2h (formulaire + validations + styles custom)
