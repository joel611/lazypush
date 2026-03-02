# FCM Push Notification Tester

A cross-platform desktop application for testing Firebase Cloud Messaging (FCM) push notifications. Built with Tauri, this tool helps backend and mobile app developers quickly test and debug push notifications for iOS and Android devices.

## Features

### Project Management
- **Multiple Firebase Projects**: Create and manage multiple Firebase projects within the application
- **Easy Configuration**: Drag and drop your Firebase service account JSON file to set up a project
- **Auto-save**: All project data is automatically saved to local file storage

### Device Management
- **Device Registry**: Create and organize test devices with custom names (e.g., "John's iPhone XS", "Samsung Galaxy S21")
- **Platform Support**: Manage both iOS and Android device tokens
- **Device Groups**: Organize devices by project or testing group

### Message Testing
- **Multiple Message Templates**: Define and save various demo messages for different testing scenarios
- **Rich Notifications**: Support for images, custom actions, and platform-specific configurations
- **Data Payloads**: Test both notification and data messages
- **Quick Send**: Send test notifications to selected devices with one click

### Data Storage
- **File-based Storage**: All data stored locally in organized folder structure
- **No Database Required**: Simple, portable data management
- **Project Isolation**: Each project's data is stored in separate folders

## Technology Stack

- **Framework**: [Tauri](https://tauri.app/) - Build smaller, faster, and more secure desktop applications
- **Frontend**: HTML/CSS/JavaScript (or React/Vue/Svelte - to be determined)
- **Backend**: Rust + Firebase Admin SDK
- **Platform**: Cross-platform (Windows, macOS, Linux)

## Prerequisites

- Node.js (v16 or higher)
- Rust (latest stable version)
- Firebase project with Cloud Messaging enabled
- Firebase service account JSON file(s)

## Installation

### Development Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/push-notification-tester.git
cd push-notification-tester
```

2. Install dependencies:
```bash
npm install
```

3. Run in development mode:
```bash
npm run tauri dev
```

### Building for Production

Build the application for your platform:
```bash
npm run tauri build
```

The compiled application will be available in `src-tauri/target/release/`.

## Usage

### 1. Create a Firebase Project

1. Launch the application
2. Click "New Project"
3. Enter a project name
4. Drag and drop your Firebase service account JSON file or click to browse
5. Click "Save"

### 2. Add Test Devices

1. Select your project from the sidebar
2. Navigate to the "Devices" tab
3. Click "Add Device"
4. Enter device details:
   - Device name (e.g., "John's iPhone XS")
   - Platform (iOS/Android)
   - FCM token
5. Click "Save"

### 3. Create Message Templates

1. Navigate to the "Messages" tab
2. Click "New Message Template"
3. Configure your message:
   - Template name
   - Notification title and body
   - Optional: Image URL
   - Optional: Custom data payload
   - Platform-specific settings (iOS/Android)
4. Click "Save Template"

### 4. Send Test Notifications

1. Select a message template
2. Choose target devices from the device list
3. Click "Send Notification"
4. View results (success/failure status for each device)

## Project Structure

```
push-notification-tester/
├── src/                    # Frontend source files
│   ├── components/         # UI components
│   ├── pages/             # Application pages
│   └── styles/            # CSS/styling files
├── src-tauri/             # Tauri backend (Rust)
│   ├── src/
│   │   └── main.rs        # Main Rust application
│   ├── Cargo.toml         # Rust dependencies
│   └── tauri.conf.json    # Tauri configuration
├── data/                  # Local data storage (auto-created)
│   └── projects/          # Per-project folders
│       └── [project-id]/
│           ├── config.json      # Project configuration
│           ├── devices.json     # Device registry
│           └── messages.json    # Message templates
├── index.mjs              # Legacy CLI script (deprecated)
└── README.md
```

## Data Storage Format

### Project Configuration
```json
{
  "id": "project-uuid",
  "name": "My Firebase Project",
  "serviceAccountPath": "path/to/service-account.json",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

### Device Registry
```json
[
  {
    "id": "device-uuid",
    "name": "John's iPhone XS",
    "platform": "ios",
    "token": "fcm-token-here",
    "createdAt": "2025-01-01T00:00:00Z"
  }
]
```

### Message Templates
```json
[
  {
    "id": "message-uuid",
    "name": "Welcome Message",
    "notification": {
      "title": "Welcome!",
      "body": "Thanks for joining us."
    },
    "data": {
      "screen": "home"
    },
    "android": {},
    "apns": {}
  }
]
```

## Security Considerations

- **Local Storage**: All Firebase credentials are stored locally on your machine
- **No Cloud Sync**: Data is not synced to any cloud service
- **Secure Credentials**: Keep your service account JSON files secure
- **Git Ignore**: Service account files are automatically git-ignored

## Troubleshooting

### "Invalid service account" error
- Verify your JSON file is a valid Firebase service account
- Ensure the service account has FCM permissions

### "Token not registered" error
- The FCM token may be invalid or expired
- Regenerate the token from your mobile app

### Notification not received
- Check device internet connection
- Verify FCM token is correct and up-to-date
- Ensure the service account matches the Firebase project

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Roadmap

- [ ] Tauri desktop application implementation
- [ ] Multi-project support
- [ ] Device management UI
- [ ] Message template editor
- [ ] Batch sending to multiple devices
- [ ] Send history and logs
- [ ] Import/export configurations
- [ ] Topic-based messaging
- [ ] Scheduled notifications
- [ ] Dark mode support

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

## Acknowledgments

- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Tauri](https://tauri.app/)
- The open-source community
