# ⏳ Lancement Scan - Spécifications UI/UX

**Date** : 2026-06-15  
**Design System** : Hunting Dashboard  
**Priorité** : Phase 4

---

## 🎯 Objectif

Afficher la **progression du scraping** en temps réel et informer l'utilisateur des étapes.

**Promesse** : "Vois en direct ce que le radar détecte"

---

## 📐 Layout

```
┌─────────────────────────────────────────────────┐
│                                                 │
│                                                 │
│              🎯                                 │
│          ⟳ Scanning...                         │
│                                                 │
│     🔍 Recherche sur Leboncoin...              │
│                                                 │
│     ━━━━━━━━━━━━━━━━━━━━━━━ 45%               │
│                                                 │
│     ✅ Leboncoin : 23 annonces trouvées        │
│     🔍 Recherche sur Vinted...                 │
│     ⏳ Analyse de 47 annonces...               │
│     ⏹ Calcul des scores...                     │
│                                                 │
│              [Annuler]                          │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🎨 Styles Inline React

### **Container Principal**
```javascript
{
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  background: theme.colors.primary.obsidian,
  padding: theme.spacing.xl,
}
```

### **Spinner Icon**
```javascript
{
  fontSize: '64px',
  marginBottom: theme.spacing.lg,
  animation: 'pulse 2s infinite',
  filter: `drop-shadow(0 0 16px ${theme.accents.hunterGold})`,
}

// Animation keyframes
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
}
```

### **Title "Scanning..."**
```javascript
{
  fontSize: theme.typography.size.xxlarge,
  fontWeight: theme.typography.weight.bold,
  color: theme.accents.hunterGold,
  textShadow: `0 0 24px ${theme.accents.hunterGold}80`,
  marginBottom: theme.spacing.xl,
  letterSpacing: '2px',
}
```

### **Progress Bar Container**
```javascript
{
  width: '400px',
  height: '8px',
  background: theme.colors.primary.slate,
  borderRadius: '4px',
  overflow: 'hidden',
  marginBottom: theme.spacing.xl,
  boxShadow: `inset 0 2px 4px rgba(0,0,0,0.3)`,
}
```

### **Progress Bar Fill**
```javascript
{
  height: '100%',
  background: `linear-gradient(90deg, ${theme.accents.hunterGold}, ${theme.accents.manaCyan})`,
  borderRadius: '4px',
  transition: 'width 0.5s ease',
  boxShadow: `0 0 12px ${theme.accents.hunterGold}80`,
}
```

### **Progress Text**
```javascript
{
  fontSize: theme.typography.size.large,
  fontWeight: theme.typography.weight.bold,
  color: theme.accents.manaCyan,
  marginTop: theme.spacing.sm,
  textAlign: 'center',
}
```

### **Status Messages Container**
```javascript
{
  width: '500px',
  maxHeight: '300px',
  overflow: 'auto',
  marginTop: theme.spacing.lg,
  padding: theme.spacing.md,
  background: theme.colors.primary.deepDark,
  borderRadius: theme.borders.radiusMedium,
  border: `1px solid ${theme.colors.primary.slate}`,
}
```

### **Status Message Item**
```javascript
// Container
{
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing.sm,
  padding: theme.spacing.sm,
  marginBottom: theme.spacing.xs,
  borderRadius: theme.borders.radiusSmall,
  fontSize: theme.typography.size.base,
  transition: 'all 0.3s ease',
}

// Status : pending (⏹)
{
  color: theme.colors.text.tertiary,
  opacity: 0.5,
}

// Status : in-progress (🔍)
{
  color: theme.accents.manaCyan,
  background: `${theme.accents.manaCyan}10`,
  animation: 'fadeIn 0.3s ease',
}

// Status : completed (✅)
{
  color: theme.accents.successGreen,
}

// Status : error (❌)
{
  color: theme.accents.preyRed,
}
```

### **Cancel Button**
```javascript
{
  marginTop: theme.spacing.xl,
  padding: `${theme.spacing.md} ${theme.spacing.xl}`,
  background: theme.colors.primary.slate,
  border: `2px solid ${theme.colors.primary.slate}`,
  borderRadius: theme.borders.radiusMedium,
  color: theme.colors.text.primary,
  fontSize: theme.typography.size.base,
  fontWeight: theme.typography.weight.medium,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
}

// :hover
{
  borderColor: theme.accents.preyRed,
  color: theme.accents.preyRed,
}
```

---

## 🔄 États & Étapes

### **Étapes de scan** (array)
```javascript
const steps = [
  { id: 'search-lbc', label: 'Recherche sur Leboncoin...', status: 'pending' },
  { id: 'search-vinted', label: 'Recherche sur Vinted...', status: 'pending' },
  { id: 'analyze', label: 'Analyse des annonces...', status: 'pending' },
  { id: 'score', label: 'Calcul des scores...', status: 'pending' },
  { id: 'enrich', label: 'Enrichissement des données...', status: 'pending' },
];

// status : 'pending' | 'in-progress' | 'completed' | 'error'
```

### **Progress Calculation**
```javascript
const progressPercent = (steps.filter(s => s.status === 'completed').length / steps.length) * 100;
```

### **Success State** (redirect après 2s)
```javascript
// Tous les steps completed
{
  icon: '✅',
  title: 'Scan terminé !',
  subtitle: `12 opportunités détectées`,
  color: theme.accents.successGreen,
}

// Après 2 secondes : navigate('/dashboard')
```

### **Error State**
```javascript
{
  icon: '❌',
  title: 'Erreur lors du scan',
  subtitle: error.message,
  actions: [
    { label: 'Réessayer', onClick: retryScan, primary: true },
    { label: 'Retour config', onClick: goBack, secondary: true },
  ],
}
```

---

## 📡 WebSocket / Polling

### **Option A : WebSocket** (recommandé)
```javascript
useEffect(() => {
  const ws = new WebSocket('ws://localhost:3001/scan');
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    if (data.type === 'progress') {
      setProgress(data.percent);
    }
    
    if (data.type === 'step-update') {
      updateStep(data.stepId, data.status, data.message);
    }
    
    if (data.type === 'complete') {
      setSteps(steps.map(s => ({ ...s, status: 'completed' })));
      setTimeout(() => navigate('/dashboard'), 2000);
    }
  };

  return () => ws.close();
}, []);
```

### **Option B : Polling** (fallback)
```javascript
useEffect(() => {
  const interval = setInterval(async () => {
    const res = await fetch(`/api/scan/${scanId}/status`);
    const data = await res.json();
    
    setProgress(data.progress);
    setSteps(data.steps);
    
    if (data.status === 'completed') {
      clearInterval(interval);
      setTimeout(() => navigate('/dashboard'), 2000);
    }
  }, 1000);

  return () => clearInterval(interval);
}, [scanId]);
```

---

## 🎬 Animations

### **Fade In**
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### **Spinner Rotation**
```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

Appliquer sur icône radar : `animation: 'spin 3s linear infinite'`

---

## 📱 Responsive

Mobile = Desktop (centered content, stack vertical)

---

## 📦 Composant React

```javascript
// frontend/src/pages/ScanProgress.jsx

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import theme from '../theme';

function ScanProgress() {
  const navigate = useNavigate();
  const location = useLocation();
  const config = location.state?.config;

  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState([
    { id: 'lbc', label: 'Recherche sur Leboncoin...', status: 'pending', details: '' },
    { id: 'vinted', label: 'Recherche sur Vinted...', status: 'pending', details: '' },
    { id: 'analyze', label: 'Analyse des annonces...', status: 'pending', details: '' },
    { id: 'score', label: 'Calcul des scores...', status: 'pending', details: '' },
  ]);
  const [scanId, setScanId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    startScan();
  }, []);

  const startScan = async () => {
    try {
      const res = await fetch('/api/scan/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      setScanId(data.scanId);
      pollProgress(data.scanId);
    } catch (err) {
      setError(err.message);
    }
  };

  const pollProgress = (id) => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/scan/${id}/status`);
      const data = await res.json();
      
      setProgress(data.progress);
      setSteps(data.steps);
      
      if (data.status === 'completed') {
        clearInterval(interval);
        setTimeout(() => navigate('/dashboard'), 2000);
      }
      
      if (data.status === 'error') {
        clearInterval(interval);
        setError(data.error);
      }
    }, 1000);
  };

  const handleCancel = async () => {
    if (scanId) {
      await fetch(`/api/scan/${scanId}/cancel`, { method: 'POST' });
    }
    navigate('/config');
  };

  if (error) {
    return <ErrorView error={error} onRetry={startScan} onBack={() => navigate('/config')} />;
  }

  return (
    <div style={containerStyle}>
      <div style={spinnerStyle}>🎯</div>
      <h1 style={titleStyle}>Scanning...</h1>
      
      <div style={progressBarContainerStyle}>
        <div style={{ ...progressBarFillStyle, width: `${progress}%` }} />
      </div>
      <p style={progressTextStyle}>{Math.round(progress)}%</p>
      
      <div style={stepsContainerStyle}>
        {steps.map(step => (
          <div key={step.id} style={getStepStyle(step.status)}>
            <span>{getStepIcon(step.status)}</span>
            <span>{step.label}</span>
            {step.details && <span style={detailsStyle}>{step.details}</span>}
          </div>
        ))}
      </div>
      
      <button onClick={handleCancel} style={cancelButtonStyle}>
        Annuler
      </button>
    </div>
  );
}

export default ScanProgress;
```

---

## ✅ Checklist

- [ ] Créer `ScanProgress.jsx` avec états & polling
- [ ] Backend : endpoint `/api/scan/start` POST
- [ ] Backend : endpoint `/api/scan/:id/status` GET
- [ ] Backend : endpoint `/api/scan/:id/cancel` POST
- [ ] WebSocket ou polling pour updates temps réel
- [ ] Animations (spinner, fadeIn, progress bar)
- [ ] Error handling + retry
- [ ] Redirect auto vers dashboard après succès
- [ ] Tests : cancel, errors, timeout

---

**Estimation** : ~1h30 (composant + backend endpoints + polling)
