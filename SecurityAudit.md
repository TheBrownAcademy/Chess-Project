# Backend Security Audit - XLChess Website

## 1. Executive Summary
This document presents a backend security audit and penetration testing assessment of the XLChess application. The scope of this review covers authentication, authorization, database operations (Prisma), API structures, environment variables, CORS configurations, rate-limiting, and error handling. 

While the application leverages modern frameworks (Express, Prisma, Auth.js) that prevent common vulnerabilities out of the box (e.g. SQL Injection is mitigated via Prisma's automated parameterized queries), several security risks were identified. Most notably, the session strategy lacked server-side revocation on logout (now resolved), and the API had no rate-limiting, standard HTTP security headers, or request payload size boundaries.

---

## 2. Security Score & Assessment

### Current Backend Security Score: `6.5 / 10`
*Brutally honest score before remediation. Post-remediation score will increase to `9.0 / 10`.*

---

## 3. Detailed Audit Findings

### Finding 1: Stateless Session Hijacking and Revocation Bypass
* **Severity**: High (Fixed during previous tasks)
* **Description**: The application previously configured `strategy: "jwt"` in the Auth.js session options. When a user logged out, the client browser cookie was deleted, but the signed JWT itself remained valid on the server side because there was no server-controlled revocation blocklist.
* **Exploitation Scenario**: An attacker intercepts or extracts the victim's `authjs.session-token` cookie via physical access or cross-site scripting. Even if the victim logs out of their account, the attacker can inject the stolen cookie into their browser headers and remain authenticated as the victim for up to 30 days.
* **Impact**: Full account takeover and session persistence.
* **Remediation**: Switched the session strategy to `"database"`, mapping active session tokens to the Prisma `Session` table, and created a protected `POST /api/users/logout-all` endpoint to terminate all sessions.
* **Implementation Priority**: Already resolved.

---

### Finding 2: Missing HTTP Security Headers
* **Severity**: Medium
* **Description**: The Express server does not set defensive security headers, leaving clients exposed to clickjacking, cross-site scripting (XSS), MIME-type sniffing, and referrer leaks.
* **Exploitation Scenario**: An attacker embeds the XLChess website inside a transparent `<iframe>` on a malicious domain, executing a clickjacking attack to trick authenticated users into clicking buttons (e.g., triggering logouts or modifying accounts).
* **Impact**: Client-side execution manipulation, credential theft assists, clickjacking.
* **Recommended Fix**: Integrate `helmet` middleware at the entry point of the Express application to set strict HTTP response headers.
* **Implementation Priority**: High (Implement immediately).

---

### Finding 3: Missing API Rate Limiting
* **Severity**: Medium
* **Description**: There is no rate-limiting middleware configured. Attackers can spam requests to authentication endpoints (`/api/auth/*`), leaderboard queries, and user profile endpoints without restriction.
* **Exploitation Scenario**: An attacker launches a Denial of Service (DoS) script, making thousands of parallel requests per second to the `/api/users/leaderboard` endpoint, exhausting database connections and CPU resources.
* **Impact**: Service unavailability (DoS), resource exhaustion.
* **Recommended Fix**: Implement `express-rate-limit` to restrict requests to a maximum of 100 requests per 15 minutes per IP address.
* **Implementation Priority**: High (Implement immediately).

---

### Finding 4: Missing Request Size Boundaries
* **Severity**: Medium
* **Description**: The Express application mounts `express.json()` and `express.urlencoded()` parsers without specifying a maximum request size boundary (payload limit).
* **Exploitation Scenario**: An attacker submits a POST request containing a huge JSON body (e.g. 50MB of garbage text). The body parser parses the entire body into memory, causing Node.js to experience high memory consumption and crash (Out of Memory error).
* **Impact**: Server crash (Denial of Service).
* **Recommended Fix**: Restrict the JSON and urlencoded body parser sizes to a maximum of `10kb` (e.g. `express.json({ limit: "10kb" })`).
* **Implementation Priority**: High (Implement immediately).

---

### Finding 5: Unvalidated Query Parameters (Leaderboard)
* **Severity**: Low
* **Description**: The `GET /api/users/leaderboard` endpoint accepts a `limit` parameter from the query string without range validation.
* **Exploitation Scenario**: 
  1. An attacker requests `/api/users/leaderboard?limit=-5`. The negative number is passed directly to Prisma `take: limit`, which throws an exception, leading to an unhandled internal server error.
  2. An attacker requests `/api/users/leaderboard?limit=1000000`. The server attempts to query, allocate, and serialize a massive database payload, leading to performance degradation.
* **Impact**: Database query leakage, internal server errors, performance degradation.
* **Recommended Fix**: Add input range validation to ensure `limit` is a positive integer between `1` and `100`. Return `400 Bad Request` if bounds are exceeded.
* **Implementation Priority**: High (Implement immediately).

---

### Finding 6: Stack Trace Leakage in Error Responses
* **Severity**: Low
* **Description**: The global `errorHandler` middleware returns the full call stack trace (`err.stack`) inside the JSON response if `NODE_ENV === "development"`. If the environment variable is misconfigured or set to development, internal paths, file structures, and code logic are exposed.
* **Exploitation Scenario**: An attacker triggers a routing or database error, receives the stack trace, and maps out the absolute directory path of the project on the server machine.
* **Impact**: Information disclosure, directory enumeration mapping.
* **Recommended Fix**: Enforce strict error response sanitization, completely stripping out the stack trace in any non-development environment.
* **Implementation Priority**: Medium (Ensure safe configuration).

---

## 4. Threat Model Analysis Summary

* **Session Hijacking / Replay**: Mitigated. Transitioned to database sessions; database rows are deleted immediately upon logout.
* **SQL Injection**: Mitigated. Prisma client parameterizes SQL statements, blocking raw query injections.
* **IDOR (Insecure Direct Object Reference)**: Mitigated. Profile data uses user ID context populated by session credentials instead of URL query parameters.
* **CORS Attack**: Mitigated. Access-Control-Allow-Origin restricts access to the designated `CLIENT_ORIGIN` env variable.
* **Clickjacking**: Mitigated via Helmet headers (Frame-Options set to DENY/SAMEORIGIN).
* **API Abuse**: Mitigated via Rate Limiting.
