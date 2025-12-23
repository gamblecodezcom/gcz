#!/bin/bash
# gzai wallet - Goose CLI integration for GambleCodez wallet operations
# Usage: gzai wallet [status|refresh]

set -e

# Configuration
API_BASE_URL="${GCZ_API_URL:-http://localhost:8000}"
API_TOKEN="${GCZ_API_TOKEN:-}"

# Colors
COLOR_SUCCESS="\033[0;32m"
COLOR_ERROR="\033[0;31m"
COLOR_INFO="\033[0;36m"
COLOR_RESET="\033[0m"

# Show usage
usage() {
    echo "Usage: gzai wallet [command]"
    echo ""
    echo "Commands:"
    echo "  status    Check wallet balance and status (requires authentication)"
    echo "  refresh   Refresh wallet data from API"
    echo ""
    echo "Environment Variables:"
    echo "  GCZ_API_URL     API base URL (default: http://localhost:8000)"
    echo "  GCZ_API_TOKEN   JWT token for authentication"
    echo ""
    exit 1
}

# Check wallet status
check_wallet_status() {
    if [ -z "$API_TOKEN" ]; then
        echo -e "${COLOR_ERROR}Error: GCZ_API_TOKEN not set. Please authenticate first.${COLOR_RESET}"
        echo "To get a token, login via: curl -X POST $API_BASE_URL/api/users/login -d 'username=YOUR_USERNAME&password=YOUR_PASSWORD'"
        exit 1
    fi

    echo -e "${COLOR_INFO}Fetching wallet status...${COLOR_RESET}"
    
    response=$(curl -s -X GET "$API_BASE_URL/api/wallet" \
        -H "Authorization: Bearer $API_TOKEN" \
        -H "Content-Type: application/json")

    if [ $? -ne 0 ]; then
        echo -e "${COLOR_ERROR}Error: Failed to connect to API${COLOR_RESET}"
        exit 1
    fi

    # Check for errors
    if echo "$response" | grep -q '"detail"'; then
        error=$(echo "$response" | grep -o '"detail":"[^"]*"' | cut -d'"' -f4)
        echo -e "${COLOR_ERROR}Error: $error${COLOR_RESET}"
        exit 1
    fi

    # Parse and display wallet info
    balance=$(echo "$response" | grep -o '"balance":[0-9.]*' | cut -d':' -f2 || echo "0.0")
    user_id=$(echo "$response" | grep -o '"user_id":[0-9]*' | cut -d':' -f2 || echo "N/A")

    echo -e "${COLOR_SUCCESS}Wallet Status:${COLOR_RESET}"
    echo "  Balance: $balance"
    echo "  User ID: $user_id"
    echo ""
    echo "Full response:"
    echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
}

# Refresh wallet (same as status for now, but can be extended)
refresh_wallet() {
    echo -e "${COLOR_INFO}Refreshing wallet data...${COLOR_RESET}"
    check_wallet_status
}

# Main command handler
main() {
    command="${1:-status}"

    case "$command" in
        status)
            check_wallet_status
            ;;
        refresh)
            refresh_wallet
            ;;
        help|--help|-h)
            usage
            ;;
        *)
            echo -e "${COLOR_ERROR}Unknown command: $command${COLOR_RESET}"
            usage
            ;;
    esac
}

main "$@"
