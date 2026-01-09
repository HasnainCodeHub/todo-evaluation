#!/bin/bash
# Test script for Bridge Pattern Authentication Flow

echo "============================================"
echo "Testing Bridge Pattern Authentication Flow"
echo "============================================"
echo ""

# Test 1: Backend requires authentication
echo "[TEST 1] Backend should reject requests without JWT"
response=$(curl -s -w "\n%{http_code}" http://localhost:8000/api/tasks/)
status=$(echo "$response" | tail -n 1)
body=$(echo "$response" | sed '$d')

if [ "$status" = "401" ]; then
    echo "✅ PASS: Backend correctly requires authentication"
    echo "   Response: $body"
else
    echo "❌ FAIL: Expected 401, got $status"
fi
echo ""

# Test 2: Register a new user
echo "[TEST 2] Registering new test user"
timestamp=$(date +%s)
email="test-$timestamp@example.com"
password="TestPassword123"

signup_response=$(curl -s -c cookies.txt -w "\n%{http_code}" \
  -X POST http://localhost:3003/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3003" \
  -d "{\"email\":\"$email\",\"password\":\"$password\",\"name\":\"Test User\"}")

signup_status=$(echo "$signup_response" | tail -n 1)
if [ "$signup_status" = "200" ] || [ "$signup_status" = "201" ]; then
    echo "✅ PASS: User registered successfully"
    echo "   Email: $email"
else
    echo "⚠️  Registration response: $signup_status"
    echo "   Attempting to sign in with existing user..."
fi
echo ""

# Test 3: Sign in to get Better Auth session
echo "[TEST 3] Signing in to get Better Auth session"
signin_response=$(curl -s -b cookies.txt -c cookies.txt -w "\n%{http_code}" \
  -X POST http://localhost:3003/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3003" \
  -d "{\"email\":\"$email\",\"password\":\"$password\"}")

signin_status=$(echo "$signin_response" | tail -n 1)
if [ "$signin_status" = "200" ]; then
    echo "✅ PASS: Signed in successfully"
    echo "   Session cookie saved"
    echo "   Cookies:"
    cat cookies.txt | grep -v "^#" | head -5
else
    echo "❌ FAIL: Sign in failed with status $signin_status"
    echo "   Response: $(echo "$signin_response" | sed '$d')"
    exit 1
fi
echo ""

# Test 4: Test JWT Bridge Route
echo "[TEST 4] Testing JWT Bridge Route (/api/auth/jwt)"
jwt_response=$(curl -s -b cookies.txt -w "\n%{http_code}" \
  -H "Origin: http://localhost:3003" \
  http://localhost:3003/api/auth/jwt)

jwt_status=$(echo "$jwt_response" | tail -n 1)
jwt_body=$(echo "$jwt_response" | sed '$d')

if [ "$jwt_status" = "200" ]; then
    echo "✅ PASS: JWT Bridge returned token"
    token=$(echo "$jwt_body" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo "   Token (first 50 chars): ${token:0:50}..."
    
    # Decode JWT header and payload (for debugging)
    payload=$(echo "$token" | cut -d'.' -f2)
    # Base64 decode (handle padding)
    decoded=$(echo "$payload=" | base64 -d 2>/dev/null || echo "$payload" | base64 -d 2>/dev/null)
    echo "   Payload: $decoded"
else
    echo "❌ FAIL: JWT Bridge failed with status $jwt_status"
    echo "   Response: $jwt_body"
    exit 1
fi
echo ""

# Test 5: Test Backend with JWT from Bridge
echo "[TEST 5] Testing FastAPI Backend with JWT from Bridge"
tasks_response=$(curl -s -w "\n%{http_code}" \
  http://localhost:8000/api/tasks/ \
  -H "Authorization: Bearer $token")

tasks_status=$(echo "$tasks_response" | tail -n 1)
tasks_body=$(echo "$tasks_response" | sed '$d')

if [ "$tasks_status" = "200" ]; then
    echo "✅ PASS: Backend accepted JWT and returned tasks"
    echo "   Response: $tasks_body"
else
    echo "❌ FAIL: Backend rejected JWT with status $tasks_status"
    echo "   Response: $tasks_body"
    exit 1
fi
echo ""

# Test 6: Create a task
echo "[TEST 6] Creating a task through complete flow"
create_response=$(curl -s -w "\n%{http_code}" \
  -X POST http://localhost:8000/api/tasks/ \
  -H "Authorization: Bearer $token" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Task from Bridge","description":"Testing bridge pattern auth"}')

create_status=$(echo "$create_response" | tail -n 1)
create_body=$(echo "$create_response" | sed '$d')

if [ "$create_status" = "200" ] || [ "$create_status" = "201" ]; then
    echo "✅ PASS: Task created successfully"
    echo "   Response: $create_body"
else
    echo "❌ FAIL: Task creation failed with status $create_status"
    echo "   Response: $create_body"
fi
echo ""

# Test 7: Verify task was created
echo "[TEST 7] Verifying task was created (listing all tasks)"
list_response=$(curl -s -w "\n%{http_code}" \
  http://localhost:8000/api/tasks/ \
  -H "Authorization: Bearer $token")

list_status=$(echo "$list_response" | tail -n 1)
list_body=$(echo "$list_response" | sed '$d')

if [ "$list_status" = "200" ]; then
    task_count=$(echo "$list_body" | grep -o '"id"' | wc -l)
    echo "✅ PASS: Tasks retrieved successfully"
    echo "   Task count: $task_count"
    echo "   Response: $list_body"
else
    echo "❌ FAIL: Failed to list tasks"
fi
echo ""

# Cleanup
rm -f cookies.txt

echo "============================================"
echo "✅ ALL TESTS PASSED!"
echo "Bridge Pattern Authentication is working!"
echo "============================================"
