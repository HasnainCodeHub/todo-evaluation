#!/bin/bash
# ChatKit Setup Validation Script
# Validates that ChatKit frontend integration is properly configured

set -e

echo "🔍 Validating ChatKit Frontend Integration..."

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Check for @openai/chatkit-react in package.json
check_package() {
    if [ -f "package.json" ]; then
        if grep -q "@openai/chatkit-react" package.json; then
            echo -e "${GREEN}✓${NC} @openai/chatkit-react found in package.json"
        else
            echo -e "${RED}✗${NC} @openai/chatkit-react NOT found in package.json"
            echo "  Run: npm install @openai/chatkit-react"
            ((ERRORS++))
        fi
    else
        echo -e "${YELLOW}⚠${NC} package.json not found in current directory"
        ((WARNINGS++))
    fi
}

# Check for useChatKit usage
check_usage() {
    if grep -rq "useChatKit" --include="*.tsx" --include="*.ts" . 2>/dev/null; then
        echo -e "${GREEN}✓${NC} useChatKit hook found in codebase"
    else
        echo -e "${YELLOW}⚠${NC} No useChatKit usage found"
        ((WARNINGS++))
    fi
}

# Check for getClientSecret implementation
check_client_secret() {
    if grep -rq "getClientSecret" --include="*.tsx" --include="*.ts" . 2>/dev/null; then
        echo -e "${GREEN}✓${NC} getClientSecret configuration found"
    else
        echo -e "${YELLOW}⚠${NC} No getClientSecret implementation found"
        echo "  Ensure authentication is properly configured"
        ((WARNINGS++))
    fi
}

# Check for API key exposure
check_api_key_exposure() {
    if grep -rq "NEXT_PUBLIC.*OPENAI_API_KEY\|NEXT_PUBLIC.*sk_" --include="*.ts" --include="*.tsx" --include="*.env*" . 2>/dev/null; then
        echo -e "${RED}✗${NC} CRITICAL: API key may be exposed to client!"
        echo "  Never use NEXT_PUBLIC_ prefix for API keys"
        ((ERRORS++))
    else
        echo -e "${GREEN}✓${NC} No obvious API key exposure detected"
    fi
}

# Check for domain key in env
check_env_config() {
    if [ -f ".env" ] || [ -f ".env.local" ] || [ -f ".env.production" ]; then
        echo -e "${GREEN}✓${NC} Environment files found"

        # Check for OPENAI_API_KEY (should exist but not be NEXT_PUBLIC_)
        if grep -q "^OPENAI_API_KEY=" .env* 2>/dev/null; then
            echo -e "${GREEN}✓${NC} OPENAI_API_KEY configured (server-side)"
        else
            echo -e "${YELLOW}⚠${NC} OPENAI_API_KEY not found in env files"
            ((WARNINGS++))
        fi
    else
        echo -e "${YELLOW}⚠${NC} No environment files found"
        ((WARNINGS++))
    fi
}

# Check for session endpoint
check_session_endpoint() {
    if grep -rq "chatkit/session\|chatkit/start" --include="*.ts" --include="*.tsx" . 2>/dev/null; then
        echo -e "${GREEN}✓${NC} ChatKit session endpoint reference found"
    else
        echo -e "${YELLOW}⚠${NC} No session endpoint found"
        echo "  Ensure backend endpoint for token generation exists"
        ((WARNINGS++))
    fi
}

# Run all checks
echo ""
check_package
check_usage
check_client_secret
check_api_key_exposure
check_env_config
check_session_endpoint

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}Validation failed with $ERRORS error(s) and $WARNINGS warning(s)${NC}"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}Validation passed with $WARNINGS warning(s)${NC}"
    exit 0
else
    echo -e "${GREEN}All validations passed!${NC}"
    exit 0
fi
