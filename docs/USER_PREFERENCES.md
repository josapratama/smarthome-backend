# User Preferences System

## Overview

Sistem preferences memungkinkan user untuk menyimpan pengaturan personal seperti tema, bahasa, notifikasi, dan timezone. Data disimpan di database PostgreSQL dan dapat di-sync antar device.

## Architecture

### Hybrid Approach

- **Frontend (localStorage)**: Untuk immediate access dan offline support
- **Backend (PostgreSQL)**: Untuk cross-device sync dan persistence

### Data Flow

```
User Action → localStorage (instant) → Backend API (sync) → Database
                                    ↓
                            Other Devices (sync on login)
```

## Database Schema

```sql
ALTER TABLE "user_account"
ADD COLUMN "preferences" JSONB;
```

### Preferences JSON Structure

```json
{
  "theme": "light" | "dark" | "system",
  "language": "en" | "id" | "es" | "fr" | "de" | "ja" | "zh",
  "notifications": {
    "email": true,
    "push": true,
    "sound": true
  },
  "timezone": "UTC" | "Asia/Jakarta" | ...
}
```

## API Endpoints

### GET /api/v1/preferences

Get current user preferences

**Response:**

```json
{
  "data": {
    "theme": "dark",
    "language": "id",
    "notifications": {
      "email": true,
      "push": true,
      "sound": false
    },
    "timezone": "Asia/Jakarta"
  }
}
```

### PATCH /api/v1/preferences

Update preferences (partial update)

**Request:**

```json
{
  "theme": "dark",
  "language": "id"
}
```

**Response:**

```json
{
  "data": {
    "theme": "dark",
    "language": "id",
    "notifications": {
      "email": true,
      "push": true,
      "sound": true
    },
    "timezone": "UTC"
  },
  "message": "Preferences updated successfully"
}
```

### PUT /api/v1/preferences

Replace all preferences

**Request:**

```json
{
  "theme": "light",
  "language": "en",
  "notifications": {
    "email": false,
    "push": false,
    "sound": false
  },
  "timezone": "UTC"
}
```

### DELETE /api/v1/preferences

Reset preferences to default

**Response:**

```json
{
  "message": "Preferences reset to default"
}
```

## Frontend Usage

### Using the Hook

```typescript
import { usePreferences } from "@/hooks/use-preferences";

function MyComponent() {
  const {
    preferences,
    isLoading,
    updatePreferences,
    isUpdating
  } = usePreferences();

  const handleThemeChange = (theme: "light" | "dark" | "system") => {
    updatePreferences({ theme });
  };

  return (
    <div>
      <p>Current theme: {preferences?.theme}</p>
      <button onClick={() => handleThemeChange("dark")}>
        Switch to Dark
      </button>
    </div>
  );
}
```

### Theme Provider

```typescript
import { ThemeProvider } from "@/components/providers/theme-provider";

function App() {
  return (
    <ThemeProvider>
      <YourApp />
    </ThemeProvider>
  );
}
```

### Using Theme

```typescript
import { useTheme } from "@/components/providers/theme-provider";

function ThemeSwitcher() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <select value={theme} onChange={(e) => setTheme(e.target.value)}>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="system">System</option>
    </select>
  );
}
```

## Features

### 1. Theme Switching

- Light mode
- Dark mode
- System preference (auto-detect)
- Persists across sessions
- Syncs across devices

### 2. Language Selection

Supported languages:

- English (en)
- Bahasa Indonesia (id)
- Español (es)
- Français (fr)
- Deutsch (de)
- 日本語 (ja)
- 中文 (zh)

### 3. Notification Preferences

- Email notifications
- Push notifications
- Sound alerts

### 4. Timezone

- UTC
- Asia/Jakarta (WIB)
- Asia/Makassar (WITA)
- Asia/Jayapura (WIT)
- America/New_York (EST)
- America/Los_Angeles (PST)
- Europe/London (GMT)
- Asia/Tokyo (JST)

### 5. Application Info

- Version number
- Build date
- Platform information

## Migration

Run the migration:

```bash
cd smarthome-backend
bun prisma migrate deploy
```

Or create new migration:

```bash
bun prisma migrate dev --name add_user_preferences
```

## Security

- All endpoints require authentication (JWT token)
- Users can only access/modify their own preferences
- Preferences are validated using Zod schemas
- JSONB type in PostgreSQL for flexible schema

## Performance

- **localStorage**: Instant access (0ms)
- **Backend API**: ~50-100ms (with caching)
- **React Query**: Automatic caching and background sync
- **Stale time**: 5 minutes (configurable)

## Best Practices

1. **Always use localStorage as primary source** for immediate UI updates
2. **Sync to backend** for cross-device persistence
3. **Handle offline mode** gracefully with localStorage fallback
4. **Validate preferences** before saving to prevent invalid states
5. **Use TypeScript types** for type safety

## Testing

### Backend

```bash
# Get preferences
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/v1/preferences

# Update preferences
curl -X PATCH \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"theme":"dark","language":"id"}' \
  http://localhost:3000/api/v1/preferences
```

### Frontend

```typescript
// Test in browser console
localStorage.getItem("user-preferences");
```

## Troubleshooting

### Preferences not syncing

1. Check authentication token
2. Verify backend API is running
3. Check browser console for errors
4. Clear localStorage and re-login

### Theme not applying

1. Check if ThemeProvider is wrapping your app
2. Verify theme class is added to document root
3. Check Tailwind dark mode configuration

### Language not changing

1. Implement i18n library (next-intl, react-i18next)
2. Map language code to translations
3. Update components to use translation keys

## Future Enhancements

- [ ] Add more languages
- [ ] Custom theme colors
- [ ] Font size preferences
- [ ] Accessibility settings
- [ ] Data export/import
- [ ] Preference history/versioning
