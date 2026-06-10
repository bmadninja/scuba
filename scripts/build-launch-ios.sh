#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT="$ROOT_DIR/ios/Scuba.xcodeproj"
SCHEME="${SCHEME:-Scuba}"
CONFIGURATION="${CONFIGURATION:-Debug}"
SIMULATOR_NAME="${SIMULATOR_NAME:-iPhone 16}"
DERIVED_DATA="$ROOT_DIR/ios/.derivedData"
BUNDLE_ID="com.scubaseason.app"
SCREENSHOT_PATH="$DERIVED_DATA/scuba-launch.png"

if ! xcodebuild -version >/dev/null 2>&1; then
  cat >&2 <<'MESSAGE'
xcodebuild is not available for iOS builds. Install Xcode, then run:
  sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
MESSAGE
  exit 1
fi

if ! xcrun simctl help >/dev/null 2>&1; then
  echo "simctl is unavailable. Make sure the active developer directory points to Xcode." >&2
  exit 1
fi

echo "Building $SCHEME for $SIMULATOR_NAME..."
xcodebuild \
  -project "$PROJECT" \
  -scheme "$SCHEME" \
  -configuration "$CONFIGURATION" \
  -destination "platform=iOS Simulator,name=$SIMULATOR_NAME" \
  -derivedDataPath "$DERIVED_DATA" \
  build

APP_PATH="$DERIVED_DATA/Build/Products/$CONFIGURATION-iphonesimulator/$SCHEME.app"
if [[ ! -d "$APP_PATH" ]]; then
  echo "Built app was not found at $APP_PATH" >&2
  exit 1
fi

UDID="$(xcrun simctl list devices available | sed -nE "/$SIMULATOR_NAME/s/.*\\(([0-9A-Fa-f-]{36})\\).*/\\1/p" | head -n 1)"
if [[ -z "$UDID" ]]; then
  echo "No available simulator named '$SIMULATOR_NAME'. Set SIMULATOR_NAME to an installed device." >&2
  exit 1
fi

echo "Booting simulator $SIMULATOR_NAME ($UDID)..."
xcrun simctl boot "$UDID" >/dev/null 2>&1 || true
xcrun simctl bootstatus "$UDID" -b

echo "Installing and launching $BUNDLE_ID..."
xcrun simctl install "$UDID" "$APP_PATH"
xcrun simctl launch "$UDID" "$BUNDLE_ID"

mkdir -p "$DERIVED_DATA"
xcrun simctl io "$UDID" screenshot "$SCREENSHOT_PATH"
echo "Screenshot captured at $SCREENSHOT_PATH"
