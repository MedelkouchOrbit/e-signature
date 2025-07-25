# i18n Folder Structure

## 📁 Current Structure

```
app/
├── i18n/                    # 🟢 ACTIVE - Current next-intl configuration
│   ├── config.ts           # Main i18n configuration (in use)
│   ├── navigation.ts       # Navigation routing
│   └── routing.ts          # Locale routing
│
└── lib/
    └── i18n-lazy/          # 🟡 FUTURE - Lazy loading system (when needed)
        ├── message-loader.ts        # Core lazy loading logic
        ├── use-translation-namespace.tsx  # React hooks for lazy loading
        └── enhanced-config.ts       # Feature-flag enabled config
```

## 🎯 Current Setup (ACTIVE)

**Location**: `/app/i18n/`
**Status**: ✅ Currently in use
**Purpose**: Standard next-intl configuration for your current 63KB translations

### Files:
- `config.ts` - Main configuration used by your app
- `routing.ts` - Locale routing configuration  
- `navigation.ts` - Navigation helpers

## 🚀 Future Setup (STANDBY)

**Location**: `/app/lib/i18n-lazy/`
**Status**: 🟡 Ready for future use (when files exceed 500KB)
**Purpose**: Advanced lazy loading system for large translation files

### Files:
- `message-loader.ts` - Namespace-based dynamic loading
- `use-translation-namespace.tsx` - React hooks with loading states
- `enhanced-config.ts` - Feature-flag configuration

## 🔄 Migration Path

### Current (Keep using this)
```typescript
// app/i18n/config.ts
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => {
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
```

### Future (When files get large)
```typescript
// Switch to app/lib/i18n-lazy/enhanced-config.ts
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => {
  const ENABLE_LAZY_LOADING = process.env.NEXT_PUBLIC_ENABLE_LAZY_LOADING === 'true';
  
  const messages = ENABLE_LAZY_LOADING 
    ? await loadCriticalMessages(locale)  // Lazy loading
    : await loadAllMessages(locale);      // Current approach
    
  return { locale, messages };
});
```

## 🎛 How to Switch (Future)

When your translation files exceed 500KB:

1. **Enable lazy loading**:
```bash
# .env.local
NEXT_PUBLIC_ENABLE_LAZY_LOADING=true
```

2. **Update your import**:
```typescript
// Change this in next.config.mjs or where you import the config
- import config from './app/i18n/config';
+ import config from './app/lib/i18n-lazy/enhanced-config';
```

3. **Organize translations by namespace**:
```
messages/
├── namespaces/
│   ├── en/
│   │   ├── common.json      # Always loaded
│   │   ├── landing.json     # Loaded on landing page
│   │   ├── dashboard.json   # Loaded on dashboard
│   │   └── pricing.json     # Loaded on pricing page
│   └── ar/
│       ├── common.json
│       ├── landing.json
│       ├── dashboard.json
│       └── pricing.json
```

## ⚠️ Important Notes

- **DO NOT** change anything now - your current setup is optimal
- The `i18n-lazy` folder is future-proofing for when you need it
- Run `npm run check-translations` monthly to monitor file growth
- Only implement lazy loading when individual files exceed 500KB
