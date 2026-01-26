# 📦 Installation Guide

## System Requirements

### Minimum Requirements
- **OS**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **RAM**: 4GB (8GB recommended)
- **Storage**: 500MB free space
- **CPU**: 64-bit processor
- **Internet**: Required for AI provider APIs

### Recommended Requirements
- **OS**: Windows 11, macOS 12+, or Linux (Ubuntu 20.04+)
- **RAM**: 8GB or more
- **Storage**: 2GB free space
- **CPU**: Multi-core 64-bit processor
- **Internet**: Stable broadband connection

## Prerequisites

### 1. Node.js Installation

**Windows & macOS:**
- Download from [nodejs.org](https://nodejs.org/)
- Install version 18 or higher
- Verify installation: `node --version`

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Linux (CentOS/RHEL):**
```bash
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

### 2. Rust Installation

**All Platforms:**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
rustc --version
```

**Windows Alternative:**
- Download from [rustup.rs](https://rustup.rs/)
- Run the installer and follow instructions

### 3. Tauri CLI Installation

```bash
npm install -g @tauri-apps/cli
# or
cargo install tauri-cli
```

## Installation Methods

### Method 1: Pre-built Binaries (Recommended)

**Download from GitHub Releases:**
1. Visit [Releases Page](https://github.com/yourusername/rainy-cowork/releases)
2. Download the appropriate file for your OS:
   - Windows: `rainy-cowork_x.x.x_x64_en-US.msi`
   - macOS: `rainy-cowork_x.x.x_x64.dmg`
   - Linux: `rainy-cowork_x.x.x_amd64.deb` or `rainy-cowork_x.x.x_x86_64.AppImage`

**Windows Installation:**
```powershell
# Download and run the MSI installer
# Or use winget (if available)
winget install RainyCowork
```

**macOS Installation:**
```bash
# Download and mount the DMG
# Drag to Applications folder
# Or use Homebrew (if available)
brew install --cask rainy-cowork
```

**Linux Installation:**
```bash
# Ubuntu/Debian
sudo dpkg -i rainy-cowork_x.x.x_amd64.deb
sudo apt-get install -f

# AppImage (Universal)
chmod +x rainy-cowork_x.x.x_x86_64.AppImage
./rainy-cowork_x.x.x_x86_64.AppImage

# Arch Linux (AUR)
yay -S rainy-cowork
```

### Method 2: Build from Source

**1. Clone Repository:**
```bash
git clone https://github.com/yourusername/rainy-cowork.git
cd rainy-cowork
```

**2. Install Dependencies:**
```bash
npm install
```

**3. Development Build:**
```bash
npm run tauri dev
```

**4. Production Build:**
```bash
npm run tauri build
```

The built application will be in `src-tauri/target/release/bundle/`

### Method 3: Docker (Development)

```bash
# Clone repository
git clone https://github.com/yourusername/rainy-cowork.git
cd rainy-cowork

# Build Docker image
docker build -t rainy-cowork .

# Run container
docker run -p 3000:3000 rainy-cowork
```

## Post-Installation Setup

### 1. First Launch
- Launch Rainy Cowork from your applications menu
- The app will create necessary directories and configuration files
- You'll see the welcome screen with setup instructions

### 2. AI Provider Configuration
Configure at least one AI provider to use Rainy Cowork:

**OpenAI Setup:**
1. Get API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Go to Settings → AI Providers → OpenAI
3. Enter your API key and save

**Google Gemini Setup:**
1. Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Go to Settings → AI Providers → Google
3. Enter your API key and save

**Other Providers:**
- **Groq**: Get key from [Groq Console](https://console.groq.com/keys)
- **Cerebras**: Get key from [Cerebras Cloud](https://cloud.cerebras.ai/)
- **Rainy API**: Get key from [Rainy Dashboard](https://dashboard.rainy.com/)

### 3. Folder Permissions
Grant the AI agent access to folders:

1. Go to Settings → Permissions
2. Click "Add Folder"
3. Select folders you want the AI to access
4. Choose permission level (Read, Write, Full)

**Recommended Folders:**
- Downloads (for file organization)
- Documents (for document processing)
- Desktop (for quick access)
- Project folders (for specific work)

### 4. Theme and Preferences
Customize your experience:

1. Go to Settings → Appearance
2. Choose your preferred theme
3. Adjust font size and layout preferences
4. Configure notification settings

## Verification

### Test Installation
1. **Launch Application**: Ensure Rainy Cowork starts without errors
2. **Check AI Connection**: Go to Settings → AI Providers and test connection
3. **Test File Operations**: Try organizing a small folder
4. **Verify Permissions**: Ensure folder access is working

### Troubleshooting

**Common Issues:**

**"Failed to start application"**
- Ensure all prerequisites are installed
- Check system requirements
- Try running as administrator (Windows) or with sudo (Linux)

**"AI Provider connection failed"**
- Verify API key is correct
- Check internet connection
- Ensure API key has sufficient credits/quota

**"Permission denied" errors**
- Grant necessary folder permissions
- Check file system permissions
- Run with appropriate user privileges

**Performance Issues:**
- Close unnecessary applications
- Increase available RAM
- Check disk space
- Update graphics drivers

### Getting Help

**Documentation:**
- [User Guide](USER_GUIDE.md)
- [FAQ](FAQ.md)
- [API Documentation](API.md)

**Community Support:**
- [GitHub Discussions](https://github.com/yourusername/rainy-cowork/discussions)
- [Discord Server](https://discord.gg/rainy-cowork)
- [Reddit Community](https://reddit.com/r/rainycowork)

**Direct Support:**
- [GitHub Issues](https://github.com/yourusername/rainy-cowork/issues)
- Email: support@rainy-cowork.com

## Updating

### Automatic Updates
Rainy Cowork checks for updates automatically and will notify you when new versions are available.

### Manual Updates
1. Download the latest version from GitHub Releases
2. Install over the existing installation
3. Your settings and data will be preserved

### Development Updates
```bash
cd rainy-cowork
git pull origin main
npm install
npm run tauri dev
```

## Uninstallation

**Windows:**
- Use "Add or Remove Programs" in Settings
- Or run the uninstaller from the Start Menu

**macOS:**
- Drag Rainy Cowork from Applications to Trash
- Remove configuration: `rm -rf ~/Library/Application\ Support/rainy-cowork`

**Linux:**
```bash
# Ubuntu/Debian
sudo apt remove rainy-cowork

# Manual cleanup
rm -rf ~/.config/rainy-cowork
rm -rf ~/.local/share/rainy-cowork
```

---

*For additional help with installation, please visit our [support documentation](SUPPORT.md) or reach out to the community.*