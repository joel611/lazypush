# lazypush

A Bun-native terminal UI for testing Firebase Cloud Messaging (FCM) push notifications. Manage projects, devices, and messages entirely from your terminal.

## Features

- **Keyboard-driven TUI** — navigate everything without leaving the terminal
- **Multi-project support** — manage multiple Firebase projects with independent service accounts
- **Device registry** — store named iOS and Android device tokens per project
- **Multi-device selection** — send to multiple devices simultaneously with `space` to toggle
- **Message composer** — configure notification title/body, data payload, and platform-specific options (APNs/Android)
- **Send results** — per-device success/failure feedback after each send

## Prerequisites

- [Bun](https://bun.sh/) (v1.0 or higher)
- A Firebase service account JSON file with FCM permissions

## Installation

```bash
git clone https://github.com/yourusername/lazypush.git
cd lazypush
bun install
```

## Usage

```bash
bun run src/index.tsx
```

### Keyboard Reference

| Key | Action |
|-----|--------|
| `tab` | Switch focus between Projects and Devices panels |
| `q` | Quit |
| **Projects panel** | |
| `↑` / `↓` | Navigate projects |
| `n` | New project |
| `e` | Edit selected project |
| `D` | Delete selected project |
| **Devices panel** | |
| `↑` / `↓` | Navigate devices |
| `space` | Toggle device selection |
| `a` | Add device to current project |
| `e` | Edit selected device |
| `D` | Delete selected device |
| **Global** | |
| `m` | Open message composer |
| `s` / `↵` | Send notification to selected devices |

### Workflow

1. Press `n` to create a project — enter a name and path to your Firebase service account JSON
2. Press `tab` to switch to the Devices panel, then `a` to add a device (name, platform, FCM token)
3. Use `space` to select one or more devices
4. Press `m` to compose your message (title, body, data payload, platform options)
5. Press `s` to send — results appear per device

## Configuration

All data is stored under `~/.config/lazypush/`:

```
~/.config/lazypush/
└── projects/
    └── [project-id]/
        ├── config.json    # Project name and service account path
        └── devices.json   # Device registry for this project
```

### config.json

```json
{
  "id": "project-uuid",
  "name": "My Firebase Project",
  "serviceAccountPath": "/path/to/service-account.json",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

### devices.json

```json
[
  {
    "id": "device-uuid",
    "name": "John's iPhone",
    "platform": "ios",
    "token": "fcm-token-here",
    "createdAt": "2025-01-01T00:00:00Z"
  }
]
```

## Project Structure

```
src/
├── index.tsx                  # Entry point
├── App.tsx                    # Root component + keyboard routing
├── store.ts                   # Reactive state (Solid.js signals/store)
├── components/
│   ├── ProjectList.tsx
│   ├── DeviceList.tsx
│   ├── StatusBar.tsx
│   └── modals/
│       ├── ProjectModal.tsx
│       ├── DeviceModal.tsx
│       ├── MessageModal.tsx
│       └── ResultModal.tsx
└── lib/
    ├── types.ts               # Shared TypeScript types
    ├── config.ts              # Config read/write (disk I/O)
    ├── fcm.ts                 # Firebase Admin SDK calls
    └── config.test.ts         # Unit tests
```

## Development

```bash
bun run src/index.tsx   # Run the TUI
bun test                # Run unit tests
```

## Security

- Service account JSON files contain sensitive Firebase credentials — never commit them
- `lazypush` stores only the file path reference, not the credentials themselves
- Service account files are `.gitignore`d by default
- All data is local — nothing is synced to any cloud service

## Troubleshooting

**"Invalid service account" / auth error**
Verify the JSON is a valid Firebase service account with Cloud Messaging permissions.

**"Token not registered"**
The FCM token is expired or invalid — regenerate it from your mobile app.

**Notification not received**
Check that the service account matches the Firebase project the app is registered under, and that the device has internet connectivity.

## License

MIT
