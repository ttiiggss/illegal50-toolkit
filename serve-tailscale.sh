#!/usr/bin/env bash
# Serves ~/illegal50-toolkit on all interfaces so it is reachable via both
# the Tailscale overlay address and the LAN address. Binding to 0.0.0.0
# avoids having to track two separate IPs (which can each change on their
# own) and avoids running two separate server processes/ports.
set -euo pipefail

SITE_DIR="$HOME/illegal50-toolkit"
PORT="8642"

# Sanity-check expected addresses are present; log only, don't fail startup
# if one is temporarily missing (e.g. LAN link down, Tailscale still starting).
TS_IP="$(tailscale ip -4 2>/dev/null | head -n 1 || true)"
LAN_IP="$(ip -4 -o addr show enp195s0 2>/dev/null | awk '{print $4}' | cut -d/ -f1 || true)"
echo "Tailscale IPv4: ${TS_IP:-<none detected>}"
echo "LAN IPv4 (enp195s0): ${LAN_IP:-<none detected>}"

echo "Binding to 0.0.0.0:${PORT} (reachable via Tailscale + LAN), serving ${SITE_DIR}"
cd "${SITE_DIR}"
exec python3 -m http.server "${PORT}" --bind 0.0.0.0
