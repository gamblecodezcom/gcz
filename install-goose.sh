#!/bin/bash
# ============================================================
#   Goose Database Migration Tool Installation Script
# ============================================================

set -e

# Detect OS
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" || "$OSTYPE" == "cygwin" ]]; then
  OS="windows"
else
  OS="unix"
fi

# Configuration
CONFIGURE=${CONFIGURE:-true}  # Set to false to disable interactive PATH configuration
GOOSE_VERSION=${GOOSE_VERSION:-latest}
GOOSE_BIN_DIR="$HOME/.local/bin"

# Create bin directory if it doesn't exist
mkdir -p "$GOOSE_BIN_DIR"

echo "Installing goose database migration tool..."
echo "Installation directory: $GOOSE_BIN_DIR"

# Installation logic would go here (download, install goose)
# This is a placeholder - actual installation depends on your method
# For example:
# - Download from GitHub releases
# - Use package manager
# - Build from source
# etc.

# After installation, check if goose is in PATH
if command -v goose &> /dev/null; then
  echo "✓ goose installed successfully"
else
  echo "⚠ goose installed but not found in PATH"
fi

# --- 7) Check PATH and give instructions if needed ---
if [[ ":$PATH:" != *":$GOOSE_BIN_DIR:"* ]]; then
  echo ""
  echo "Warning: goose installed, but $GOOSE_BIN_DIR is not in your PATH."
  
  if [ "$OS" = "windows" ]; then
    echo "To add goose to your PATH in PowerShell:"
    echo ""
    echo "# Add to your PowerShell profile"
    echo '$profilePath = $PROFILE'
    echo 'if (!(Test-Path $profilePath)) { New-Item -Path $profilePath -ItemType File -Force }'
    echo 'Add-Content -Path $profilePath -Value ''$env:PATH = "$env:USERPROFILE\.local\bin;$env:PATH"'''
    echo "# Reload profile or restart PowerShell"
    echo '. $PROFILE'
    echo ""
    echo "Alternatively, you can run:"
    echo "    goose configure"
    echo "or rerun this install script after updating your PATH."
  else
    SHELL_NAME=$(basename "$SHELL")

    echo ""
    echo "The \$GOOSE_BIN_DIR is not in your PATH."

    if [ "$CONFIGURE" = true ]; then
      echo "What would you like to do?"
      echo "1) Add it for me"
      echo "2) I'll add it myself, show instructions"

      read -p "Enter choice [1/2]: " choice

      case "$choice" in
      1)
        RC_FILE="$HOME/.${SHELL_NAME}rc"
        echo "Adding \$GOOSE_BIN_DIR to $RC_FILE..."
        echo "export PATH=\"$GOOSE_BIN_DIR:\$PATH\"" >> "$RC_FILE"
        echo "Done! Reload your shell or run 'source $RC_FILE' to apply changes."
        ;;
      2)
        echo ""
        echo "Add it to your PATH by editing ~/.${SHELL_NAME}rc or similar:"
        echo "    export PATH=\"$GOOSE_BIN_DIR:\$PATH\""
        echo "Then reload your shell (e.g. 'source ~/.${SHELL_NAME}rc') to apply changes."
        ;;
      *)
        echo "Invalid choice. Please add \$GOOSE_BIN_DIR to your PATH manually."
        ;;
      esac
    else
      echo ""
      echo "Configure disabled. Please add \$GOOSE_BIN_DIR to your PATH manually."
    fi

  fi
  
  echo ""
fi

echo "Installation complete!"
