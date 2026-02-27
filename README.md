# supporttooljs

An Electron application with React and TypeScript

## Downloads (macOS)

Pre-built Mac builds are on [Releases](https://github.com/bSienkiewicz/SupportToolJS/releases). After downloading and installing, if macOS says **“SupportTool is damaged”**:
 
- In Terminal: `xattr -cr /Applications/SupportTool.app`

The app is unsigned; this is Gatekeeper’s quarantine, not a corrupted file.

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ pnpm install
```

### Development

```bash
$ pnpm dev
```

### Build

```bash
# For windows
$ pnpm build:win

# For macOS
$ pnpm build:mac

# For Linux
$ pnpm build:linux
```
