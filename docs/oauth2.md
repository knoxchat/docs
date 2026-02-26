---
sidebar_position: 18
title: Knox OAuth2 — Developer & User Documentation
description: A comprehensive guide to Knox.chat's OAuth2 implementation for developers and users.
keywords: [knox, knox api, ai integration, knox-ms, oauth2, authentication, authorization, developer guide]
---

# Knox.chat OAuth2 — Developer & User Documentation

> **Version**: 1.0  
> **Last Updated**: February 2026  
> **Standards**: [RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749) · [RFC 7636 (PKCE)](https://datatracker.ietf.org/doc/html/rfc7636) · [RFC 7009 (Revocation)](https://datatracker.ietf.org/doc/html/rfc7009) · [RFC 7662 (Introspection)](https://datatracker.ietf.org/doc/html/rfc7662)

## Table of Contents

- [Overview](#overview)
- [Key Concepts](#key-concepts)
- [Quick Start](#quick-start)
- [OAuth2 Flows](#oauth2-flows)
  - [Authorization Code Grant](#authorization-code-grant)
  - [Authorization Code + PKCE](#authorization-code--pkce)
  - [Refresh Token Flow](#refresh-token-flow)
- [Scopes & Permissions](#scopes--permissions)
- [API Reference](#api-reference)
  - [Discovery Endpoint](#1-openid-discovery)
  - [Authorization Endpoint](#2-authorization-endpoint)
  - [Token Endpoint](#3-token-endpoint)
  - [Token Revocation](#4-token-revocation)
  - [Token Introspection](#5-token-introspection)
  - [UserInfo Endpoint](#6-userinfo-endpoint)
  - [API Token Management](#7-api-token-management)
  - [Application Management](#8-application-management)
  - [User Consent Management](#9-user-consent-management)
  - [Admin Endpoints](#10-admin-endpoints)
- [Token Reference](#token-reference)
- [Webhooks](#webhooks)
- [Rate Limits](#rate-limits)
- [Error Handling](#error-handling)
- [Security Best Practices](#security-best-practices)
- [Code Examples](#code-examples)
  - [Full Authorization Flow (JavaScript)](#full-authorization-flow-javascript)
  - [PKCE Helper Functions](#pkce-helper-functions)
  - [Node.js (Express) Integration](#nodejs-express-integration)
  - [Python (Flask) Integration](#python-flask-integration)
  - [React SPA (Public Client)](#react-spa-public-client)
  - [cURL Examples](#curl-examples)
- [Configuration Reference](#configuration-reference)
- [Database Schema](#database-schema)
- [Admin Guide](#admin-guide)
- [FAQ](#faq)

## Overview

Knox.chat provides a **full OAuth2 2.0 Authorization Server**, enabling third-party applications to authenticate Knox.chat users securely — similar to "Sign in with GitHub" or "Sign in with Google".

### What You Can Do

- **Authenticate users** — Let users sign into your app with their Knox.chat account
- **Access user data** — Read profile info, email, and usage stats with user consent
- **Manage API tokens** — Create and manage API tokens on behalf of users
- **Build integrations** — Create bots, dashboards, or tools that interact with Knox.chat

### Supported Grant Types

| Grant Type | Supported | Use Case |
|:-----------|:---------:|:---------|
| Authorization Code | ✅ | Server-side web apps |
| Authorization Code + PKCE | ✅ | SPAs, mobile apps, CLI tools |
| Refresh Token | ✅ | Long-lived sessions (with token rotation) |
| Client Credentials | ❌ | — |
| Implicit | ❌ | — (deprecated by OAuth 2.1) |

## Key Concepts

| Term | Description |
|:-----|:------------|
| **Application (Client)** | A third-party app registered with Knox.chat that wants to access user data |
| **Client ID** | Public identifier for your application (format: `knox_<32chars>`) |
| **Client Secret** | Confidential key used by server-side apps (format: `knoxsec_<48chars>`) |
| **Authorization Code** | Temporary code exchanged for tokens after user consent |
| **Access Token** | Short-lived token used to access protected resources (format: `knoxat_<48chars>`) |
| **Refresh Token** | Long-lived token used to obtain new access tokens (format: `knoxrt_<48chars>`) |
| **Scope** | Specific permissions your app is requesting |
| **Consent** | User's explicit approval to grant your app the requested permissions |
| **PKCE** | Proof Key for Code Exchange — additional security for public clients |
| **Confidential Client** | An app that can securely store a client secret (e.g., server-side apps) |
| **Public Client** | An app that cannot securely store secrets (e.g., SPAs, mobile apps). **PKCE is mandatory.** |

## Quick Start

### 1. Register Your Application

Navigate to **Settings → OAuth2 Apps → My Applications** in the Knox.chat dashboard, or use the API:

```bash
curl -X POST https://api.knox.chat/api/oauth2/applications \
  -H "Authorization: Bearer <session_cookie>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My App",
    "description": "A cool integration with Knox.chat",
    "homepage_url": "https://myapp.com",
    "logo_url": "https://myapp.com/logo.png",
    "redirect_uris": ["https://myapp.com/callback"],
    "scopes": "openid email profile",
    "app_type": "confidential",
    "webhook_url": "https://myapp.com/webhooks/knox"
  }'
```

> ⚠️ **Save your Client Secret immediately!** It is shown only once at creation time and cannot be retrieved later. If lost, you must rotate it.

### 2. Redirect Users to Authorize

```
https://knox.chat/oauth2/authorize?
  response_type=code
  &client_id=knox_your_client_id
  &redirect_uri=https://myapp.com/callback
  &scope=openid email profile
  &state=random_csrf_token
```

### 3. Exchange the Code for Tokens

```bash
curl -X POST https://api.knox.chat/api/oauth2/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "authorization_code",
    "code": "received_auth_code",
    "redirect_uri": "https://myapp.com/callback",
    "client_id": "knox_your_client_id",
    "client_secret": "knoxsec_your_client_secret"
  }'
```

### 4. Access User Data

```bash
curl https://api.knox.chat/api/oauth2/userinfo \
  -H "Authorization: Bearer knoxat_your_access_token"
```

## OAuth2 Flows

### Authorization Code Grant

The standard flow for **confidential (server-side) clients**.

```mermaid
sequenceDiagram
    participant Browser as User's Browser
    participant App as Your App<br/>(Server)
    participant Knox as Knox.chat<br/>OAuth2

    Browser->>App: 1. Click "Login with Knox.chat"
    App->>Browser: 2. Redirect to /oauth2/authorize
    Browser->>Knox: 3. User sees consent screen, approves
    Knox->>Browser: 4. Redirect to callback with ?code=xxx&state=yyy
    Browser->>App: 5. Forward code to your server
    App->>Knox: 6. POST /oauth2/token (code + secret)
    Knox->>App: 7. Receive access_token + refresh_token
    App->>Knox: 8. GET /oauth2/userinfo
    Knox->>App: 9. User profile data
    App->>Browser: 10. Logged in!
```

### Authorization Code + PKCE

For **public clients** (SPAs, mobile apps, CLI tools) that cannot securely store a client secret. PKCE is **mandatory** for public clients and recommended for all clients.

**Additional Steps:**

1. Generate a random `code_verifier` (43–128 characters)
2. Compute `code_challenge = BASE64URL(SHA256(code_verifier))`
3. Include `code_challenge` and `code_challenge_method=S256` in the authorization request
4. Include `code_verifier` in the token exchange request

```
Authorization URL:
  /oauth2/authorize?
    response_type=code
    &client_id=knox_xxx
    &redirect_uri=https://myapp.com/callback
    &scope=openid
    &state=random_state
    &code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
    &code_challenge_method=S256

Token Exchange:
  POST /oauth2/token
  {
    "grant_type": "authorization_code",
    "code": "auth_code_here",
    "redirect_uri": "https://myapp.com/callback",
    "client_id": "knox_xxx",
    "code_verifier": "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
  }
```

### Refresh Token Flow

Access tokens expire after **1 hour** by default. Use the refresh token to obtain new tokens without user interaction.

> ⚠️ **Token Rotation**: Each refresh request issues a new refresh token and **revokes the old one**. Always store the new refresh token from the response.

```bash
curl -X POST https://api.knox.chat/api/oauth2/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "refresh_token",
    "refresh_token": "knoxrt_your_refresh_token",
    "client_id": "knox_your_client_id",
    "client_secret": "knoxsec_your_client_secret"
  }'
```

**Response:**
```json
{
  "access_token": "knoxat_new_access_token",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "knoxrt_new_refresh_token",
  "scope": "openid email profile"
}
```

## Scopes & Permissions

Scopes define what data and actions your application can access. Users will see a description of each scope on the consent screen.

| Scope | Description | Data Accessible |
|:------|:------------|:----------------|
| `openid` | **Read basic account information** — Username, display name, and avatar | `sub`, `username`, `display_name`, `avatar_url`, `role` |
| `email` | **Read email address** | `email`, `email_verified` |
| `profile` | **Read and update profile information** | Full profile including `group`, `created_at` |
| `tokens:read` | **List API tokens** | Token names, creation dates, status |
| `tokens:write` | **Create and manage API tokens** | Create new tokens, delete existing tokens |
| `usage:read` | **Read API usage statistics and quota** | `quota`, `used_quota`, `request_count` |

### Scope Rules

- **`openid` is always included** — Even if not explicitly requested, the `openid` scope is automatically added as the minimum scope.
- **Request minimal scopes** — Only request the scopes your application actually needs.
- **Scope validation** — Requested scopes must be a subset of your app's registered `allowed_scopes`.
- **Re-consent** — If your app requests new scopes not previously granted, the user will be shown the consent screen again.

## API Reference

### Base URLs

| Service | URL |
|:--------|:----|
| Authorization Page (Browser) | `https://knox.chat/oauth2/authorize` |
| API Endpoints | `https://api.knox.chat/api/oauth2/` |


### 1. OpenID Discovery

Returns the OpenID Connect discovery document with all endpoint URLs and supported features.

```
GET /api/oauth2/.well-known/openid-configuration
```

**Authentication**: None

**Response** `200 OK`:
```json
{
  "issuer": "https://api.knox.chat",
  "authorization_endpoint": "https://knox.chat/oauth2/authorize",
  "token_endpoint": "https://api.knox.chat/api/oauth2/token",
  "userinfo_endpoint": "https://api.knox.chat/api/oauth2/userinfo",
  "revocation_endpoint": "https://api.knox.chat/api/oauth2/revoke",
  "introspection_endpoint": "https://api.knox.chat/api/oauth2/introspect",
  "scopes_supported": ["openid", "email", "profile", "tokens:read", "tokens:write", "usage:read"],
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "refresh_token"],
  "token_endpoint_auth_methods_supported": ["client_secret_basic", "client_secret_post"],
  "code_challenge_methods_supported": ["S256", "plain"],
  "subject_types_supported": ["public"]
}
```

### 2. Authorization Endpoint

#### GET — Fetch Authorization Info

Returns application info and consent status for the consent screen.

```
GET /api/oauth2/authorize
```

**Authentication**: Session cookie (user must be logged in)

**Query Parameters**:

| Parameter | Required | Description |
|:----------|:--------:|:------------|
| `response_type` | ✅ | Must be `code` |
| `client_id` | ✅ | Your application's client ID |
| `redirect_uri` | ✅ | Must match a registered redirect URI |
| `scope` | ❌ | Space-separated scopes (defaults to `openid`) |
| `state` | ❌ | Opaque CSRF protection value (highly recommended) |
| `code_challenge` | ❌ | PKCE code challenge (**required** for public clients) |
| `code_challenge_method` | ❌ | `S256` (recommended) or `plain` |

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "application": {
      "id": 1,
      "name": "My App",
      "description": "A cool integration",
      "homepage_url": "https://myapp.com",
      "logo_url": "https://myapp.com/logo.png",
      "client_id": "knox_abc123...",
      "is_verified": true
    },
    "requested_scopes": [
      { "name": "openid", "description": "Read basic account information" },
      { "name": "email", "description": "Read email address" }
    ],
    "has_existing_consent": false,
    "existing_scopes": null,
    "needs_reconsent": false,
    "redirect_uri": "https://myapp.com/callback",
    "state": "random_state_value"
  }
}
```

**Error Responses**:

| Status | Condition |
|:-------|:----------|
| `400` | Invalid `response_type`, missing `client_id`, invalid `redirect_uri`, invalid scopes |
| `401` | User not logged in |
| `403` | OAuth2 disabled, app suspended, unverified app (when approval required) |
| `404` | Unknown `client_id` |

#### POST — Submit Authorization Decision

Processes the user's approve/deny decision and returns a redirect URL.

```
POST /api/oauth2/authorize
```

**Authentication**: Session cookie

**Request Body** (`application/json`):

```json
{
  "client_id": "knox_abc123...",
  "redirect_uri": "https://myapp.com/callback",
  "scope": "openid email",
  "state": "random_state_value",
  "approved": true,
  "code_challenge": "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
  "code_challenge_method": "S256"
}
```

| Field | Type | Required | Description |
|:------|:-----|:--------:|:------------|
| `client_id` | string | ✅ | Application's client ID |
| `redirect_uri` | string | ✅ | Must match the GET request |
| `scope` | string | ❌ | Space-separated scopes |
| `state` | string | ❌ | Opaque state value |
| `approved` | boolean | ✅ | `true` to approve, `false` to deny |
| `code_challenge` | string | ❌ | PKCE code challenge |
| `code_challenge_method` | string | ❌ | `S256` or `plain` |

**Response on Approve** `200 OK`:
```json
{
  "success": true,
  "data": {
    "redirect_url": "https://myapp.com/callback?code=AUTH_CODE_HERE&state=random_state_value"
  }
}
```

**Response on Deny** `200 OK`:
```json
{
  "success": true,
  "data": {
    "redirect_url": "https://myapp.com/callback?error=access_denied&error_description=User+denied+authorization&state=random_state_value"
  }
}
```

### 3. Token Endpoint

Exchange an authorization code for tokens, or refresh an existing token pair.

```
POST /api/oauth2/token
```

**Authentication**: Client credentials via one of:
- **Basic Auth**: `Authorization: Basic base64(client_id:client_secret)`
- **Body Parameters**: `client_id` and `client_secret` in the request body

**Content Types**: `application/json` or `application/x-www-form-urlencoded`

**Rate Limit**: 60 requests/minute per IP

#### Grant Type: `authorization_code`

**Request**:
```json
{
  "grant_type": "authorization_code",
  "code": "AUTH_CODE_HERE",
  "redirect_uri": "https://myapp.com/callback",
  "client_id": "knox_abc123...",
  "client_secret": "knoxsec_xyz789...",
  "code_verifier": "optional_pkce_verifier"
}
```

| Field | Type | Required | Description |
|:------|:-----|:--------:|:------------|
| `grant_type` | string | ✅ | Must be `authorization_code` |
| `code` | string | ✅ | The authorization code received |
| `redirect_uri` | string | ✅ | Must match the original authorization request |
| `client_id` | string | ✅ | Your application's client ID |
| `client_secret` | string | ❌* | Required for confidential clients |
| `code_verifier` | string | ❌* | Required if `code_challenge` was sent during authorization |

#### Grant Type: `refresh_token`

**Request**:
```json
{
  "grant_type": "refresh_token",
  "refresh_token": "knoxrt_your_refresh_token",
  "client_id": "knox_abc123...",
  "client_secret": "knoxsec_xyz789..."
}
```

| Field | Type | Required | Description |
|:------|:-----|:--------:|:------------|
| `grant_type` | string | ✅ | Must be `refresh_token` |
| `refresh_token` | string | ✅ | The refresh token |
| `client_id` | string | ✅ | Your application's client ID |
| `client_secret` | string | ❌* | Required for confidential clients |

**Success Response** `200 OK`:
```json
{
  "access_token": "knoxat_new_access_token...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "knoxrt_new_refresh_token...",
  "scope": "openid email profile"
}
```

> **Headers**: `Cache-Control: no-store` is always set on token responses.

**Error Response** `400 Bad Request`:
```json
{
  "success": false,
  "message": "Invalid authorization code",
  "error": "invalid_grant",
  "error_description": "The authorization code is invalid, expired, or has already been used"
}
```

| Error Code | Description |
|:-----------|:------------|
| `invalid_request` | Missing or invalid parameters |
| `invalid_client` | Client authentication failed |
| `invalid_grant` | Code expired, already used, or PKCE mismatch |
| `unsupported_grant_type` | Grant type not supported |
| `invalid_scope` | Requested scope is invalid |

### 4. Token Revocation

Revoke an access token or refresh token (RFC 7009).

```
POST /api/oauth2/revoke
```

**Authentication**: Optional client credentials (Basic auth or body params)

**Rate Limit**: 60 requests/minute per IP

**Request**:
```json
{
  "token": "knoxat_or_knoxrt_token_here",
  "token_type_hint": "access_token"
}
```

| Field | Type | Required | Description |
|:------|:-----|:--------:|:------------|
| `token` | string | ✅ | The token to revoke |
| `token_type_hint` | string | ❌ | `access_token` or `refresh_token` (optimization hint) |

**Response**: Always `200 OK` per RFC 7009 — even if the token is invalid or already revoked.

```json
{
  "success": true,
  "message": "Token revoked successfully"
}
```

### 5. Token Introspection

Inspect a token to determine if it is active and retrieve its metadata (RFC 7662).

```
POST /api/oauth2/introspect
```

**Authentication**: **Required** — Basic auth with client credentials (`Authorization: Basic base64(client_id:client_secret)`)

**Rate Limit**: 120 requests/minute per IP

**Request**:
```json
{
  "token": "knoxat_token_to_inspect",
  "token_type_hint": "access_token"
}
```

**Response — Active Token** `200 OK`:
```json
{
  "active": true,
  "scope": "openid email profile",
  "client_id": "knox_abc123...",
  "username": "johndoe",
  "token_type": "Bearer",
  "exp": 1740000000,
  "iat": 1739996400,
  "sub": "42"
}
```

**Response — Inactive Token** `200 OK`:
```json
{
  "active": false
}
```

### 6. UserInfo Endpoint

Retrieve information about the authenticated user based on the granted scopes.

```
GET /api/oauth2/userinfo
```

**Authentication**: `Authorization: Bearer <access_token>`

**Rate Limit**: 300 requests/minute per IP

**Response** `200 OK` (fields vary by granted scopes):

```json
{
  "sub": "42",
  "username": "johndoe",
  "display_name": "John Doe",
  "avatar_url": "https://knox.chat/avatars/johndoe.png",
  "email": "john@example.com",
  "email_verified": true,
  "quota": 1000000,
  "used_quota": 250000,
  "request_count": 1500,
  "group": "premium",
  "role": 10,
  "created_at": 1700000000
}
```

**Fields by Scope**:

| Field | Required Scope |
|:------|:---------------|
| `sub` | `openid` |
| `username` | `openid` |
| `display_name` | `openid` |
| `avatar_url` | `openid` |
| `role` | `openid` |
| `email` | `email` |
| `email_verified` | `email` |
| `group` | `profile` |
| `created_at` | `profile` |
| `quota` | `usage:read` |
| `used_quota` | `usage:read` |
| `request_count` | `usage:read` |

### 7. API Token Management

Manage Knox.chat API tokens on behalf of the user via OAuth2 Bearer authentication.

#### List API Tokens

```
GET /api/oauth2/tokens
```

**Authentication**: Bearer token with `tokens:read` scope

**Response** `200 OK`:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "My API Token",
      "key": "sk-...xxxx",
      "created_time": 1700000000,
      "accessed_time": 1700100000,
      "expired_time": -1,
      "remain_quota": 500000,
      "unlimited_quota": false,
      "used_quota": 250000
    }
  ]
}
```

#### Create API Token

```
POST /api/oauth2/tokens
```

**Authentication**: Bearer token with `tokens:write` scope

**Request**:
```json
{
  "name": "My New Token",
  "expired_time": -1,
  "remain_quota": 100000,
  "unlimited_quota": false
}
```

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "My New Token",
    "key": "sk-full_token_key_shown_once"
  }
}
```

> ⚠️ The full API token key is only returned once at creation time.

#### Delete API Token

```
DELETE /api/oauth2/tokens/{token_id}
```

**Authentication**: Bearer token with `tokens:write` scope

**Response** `200 OK`:
```json
{
  "success": true,
  "message": "Token deleted successfully"
}
```

### 8. Application Management

Manage your registered OAuth2 applications. These endpoints require session-based authentication (logged-in user).

#### List Your Applications

```
GET /api/oauth2/applications
```

**Authentication**: Session cookie

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "id": 1,
        "name": "My App",
        "description": "A cool integration",
        "homepage_url": "https://myapp.com",
        "logo_url": "https://myapp.com/logo.png",
        "client_id": "knox_abc123...",
        "redirect_uris": "[\"https://myapp.com/callback\"]",
        "allowed_scopes": "openid email profile",
        "app_type": "confidential",
        "status": 1,
        "created_at": 1700000000,
        "updated_at": 1700000000,
        "is_verified": false,
        "webhook_url": "https://myapp.com/webhooks/knox"
      }
    ],
    "total": 1,
    "page": 1,
    "page_size": 20
  }
}
```

#### Create Application

```
POST /api/oauth2/applications
```

**Authentication**: Session cookie

**Request** (`application/json`):

```json
{
  "name": "My App",
  "description": "A description of my application",
  "homepage_url": "https://myapp.com",
  "logo_url": "https://myapp.com/logo.png",
  "redirect_uris": [
    "https://myapp.com/callback",
    "https://myapp.com/auth/callback"
  ],
  "scopes": "openid email profile",
  "app_type": "confidential",
  "webhook_url": "https://myapp.com/webhooks/knox"
}
```

**Validation Rules**:

| Field | Rule |
|:------|:-----|
| `name` | 1–64 characters |
| `description` | 0–500 characters |
| `homepage_url` | Valid URL |
| `logo_url` | Valid URL |
| `redirect_uris` | 1–10 valid URIs (HTTPS required; HTTP allowed for `localhost`; custom schemes allowed for mobile) |
| `scopes` | Space-separated valid scopes (1–256 chars) |
| `app_type` | `"confidential"` or `"public"` |
| `webhook_url` | Valid URL (optional) |

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "My App",
    "client_id": "knox_abc123...",
    "client_secret_plain": "knoxsec_xyz789...",
    "redirect_uris": "[\"https://myapp.com/callback\"]",
    "allowed_scopes": "openid email profile",
    "app_type": "confidential",
    "homepage_url": "https://myapp.com",
    "logo_url": "https://myapp.com/logo.png",
    "description": "A description of my application",
    "is_verified": false,
    "created_at": 1700000000,
    "webhook_url": "https://myapp.com/webhooks/knox"
  }
}
```

> ⚠️ **`client_secret_plain` is only returned once!** Save it securely immediately.

#### Update Application

```
PUT /api/oauth2/applications/{app_id}
```

**Authentication**: Session cookie (must be app owner)

**Request**: Same fields as create, all optional except `app_id` in the URL.

#### Delete Application

```
DELETE /api/oauth2/applications/{app_id}
```

**Authentication**: Session cookie (must be app owner)

> This performs a **soft delete** (sets status to 3) and **revokes all tokens and consents** associated with the application.

#### Rotate Client Secret

```
POST /api/oauth2/applications/{app_id}/rotate-secret
```

**Authentication**: Session cookie (must be app owner)

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "client_secret_plain": "knoxsec_new_secret..."
  }
}
```

> ⚠️ The old secret is immediately invalidated. Update your application configuration before the rotation.

### 9. User Consent Management

Users can view and revoke their authorized applications.

#### List Authorized Applications

```
GET /api/oauth2/consents
```

**Authentication**: Session cookie

**Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "consents": [
      {
        "id": 1,
        "user_id": 42,
        "application_id": 1,
        "scopes": "openid email",
        "created_at": 1700000000,
        "updated_at": 1700000000,
        "app_name": "My App",
        "app_description": "A cool integration",
        "app_logo_url": "https://myapp.com/logo.png",
        "app_homepage_url": "https://myapp.com",
        "app_is_verified": true
      }
    ],
    "total": 1,
    "page": 1,
    "page_size": 20
  }
}
```

#### Revoke Application Access

```
DELETE /api/oauth2/consents/{application_id}
```

**Authentication**: Session cookie

> Revoking consent **deletes all tokens** (access + refresh) and **removes the consent record**. The application will need to request authorization again.

### 10. Admin Endpoints

Administrative endpoints for managing all OAuth2 applications and viewing audit logs. Requires **admin-level session authentication**.

#### List All Applications (Admin)

```
GET /api/oauth2/admin/applications?page=1&page_size=20
```

**Response** includes `owner_username` resolved via JOIN.

#### Verify Application

```
POST /api/oauth2/admin/applications/verify
```

**Request**: `{ "app_id": 1 }`

> Verified applications display a verification badge on the consent screen, increasing user trust.

#### Suspend Application

```
POST /api/oauth2/admin/applications/suspend
```

**Request**: `{ "app_id": 1 }`

> Suspended applications cannot issue new tokens, and existing tokens become invalid on validation.

#### Activate Application

```
POST /api/oauth2/admin/applications/activate
```

**Request**: `{ "app_id": 1 }`

> Reactivates a previously suspended application.

#### View Audit Logs

```
GET /api/oauth2/admin/audit?page=1&page_size=20&event_type=token_issued
```

| Parameter | Description |
|:----------|:------------|
| `page` | Page number |
| `page_size` | Items per page |
| `event_type` | Filter by event type (optional) |
| `format` | Set to `csv` for CSV export |

#### Export Audit Logs (CSV)

```
GET /api/oauth2/admin/audit?format=csv
```

Returns a CSV file with up to 10,000 records.

## Token Reference

| Token Type | Format | Lifetime | Storage Method |
|:-----------|:-------|:---------|:---------------|
| Client ID | `knox_<32 chars>` | Permanent | Plaintext in DB |
| Client Secret | `knoxsec_<48 chars>` | Until rotated | bcrypt hash in DB |
| Authorization Code | 40 random characters | **10 minutes** | SHA-256 hash in DB, one-time use |
| Access Token | `knoxat_<48 chars>` | **1 hour** | SHA-256 hash in DB |
| Refresh Token | `knoxrt_<48 chars>` | **30 days** | SHA-256 hash in DB |
| API Token (via `tokens:write`) | `sk-<48 chars>` | Configurable | Plaintext in DB |

### Token Security

- **All tokens are stored as SHA-256 hashes** in the database — never in plaintext.
- **Client secrets are stored as bcrypt hashes**.
- **Authorization codes are single-use** — enforced atomically at the database level.
- **Refresh token rotation** — every refresh invalidates the old refresh token and its associated access token.
- **App status validation** — tokens are checked against app status on every use; suspended app tokens are rejected.
- **User status validation** — disabled users cannot refresh tokens.

## Webhooks

If your application registers a `webhook_url`, Knox.chat will send HTTP POST notifications for key events.

### Webhook Format

```
POST <your_webhook_url>
Content-Type: application/json
X-Knox-Event: <event_type>
X-Knox-Timestamp: <unix_timestamp>
```

```json
{
  "event": "consent_granted",
  "application_id": 1,
  "user_id": 42,
  "timestamp": 1700000000,
  "data": {
    "scopes": "openid email profile"
  }
}
```

### Supported Events

| Event | Trigger |
|:------|:--------|
| `consent_granted` | User approves authorization for your app |
| `consent_revoked` | User revokes your app's access from their settings |

### Webhook Behavior

- **Fire-and-forget** — Knox.chat does not retry failed webhook deliveries.
- **10-second timeout** — Webhook requests timeout after 10 seconds.
- **Async delivery** — Webhooks are sent asynchronously and do not block the OAuth2 flow.

## Rate Limits

| Endpoint | Limit | Key |
|:---------|:------|:----|
| `POST /oauth2/token` | 60 requests/minute | Per IP |
| `POST /oauth2/revoke` | 60 requests/minute | Per IP |
| `POST /oauth2/introspect` | 120 requests/minute | Per IP |
| `GET /oauth2/userinfo` | 300 requests/minute | Per IP |
| `GET /oauth2/authorize` | 30 requests/minute | Per user |
| `POST /oauth2/authorize` | 30 requests/minute | Per user |

When rate limited, the API returns `429 Too Many Requests`.

## Error Handling

### Standard OAuth2 Error Response

Token endpoint errors follow [RFC 6749 §5.2](https://datatracker.ietf.org/doc/html/rfc6749#section-5.2):

```json
{
  "success": false,
  "message": "Human-readable error message",
  "error": "error_code",
  "error_description": "Detailed description of the error"
}
```

### OAuth2 Error Codes

| Error Code | HTTP Status | Description |
|:-----------|:------------|:------------|
| `invalid_request` | 400 | Missing or invalid required parameters |
| `invalid_client` | 401 | Client authentication failed (wrong secret, unknown client) |
| `invalid_grant` | 400 | Authorization code expired, already used, redirect_uri mismatch, or PKCE verification failed |
| `unsupported_grant_type` | 400 | Grant type not supported (only `authorization_code` and `refresh_token` are supported) |
| `invalid_scope` | 400 | Requested scope is invalid or exceeds the app's allowed scopes |
| `access_denied` | 403 | User denied authorization, app suspended, or OAuth2 disabled |

### Authorization Redirect Errors

When errors occur during the authorization flow, the user is redirected back to your `redirect_uri` with error parameters:

```
https://myapp.com/callback?error=access_denied&error_description=User+denied+authorization&state=your_state
```

### HTTP Error Codes

| Status | Meaning |
|:-------|:--------|
| `200` | Success |
| `400` | Bad Request — Invalid parameters |
| `401` | Unauthorized — Missing or invalid authentication |
| `403` | Forbidden — Insufficient permissions, app suspended, or OAuth2 disabled |
| `404` | Not Found — Unknown resource |
| `429` | Too Many Requests — Rate limit exceeded |
| `500` | Internal Server Error |


## Security Best Practices

### For All Clients

1. **Always use the `state` parameter** — Generate a random, unguessable value and validate it on the callback to prevent CSRF attacks.
2. **Use PKCE** — Even for confidential clients, PKCE provides additional security against authorization code interception.
3. **Request minimal scopes** — Only request the permissions your app actually needs.
4. **Use HTTPS for redirect URIs** — HTTP is only acceptable for `localhost` during development.
5. **Validate tokens server-side** — Never trust client-side token validation alone.

### For Confidential Clients (Server-Side)

6. **Never expose your client secret** — Keep it server-side only; never include it in frontend code, URLs, or logs.
7. **Rotate secrets periodically** — Use the secret rotation endpoint to update credentials.
8. **Store tokens encrypted** — Encrypt access and refresh tokens at rest in your database.
9. **Use Basic Auth for the token endpoint** — Prefer `Authorization: Basic` over body parameters.

### For Public Clients (SPAs, Mobile)

10. **PKCE is mandatory** — The server enforces PKCE for public clients.
11. **Store tokens in memory only** — For SPAs, never use `localStorage` or `sessionStorage` for tokens.
12. **Use platform secure storage** — For mobile apps, use iOS Keychain or Android Keystore.

### Token Storage Recommendations

| Platform | Recommended Storage |
|:---------|:-------------------|
| Server-side | Encrypted database column |
| SPA (Browser) | In-memory only (JavaScript variables) |
| Mobile (iOS) | Keychain Services |
| Mobile (Android) | EncryptedSharedPreferences / Keystore |
| Desktop | OS credential store (Keychain, Credential Manager, libsecret) |

### Webhook Security

- Validate the `X-Knox-Timestamp` header to prevent replay attacks.
- Consider implementing HMAC signature verification if you handle sensitive webhook data.


## Code Examples

### Full Authorization Flow (JavaScript)

```javascript
// Step 1: Generate state for CSRF protection
const state = crypto.randomUUID();
sessionStorage.setItem('oauth_state', state);

// Step 2: Redirect user to authorize
const authUrl = new URL('https://knox.chat/oauth2/authorize');
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('client_id', 'knox_your_client_id');
authUrl.searchParams.set('redirect_uri', 'https://myapp.com/callback');
authUrl.searchParams.set('scope', 'openid email profile');
authUrl.searchParams.set('state', state);

window.location.href = authUrl.toString();

// Step 3: Handle the callback (on your callback page)
const params = new URLSearchParams(window.location.search);
const code = params.get('code');
const returnedState = params.get('state');

// Verify state matches
if (returnedState !== sessionStorage.getItem('oauth_state')) {
  throw new Error('State mismatch — possible CSRF attack');
}

// Step 4: Exchange code for tokens (do this server-side!)
const tokenResponse = await fetch('https://api.knox.chat/api/oauth2/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: 'https://myapp.com/callback',
    client_id: 'knox_your_client_id',
    client_secret: 'knoxsec_your_secret', // Server-side only!
  }),
});
const tokens = await tokenResponse.json();

// Step 5: Get user info
const userResponse = await fetch('https://api.knox.chat/api/oauth2/userinfo', {
  headers: { 'Authorization': `Bearer ${tokens.access_token}` },
});
const user = await userResponse.json();
console.log(`Welcome, ${user.display_name}!`);

// Step 6: Refresh when needed
const refreshResponse = await fetch('https://api.knox.chat/api/oauth2/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    grant_type: 'refresh_token',
    refresh_token: tokens.refresh_token,
    client_id: 'knox_your_client_id',
    client_secret: 'knoxsec_your_secret',
  }),
});
const newTokens = await refreshResponse.json();
// ⚠️ Store newTokens.refresh_token — the old one is now revoked!
```

### PKCE Helper Functions

```javascript
// Generate a random code verifier (43-128 characters)
function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Generate code challenge from verifier (S256 method)
async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Usage:
const codeVerifier = generateCodeVerifier();
const codeChallenge = await generateCodeChallenge(codeVerifier);

// Store verifier securely for later use
sessionStorage.setItem('pkce_verifier', codeVerifier);

// Include in authorization URL:
authUrl.searchParams.set('code_challenge', codeChallenge);
authUrl.searchParams.set('code_challenge_method', 'S256');

// Include verifier in token exchange:
// { ..., code_verifier: sessionStorage.getItem('pkce_verifier') }
```

### Node.js (Express) Integration

```javascript
const express = require('express');
const crypto = require('crypto');
const app = express();

const CLIENT_ID = 'knox_your_client_id';
const CLIENT_SECRET = 'knoxsec_your_client_secret';
const REDIRECT_URI = 'http://localhost:3000/auth/callback';
const KNOX_API = 'https://api.knox.chat/api/oauth2';

// Step 1: Start authorization
app.get('/auth/login', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url');

  // Store in session
  req.session.oauth_state = state;
  req.session.pkce_verifier = verifier;

  const authUrl = new URL('https://knox.chat/oauth2/authorize');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('code_challenge', challenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');

  res.redirect(authUrl.toString());
});

// Step 2: Handle callback
app.get('/auth/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) return res.status(400).send(`Authorization error: ${error}`);
  if (state !== req.session.oauth_state) return res.status(403).send('State mismatch');

  // Exchange code for tokens
  const tokenRes = await fetch(`${KNOX_API}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: req.session.pkce_verifier,
    }),
  });
  const tokens = await tokenRes.json();

  // Get user info
  const userRes = await fetch(`${KNOX_API}/userinfo`, {
    headers: { 'Authorization': `Bearer ${tokens.access_token}` },
  });
  const user = await userRes.json();

  // Store tokens and user in session
  req.session.tokens = tokens;
  req.session.user = user;

  res.redirect('/dashboard');
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
```

### Python (Flask) Integration

```python
import secrets
import hashlib
import base64
import requests
from flask import Flask, redirect, request, session, url_for

app = Flask(__name__)
app.secret_key = secrets.token_hex(32)

CLIENT_ID = "knox_your_client_id"
CLIENT_SECRET = "knoxsec_your_client_secret"
REDIRECT_URI = "http://localhost:5000/auth/callback"
KNOX_API = "https://api.knox.chat/api/oauth2"


def generate_pkce():
    verifier = secrets.token_urlsafe(32)
    challenge = base64.urlsafe_b64encode(
        hashlib.sha256(verifier.encode()).digest()
    ).rstrip(b"=").decode()
    return verifier, challenge


@app.route("/auth/login")
def login():
    state = secrets.token_hex(16)
    verifier, challenge = generate_pkce()

    session["oauth_state"] = state
    session["pkce_verifier"] = verifier

    auth_url = (
        f"https://knox.chat/oauth2/authorize?"
        f"response_type=code"
        f"&client_id={CLIENT_ID}"
        f"&redirect_uri={REDIRECT_URI}"
        f"&scope=openid email profile"
        f"&state={state}"
        f"&code_challenge={challenge}"
        f"&code_challenge_method=S256"
    )
    return redirect(auth_url)


@app.route("/auth/callback")
def callback():
    error = request.args.get("error")
    if error:
        return f"Authorization error: {error}", 400

    code = request.args.get("code")
    state = request.args.get("state")

    if state != session.get("oauth_state"):
        return "State mismatch", 403

    # Exchange code for tokens
    token_res = requests.post(
        f"{KNOX_API}/token",
        json={
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": REDIRECT_URI,
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "code_verifier": session["pkce_verifier"],
        },
    )
    tokens = token_res.json()

    # Get user info
    user_res = requests.get(
        f"{KNOX_API}/userinfo",
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )
    user = user_res.json()

    session["user"] = user
    session["tokens"] = tokens

    return redirect("/dashboard")


if __name__ == "__main__":
    app.run(port=5000, debug=True)
```

### React SPA (Public Client)

```jsx
import { useState, useEffect } from 'react';

const CLIENT_ID = 'knox_your_public_client_id';
const REDIRECT_URI = 'http://localhost:3000/callback';
const KNOX_AUTH = 'https://knox.chat/oauth2/authorize';
const KNOX_API = 'https://api.knox.chat/api/oauth2';

// PKCE helpers
function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function generateCodeChallenge(verifier) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(verifier)
  );
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Login button component
function LoginButton() {
  const handleLogin = async () => {
    const state = crypto.randomUUID();
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);

    // Store for callback verification
    sessionStorage.setItem('oauth_state', state);
    sessionStorage.setItem('pkce_verifier', verifier);

    const url = new URL(KNOX_AUTH);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', CLIENT_ID);
    url.searchParams.set('redirect_uri', REDIRECT_URI);
    url.searchParams.set('scope', 'openid email');
    url.searchParams.set('state', state);
    url.searchParams.set('code_challenge', challenge);
    url.searchParams.set('code_challenge_method', 'S256');

    window.location.href = url.toString();
  };

  return <button onClick={handleLogin}>Sign in with Knox.chat</button>;
}

// Callback page component
function CallbackPage() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const err = params.get('error');

    if (err) { setError(err); return; }
    if (state !== sessionStorage.getItem('oauth_state')) {
      setError('State mismatch'); return;
    }

    // Exchange code for tokens (no client_secret for public clients)
    fetch(`${KNOX_API}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        code_verifier: sessionStorage.getItem('pkce_verifier'),
      }),
    })
      .then(r => r.json())
      .then(tokens => {
        // Store tokens IN MEMORY only — never localStorage!
        window.__tokens = tokens;

        return fetch(`${KNOX_API}/userinfo`, {
          headers: { 'Authorization': `Bearer ${tokens.access_token}` },
        });
      })
      .then(r => r.json())
      .then(setUser)
      .catch(e => setError(e.message));
  }, []);

  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>Loading...</div>;
  return <div>Welcome, {user.display_name}!</div>;
}
```

### cURL Examples

```bash
# 1. Discover endpoints
curl https://api.knox.chat/api/oauth2/.well-known/openid-configuration

# 2. Exchange authorization code for tokens
curl -X POST https://api.knox.chat/api/oauth2/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "authorization_code",
    "code": "YOUR_AUTH_CODE",
    "redirect_uri": "https://myapp.com/callback",
    "client_id": "knox_your_client_id",
    "client_secret": "knoxsec_your_secret"
  }'

# 3. Exchange code with PKCE (public client)
curl -X POST https://api.knox.chat/api/oauth2/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "authorization_code",
    "code": "YOUR_AUTH_CODE",
    "redirect_uri": "https://myapp.com/callback",
    "client_id": "knox_your_client_id",
    "code_verifier": "your_code_verifier"
  }'

# 4. Refresh tokens
curl -X POST https://api.knox.chat/api/oauth2/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "refresh_token",
    "refresh_token": "knoxrt_your_refresh_token",
    "client_id": "knox_your_client_id",
    "client_secret": "knoxsec_your_secret"
  }'

# 5. Get user info
curl https://api.knox.chat/api/oauth2/userinfo \
  -H "Authorization: Bearer knoxat_your_access_token"

# 6. Revoke a token
curl -X POST https://api.knox.chat/api/oauth2/revoke \
  -H "Content-Type: application/json" \
  -d '{"token": "knoxat_your_access_token"}'

# 7. Introspect a token
curl -X POST https://api.knox.chat/api/oauth2/introspect \
  -u "knox_your_client_id:knoxsec_your_secret" \
  -H "Content-Type: application/json" \
  -d '{"token": "knoxat_your_access_token"}'

# 8. List API tokens (via OAuth2)
curl https://api.knox.chat/api/oauth2/tokens \
  -H "Authorization: Bearer knoxat_your_access_token"

# 9. Create API token (via OAuth2)
curl -X POST https://api.knox.chat/api/oauth2/tokens \
  -H "Authorization: Bearer knoxat_your_access_token" \
  -H "Content-Type: application/json" \
  -d '{"name": "My Token", "expired_time": -1, "remain_quota": 100000, "unlimited_quota": false}'

# 10. Delete API token (via OAuth2)
curl -X DELETE https://api.knox.chat/api/oauth2/tokens/123 \
  -H "Authorization: Bearer knoxat_your_access_token"
```


## Configuration Reference

### Environment Variables

| Variable | Default | Description |
|:---------|:--------|:------------|
| `OAUTH2_ACCESS_TOKEN_TTL` | `3600` (1 hour) | Access token lifetime in seconds |
| `OAUTH2_REFRESH_TOKEN_TTL` | `2592000` (30 days) | Refresh token lifetime in seconds |
| `OAUTH2_CODE_TTL` | `600` (10 minutes) | Authorization code lifetime in seconds |

### Database Options (Hot-Reloadable)

These can be changed at runtime via the `options` database table:

| Key | Default | Description |
|:----|:--------|:------------|
| `OAuth2Enabled` | `true` | Enable/disable the entire OAuth2 system |
| `OAuth2RequireApproval` | `false` | When `true`, only admin-verified apps can request authorization |
| `OAuth2AccessTokenTTL` | `3600` | Access token lifetime (seconds) |
| `OAuth2RefreshTokenTTL` | `2592000` | Refresh token lifetime (seconds) |
| `OAuth2CodeTTL` | `600` | Authorization code lifetime (seconds) |
| `OAuth2AllowedScopes` | `openid email profile tokens:read tokens:write usage:read` | Global allowed scopes |


## Database Schema

### Tables

#### `oauth2_applications`

Stores registered OAuth2 client applications.

| Column | Type | Description |
|:-------|:-----|:------------|
| `id` | `SERIAL PRIMARY KEY` | Auto-incrementing ID |
| `name` | `VARCHAR(255)` | Application name |
| `description` | `TEXT` | Application description |
| `homepage_url` | `VARCHAR(500)` | Application homepage |
| `logo_url` | `VARCHAR(500)` | Application logo |
| `client_id` | `VARCHAR(255) UNIQUE` | OAuth2 client identifier |
| `client_secret` | `VARCHAR(255)` | bcrypt-hashed client secret |
| `redirect_uris` | `TEXT` | JSON array of registered redirect URIs |
| `allowed_scopes` | `VARCHAR(500)` | Space-separated allowed scopes |
| `app_type` | `VARCHAR(50)` | `"confidential"` or `"public"` |
| `user_id` | `INTEGER REFERENCES users(id)` | Owner user ID |
| `status` | `INTEGER DEFAULT 1` | 1=Active, 2=Suspended, 3=Deleted |
| `rate_limit` | `INTEGER DEFAULT 1000` | Requests per hour |
| `created_at` | `BIGINT` | Unix timestamp |
| `updated_at` | `BIGINT` | Unix timestamp |
| `is_verified` | `BOOLEAN DEFAULT FALSE` | Admin verification status |
| `verified_by` | `INTEGER` | Admin user who verified |
| `verified_at` | `BIGINT` | Verification timestamp |
| `webhook_url` | `VARCHAR(500)` | Webhook URL for events |

#### `oauth2_authorization_codes`

Temporary authorization codes (short-lived, single-use).

| Column | Type | Description |
|:-------|:-----|:------------|
| `id` | `SERIAL PRIMARY KEY` | Auto-incrementing ID |
| `code_hash` | `VARCHAR(255) UNIQUE` | SHA-256 hash of the code |
| `application_id` | `INTEGER REFERENCES oauth2_applications(id)` | Associated application |
| `user_id` | `INTEGER REFERENCES users(id)` | Authorizing user |
| `redirect_uri` | `TEXT` | Redirect URI used |
| `scope` | `VARCHAR(500)` | Granted scopes |
| `state` | `VARCHAR(500)` | State parameter |
| `code_challenge` | `VARCHAR(500)` | PKCE code challenge |
| `code_challenge_method` | `VARCHAR(10)` | PKCE method (`S256` or `plain`) |
| `expires_at` | `BIGINT` | Expiration timestamp |
| `used` | `BOOLEAN DEFAULT FALSE` | Whether code has been consumed |
| `created_at` | `BIGINT` | Creation timestamp |

#### `oauth2_access_tokens`

Active access tokens.

| Column | Type | Description |
|:-------|:-----|:------------|
| `id` | `SERIAL PRIMARY KEY` | Auto-incrementing ID |
| `token_hash` | `VARCHAR(255) UNIQUE` | SHA-256 hash of the token |
| `application_id` | `INTEGER REFERENCES oauth2_applications(id)` | Associated application |
| `user_id` | `INTEGER REFERENCES users(id)` | Token owner |
| `scope` | `VARCHAR(500)` | Granted scopes |
| `expires_at` | `BIGINT` | Expiration timestamp |
| `created_at` | `BIGINT` | Creation timestamp |
| `last_used_at` | `BIGINT` | Last usage timestamp |

#### `oauth2_refresh_tokens`

Refresh tokens with revocation support.

| Column | Type | Description |
|:-------|:-----|:------------|
| `id` | `SERIAL PRIMARY KEY` | Auto-incrementing ID |
| `token_hash` | `VARCHAR(255) UNIQUE` | SHA-256 hash of the token |
| `access_token_id` | `INTEGER` | Associated access token |
| `application_id` | `INTEGER REFERENCES oauth2_applications(id)` | Associated application |
| `user_id` | `INTEGER REFERENCES users(id)` | Token owner |
| `scope` | `VARCHAR(500)` | Granted scopes |
| `expires_at` | `BIGINT` | Expiration timestamp |
| `revoked` | `BOOLEAN DEFAULT FALSE` | Whether token is revoked |
| `created_at` | `BIGINT` | Creation timestamp |

#### `oauth2_user_consents`

Records user consent decisions (unique per user + application pair).

| Column | Type | Description |
|:-------|:-----|:------------|
| `id` | `SERIAL PRIMARY KEY` | Auto-incrementing ID |
| `user_id` | `INTEGER REFERENCES users(id)` | User who consented |
| `application_id` | `INTEGER REFERENCES oauth2_applications(id)` | Application granted access |
| `scopes` | `VARCHAR(500)` | Consented scopes |
| `created_at` | `BIGINT` | Initial consent timestamp |
| `updated_at` | `BIGINT` | Last updated (scope expansion) |

> **Unique constraint**: `(user_id, application_id)` — one consent record per user-app pair.

#### `oauth2_audit_log`

Comprehensive audit trail of all OAuth2 events.

| Column | Type | Description |
|:-------|:-----|:------------|
| `id` | `SERIAL PRIMARY KEY` | Auto-incrementing ID |
| `event_type` | `VARCHAR(100)` | Event type identifier |
| `application_id` | `INTEGER` | Related application (nullable) |
| `user_id` | `INTEGER` | Related user (nullable) |
| `ip_address` | `VARCHAR(100)` | Client IP address |
| `user_agent` | `TEXT` | Client user agent |
| `metadata` | `JSONB` | Additional event data |
| `created_at` | `BIGINT` | Event timestamp |

### Audit Event Types

| Event Type | Description | Metadata |
|:-----------|:------------|:---------|
| `authorization_granted` | User approved an app | Scopes, redirect URI |
| `authorization_denied` | User denied an app | Redirect URI |
| `token_issued` | Tokens issued via code exchange | Grant type, scopes |
| `token_refreshed` | Tokens refreshed | Scopes |
| `token_revoked` | Token revoked | Token type |
| `consent_revoked` | User revoked app access | Application ID |
| `app_created` | New application registered | App name |
| `app_updated` | Application details changed | Changed fields |
| `app_deleted` | Application soft-deleted | App name |
| `secret_rotated` | Client secret rotated | — |
| `app_verified` | Admin verified an app | Admin user ID |
| `app_suspended` | Admin suspended an app | Admin user ID |
| `app_activated` | Admin activated an app | Admin user ID |


## Admin Guide

### Dashboard Locations

| Page | Path | Access |
|:-----|:-----|:-------|
| My Applications | Settings → OAuth2 Apps → My Applications | All users |
| Authorized Apps | Settings → OAuth2 Apps → Authorized Apps | All users |
| Integration Guide | Settings → OAuth2 Apps → Integration Guide | All users |
| Admin Panel | `/oauth2-admin` | Admin only |

### Application Status Lifecycle

```
                  ┌──────────┐
    Created ────> │  Active  │ (status=1)
                  │  (1)     │
                  └────┬─────┘
                       │
              ┌────────┼────────┐
              │        │        │
              v        │        v
        ┌──────────┐   │  ┌──────────┐
        │Suspended │   │  │ Deleted  │ (status=3)
        │  (2)     │   │  │  (soft)  │
        └────┬─────┘   │  └──────────┘
             │         │   All tokens revoked
             └─────────┘   All consents deleted
           Reactivate
```

### Admin Actions

- **Verify**: Adds a verification badge to the app on the consent screen. Increases user trust.
- **Suspend**: Immediately invalidates all existing tokens. The app cannot issue new tokens or request authorization.
- **Activate**: Restores a suspended app to active status. Users will need to re-authorize.
- **Audit Logs**: View all OAuth2 events with filtering by event type. Export to CSV for compliance.

### Security Monitoring

Monitor the audit log for suspicious patterns:

- Excessive `token_issued` events from a single app (possible abuse)
- `authorization_denied` spikes (possible phishing)
- `token_revoked` in bulk (compromised app)
- `secret_rotated` without matching `app_updated` (unauthorized rotation)


## FAQ

### For Users

**Q: How do I see which apps have access to my account?**  
A: Go to **Settings → OAuth2 Apps → Authorized Apps**. You'll see all apps you've authorized, their permissions, and the date you granted access.

**Q: How do I revoke an app's access?**  
A: In **Authorized Apps**, click the **Revoke** button next to the app. This immediately invalidates all tokens and removes the app's access.

**Q: What does "unverified" mean on the consent screen?**  
A: Unverified apps have not been reviewed by Knox.chat administrators. Exercise caution when authorizing unverified apps and only grant the minimum necessary permissions.

**Q: Can I change which permissions an app has?**  
A: Revoke the app's access, then re-authorize it. The app will ask for permissions again, and you can review them at that time.

### For Developers

**Q: How do I register an OAuth2 application?**  
A: Go to **Settings → OAuth2 Apps → My Applications** and click "Create Application". Fill in the required fields and save your client secret.

**Q: I lost my client secret. What do I do?**  
A: Use the **Rotate Secret** action on your application. This generates a new secret and invalidates the old one. Update your application configuration immediately.

**Q: Should I use a confidential or public client?**  
A: Use **confidential** if your app runs on a server where the secret can be kept safe. Use **public** for SPAs, mobile apps, or any client where the source code is visible. Public clients **must** use PKCE.

**Q: How long do tokens last?**  
A: Access tokens expire after **1 hour**, refresh tokens after **30 days**. Use the refresh token to get new access tokens without user re-authorization.

**Q: What happens when I refresh a token?**  
A: You receive a new access token AND a new refresh token. The old refresh token is immediately revoked (token rotation). Always store the new refresh token.

**Q: My app needs to work when the user is offline. How?**  
A: Use refresh tokens. As long as the refresh token is valid (30 days) and the user hasn't revoked access, you can obtain new access tokens without user interaction.

**Q: What redirect URIs are allowed?**  
A: HTTPS URIs are required for production. HTTP is allowed for `localhost` during development. Custom URI schemes (e.g., `myapp://callback`) are allowed for mobile apps.

**Q: How do webhooks work?**  
A: Register a `webhook_url` when creating your app. Knox.chat will POST `consent_granted` and `consent_revoked` events to this URL. Webhooks are fire-and-forget with a 10-second timeout.

**Q: Is there an OpenID Connect discovery endpoint?**  
A: Yes. `GET /api/oauth2/.well-known/openid-configuration` returns the full OIDC discovery document.

**Q: What's the rate limit for the token endpoint?**  
A: 60 requests/minute per IP. The userinfo endpoint allows 300 requests/minute. See the [Rate Limits](#rate-limits) section for full details.


## Supported Standards

| Standard | Status | Notes |
|:---------|:------:|:------|
| [RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749) — OAuth 2.0 Framework | ✅ | Authorization Code + Refresh Token grants |
| [RFC 7636](https://datatracker.ietf.org/doc/html/rfc7636) — PKCE | ✅ | S256 and plain methods; mandatory for public clients |
| [RFC 7009](https://datatracker.ietf.org/doc/html/rfc7009) — Token Revocation | ✅ | Always returns 200 per spec |
| [RFC 7662](https://datatracker.ietf.org/doc/html/rfc7662) — Token Introspection | ✅ | Requires client authentication |
| [OpenID Connect Discovery](https://openid.net/specs/openid-connect-discovery-1_0.html) | ⚠️ Partial | Discovery document + userinfo; no ID tokens |
