#!/bin/bash
# E2E Tests for LAN Monitor
BASE="http://localhost:8080"
PASS=0
FAIL=0

test_endpoint() {
  local name="$1" method="$2" url="$3" data="$4" expect="$5"
  if [ "$method" = "GET" ] || [ "$method" = "DELETE" ]; then
    resp=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE$url")
  else
    resp=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE$url" -H "Content-Type: application/json" -d "$data")
  fi
  code=$(echo "$resp" | tail -1)
  
  if [ "$code" = "$expect" ]; then
    echo "✅ $name (HTTP $code)"
    PASS=$((PASS+1))
  else
    echo "❌ $name — expected $expect, got $code"
    FAIL=$((FAIL+1))
  fi
}

echo "🧪 LAN Monitor E2E Tests"
echo "========================"

echo ""
echo "## Frontend"
test_endpoint "Homepage loads" GET "/" "" "200"

echo ""
echo "## GPU API"
test_endpoint "GET /api/gpu" GET "/api/gpu" "" "200"

echo ""
echo "## Services API"
test_endpoint "GET /api/services" GET "/api/services" "" "200"

echo ""
echo "## Tickets CRUD"
test_endpoint "GET /api/tickets" GET "/api/tickets" "" "200"
test_endpoint "POST /api/tickets" POST "/api/tickets" '{"title":"E2E Test Ticket","description":"Auto-test","priority":"low"}' "201"

TICKET_ID=$(curl -s "$BASE/api/tickets" | python3 -c "import json,sys; ts=json.load(sys.stdin)['tickets']; print([t['id'] for t in ts if t['title']=='E2E Test Ticket'][0])" 2>/dev/null)

if [ -n "$TICKET_ID" ]; then
  test_endpoint "GET ticket by ID" GET "/api/tickets/$TICKET_ID" "" "200"
  test_endpoint "PUT ticket (assignee+lane)" PUT "/api/tickets/$TICKET_ID" '{"assignee":"siegbert","lane":"inprogress"}' "200"
  
  assigned=$(curl -s "$BASE/api/tickets/$TICKET_ID" | python3 -c "import json,sys; print(json.load(sys.stdin).get('assignee',''))")
  if [ "$assigned" = "siegbert" ]; then
    echo "✅ Assignee correctly persisted"; PASS=$((PASS+1))
  else
    echo "❌ Assignee not persisted (got: $assigned)"; FAIL=$((FAIL+1))
  fi
  
  test_endpoint "DELETE ticket" DELETE "/api/tickets/$TICKET_ID" "" "200"
fi

echo ""
echo "## Ideas CRUD"
test_endpoint "GET /api/ideas" GET "/api/ideas" "" "200"
test_endpoint "POST /api/ideas" POST "/api/ideas" '{"title":"E2E Test Idea","description":"Auto-test","tags":"test","submitted_by":"siegbert"}' "201"

IDEA_ID=$(curl -s "$BASE/api/ideas" | python3 -c "import json,sys; ideas=json.load(sys.stdin)['ideas']; print([i['id'] for i in ideas if i['title']=='E2E Test Idea'][0])" 2>/dev/null)
if [ -n "$IDEA_ID" ]; then
  test_endpoint "Convert idea to ticket" POST "/api/ideas/$IDEA_ID/convert" "" "200"
fi

echo ""
echo "## Agent Status"
test_endpoint "GET /api/agents/status" GET "/api/agents/status" "" "200"
test_endpoint "PUT /api/agents/siegbert/status" PUT "/api/agents/siegbert/status" '{"status":"online","currentTask":"testing"}' "200"

# Cleanup
curl -s "$BASE/api/tickets" | python3 -c "
import json,sys,urllib.request
for t in json.load(sys.stdin)['tickets']:
  if 'E2E Test' in t['title']:
    urllib.request.urlopen(urllib.request.Request('$BASE/api/tickets/'+t['id'], method='DELETE'))
" 2>/dev/null

echo ""
echo "========================"
echo "Results: $PASS passed, $FAIL failed"
[ $FAIL -eq 0 ] && echo "🎉 All tests passed!" || echo "⚠️  Some tests failed"
exit $FAIL
