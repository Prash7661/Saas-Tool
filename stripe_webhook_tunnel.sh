#!/usr/bin/env bash

# ==============================================================================
# Stripe CLI Local Webhook Tunneling & Synthetic Event Script
# Project: MarkdownTableIO
# ==============================================================================

set -e

PORT=${1:-3000}
TARGET_URL="http://localhost:${PORT}/api/webhooks/stripe"

echo "========================================================"
echo "🚀 Starting Stripe Webhook Local Tunnel for MarkdownTableIO"
echo "Target Endpoint: ${TARGET_URL}"
echo "========================================================"

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo "❌ Error: Stripe CLI is not installed."
    echo "Install via Homebrew: brew install stripe/stripe-cli/stripe"
    echo "Install via Scoop (Windows): scoop bucket add stripe https://github.github.io/scoop-bucket; scoop install stripe"
    echo "Or download binary from: https://github.com/stripe/stripe-cli/releases"
    exit 1
fi

echo "🔐 Step 1: Verifying Stripe CLI authentication status..."
stripe status || stripe login

echo ""
echo "📡 Step 2: Listening for Stripe events and forwarding to local Next.js server..."
echo "Copy the 'whsec_...' webhook signing secret displayed below into your .env.local file:"
echo ""

# Run stripe listen in forward mode
stripe listen --events checkout.session.completed --forward-to "${TARGET_URL}"
