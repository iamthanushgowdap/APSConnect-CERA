# CERA API Test Script

Run this in your terminal to test if the timetable API works:

```bash
curl -X POST http://localhost:3000/api/cera/query \
  -H "Content-Type: application/json" \
  -d '{"userQuery": "timetable"}'
```

Expected response should contain HTML with timetable data, not an internal server error.

If it still shows an error, check the server logs for the specific error message.
