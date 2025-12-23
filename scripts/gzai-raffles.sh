#!/bin/bash
# gzai raffles - Goose CLI integration for GambleCodez raffle operations
# Usage: gzai raffles [list|entries|check]

set -e

# Configuration
API_BASE_URL="${GCZ_API_URL:-http://localhost:8000}"
API_TOKEN="${GCZ_API_TOKEN:-}"

# Colors
COLOR_SUCCESS="\033[0;32m"
COLOR_ERROR="\033[0;31m"
COLOR_INFO="\033[0;36m"
COLOR_WARNING="\033[0;33m"
COLOR_RESET="\033[0m"

# Show usage
usage() {
    echo "Usage: gzai raffles [command] [options]"
    echo ""
    echo "Commands:"
    echo "  list              List all active raffles"
    echo "  entries [id]      Show entries for a specific raffle (requires auth)"
    echo "  check [id]        Check if you're entered in a raffle (requires auth)"
    echo ""
    echo "Options:"
    echo "  --token TOKEN     Use specific JWT token"
    echo "  --url URL         Use specific API URL"
    echo ""
    echo "Environment Variables:"
    echo "  GCZ_API_URL       API base URL (default: http://localhost:8000)"
    echo "  GCZ_API_TOKEN     JWT token for authentication"
    echo ""
    exit 1
}

# List active raffles
list_raffles() {
    echo -e "${COLOR_INFO}Fetching active raffles...${COLOR_RESET}"
    
    response=$(curl -s -X GET "$API_BASE_URL/api/raffles" \
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

    # Parse raffles
    raffle_count=$(echo "$response" | grep -o '"id":[0-9]*' | wc -l)
    
    if [ "$raffle_count" -eq 0 ]; then
        echo -e "${COLOR_WARNING}No active raffles found${COLOR_RESET}"
        exit 0
    fi

    echo -e "${COLOR_SUCCESS}Found $raffle_count active raffle(s):${COLOR_RESET}"
    echo ""
    
    # Pretty print with python if available, otherwise raw JSON
    if command -v python3 &> /dev/null; then
        echo "$response" | python3 -c "
import json
import sys
data = json.load(sys.stdin)
for raffle in data:
    print(f\"ID: {raffle.get('id', 'N/A')}\")
    print(f\"  Name: {raffle.get('name', 'N/A')}\")
    print(f\"  Prize: {raffle.get('prize', 'N/A')}\")
    print(f\"  Description: {raffle.get('description', 'N/A')[:50]}...\")
    print(f\"  Active: {raffle.get('is_active', False)}\")
    print()
" 2>/dev/null || echo "$response" | python3 -m json.tool
    else
        echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
    fi
}

# Show entries for a raffle
show_entries() {
    raffle_id="$1"
    
    if [ -z "$raffle_id" ]; then
        echo -e "${COLOR_ERROR}Error: Raffle ID required${COLOR_RESET}"
        echo "Usage: gzai raffles entries <raffle_id>"
        exit 1
    fi

    if [ -z "$API_TOKEN" ]; then
        echo -e "${COLOR_ERROR}Error: GCZ_API_TOKEN not set. Authentication required.${COLOR_RESET}"
        exit 1
    fi

    echo -e "${COLOR_INFO}Fetching entries for raffle #$raffle_id...${COLOR_RESET}"
    
    # First get raffle details
    raffle_response=$(curl -s -X GET "$API_BASE_URL/api/raffles/$raffle_id/winners" \
        -H "Authorization: Bearer $API_TOKEN" \
        -H "Content-Type: application/json")

    if [ $? -ne 0 ]; then
        echo -e "${COLOR_ERROR}Error: Failed to connect to API${COLOR_RESET}"
        exit 1
    fi

    # Check for errors
    if echo "$raffle_response" | grep -q '"detail"'; then
        error=$(echo "$raffle_response" | grep -o '"detail":"[^"]*"' | cut -d'"' -f4)
        echo -e "${COLOR_ERROR}Error: $error${COLOR_RESET}"
        exit 1
    fi

    echo -e "${COLOR_SUCCESS}Raffle Entries/Winners:${COLOR_RESET}"
    echo "$raffle_response" | python3 -m json.tool 2>/dev/null || echo "$raffle_response"
}

# Check if user is entered
check_entry() {
    raffle_id="$1"
    
    if [ -z "$raffle_id" ]; then
        echo -e "${COLOR_ERROR}Error: Raffle ID required${COLOR_RESET}"
        echo "Usage: gzai raffles check <raffle_id>"
        exit 1
    fi

    if [ -z "$API_TOKEN" ]; then
        echo -e "${COLOR_ERROR}Error: GCZ_API_TOKEN not set. Authentication required.${COLOR_RESET}"
        exit 1
    fi

    echo -e "${COLOR_INFO}Checking entry status for raffle #$raffle_id...${COLOR_RESET}"
    
    # Get user info first
    user_response=$(curl -s -X GET "$API_BASE_URL/api/users/me" \
        -H "Authorization: Bearer $API_TOKEN" \
        -H "Content-Type: application/json")

    if echo "$user_response" | grep -q '"detail"'; then
        error=$(echo "$user_response" | grep -o '"detail":"[^"]*"' | cut -d'"' -f4)
        echo -e "${COLOR_ERROR}Error: $error${COLOR_RESET}"
        exit 1
    fi

    user_id=$(echo "$user_response" | grep -o '"id":[0-9]*' | cut -d':' -f2)
    
    # Get winners/entries
    entries_response=$(curl -s -X GET "$API_BASE_URL/api/raffles/$raffle_id/winners" \
        -H "Authorization: Bearer $API_TOKEN" \
        -H "Content-Type: application/json")

    # Check if user is in winners list
    if echo "$entries_response" | grep -q "\"user_id\":$user_id"; then
        echo -e "${COLOR_SUCCESS}✓ You are entered in this raffle!${COLOR_RESET}"
    else
        echo -e "${COLOR_WARNING}✗ You are not entered in this raffle${COLOR_RESET}"
    fi

    echo ""
    echo "Full entries data:"
    echo "$entries_response" | python3 -m json.tool 2>/dev/null || echo "$entries_response"
}

# Main command handler
main() {
    # Parse options
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --token)
                API_TOKEN="$2"
                shift 2
                ;;
            --url)
                API_BASE_URL="$2"
                shift 2
                ;;
            list)
                list_raffles
                exit 0
                ;;
            entries)
                shift
                show_entries "$1"
                exit 0
                ;;
            check)
                shift
                check_entry "$1"
                exit 0
                ;;
            help|--help|-h)
                usage
                ;;
            *)
                echo -e "${COLOR_ERROR}Unknown command: $1${COLOR_RESET}"
                usage
                ;;
        esac
    done

    # Default to list if no command
    if [ $# -eq 0 ]; then
        list_raffles
    else
        usage
    fi
}

main "$@"
