---
sidebar_position: 18
title: Knox OAuth2 — 开发者与用户文档
sidebar_label: Knox OAuth2 — 开发者与用户文档
description: Knox.chat OAuth2 实现的完整指南，面向开发者和用户。
keywords: [knox, knox api, ai integration, knox-ms, oauth2, authentication, authorization, developer guide]
---

# Knox.chat OAuth2 — 开发者与用户文档

> **版本**：1.0  
> **最后更新**：2026 年 2 月  
> **标准规范**：[RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749) · [RFC 7636 (PKCE)](https://datatracker.ietf.org/doc/html/rfc7636) · [RFC 7009 (Revocation)](https://datatracker.ietf.org/doc/html/rfc7009) · [RFC 7662 (Introspection)](https://datatracker.ietf.org/doc/html/rfc7662)

## 目录

- [概述](#overview)
- [核心概念](#key-concepts)
- [快速开始](#quick-start)
- [OAuth2 流程](#oauth2-flows)
  - [授权码模式](#authorization-code-grant)
  - [授权码 + PKCE](#authorization-code--pkce)
  - [刷新令牌流程](#refresh-token-flow)
- [权限范围](#scopes--permissions)
- [API 参考](#api-reference)
  - [发现端点](#1-openid-discovery)
  - [授权端点](#2-authorization-endpoint)
  - [令牌端点](#3-token-endpoint)
  - [令牌撤销](#4-token-revocation)
  - [令牌内省](#5-token-introspection)
  - [用户信息端点](#6-userinfo-endpoint)
  - [API 令牌管理](#7-api-token-management)
  - [应用管理](#8-application-management)
  - [用户授权管理](#9-user-consent-management)
  - [管理员端点](#10-admin-endpoints)
- [令牌参考](#token-reference)
- [Webhooks](#webhooks)
- [速率限制](#rate-limits)
- [错误处理](#error-handling)
- [安全最佳实践](#security-best-practices)
- [代码示例](#code-examples)
  - [完整授权流程 (JavaScript)](#full-authorization-flow-javascript)
  - [PKCE 辅助函数](#pkce-helper-functions)
  - [Node.js (Express) 集成](#nodejs-express-integration)
  - [Python (Flask) 集成](#python-flask-integration)
  - [React SPA（公开客户端）](#react-spa-public-client)
  - [cURL 示例](#curl-examples)
- [配置参考](#configuration-reference)
- [数据库结构](#database-schema)
- [管理员指南](#admin-guide)
- [常见问题](#faq)

## Overview

Knox.chat 提供了**完整的 OAuth 2.0 授权服务器**，使第三方应用能够安全地认证 Knox.chat 用户——类似于"使用 GitHub 登录"或"使用 Google 登录"。

### 你可以做什么

- **用户认证** — 让用户使用 Knox.chat 账户登录你的应用
- **访问用户数据** — 在用户授权下读取个人资料、邮箱和使用统计
- **管理 API 令牌** — 代表用户创建和管理 API 令牌
- **构建集成** — 创建与 Knox.chat 交互的机器人、仪表板或工具

### 支持的授权类型

| 授权类型 | 是否支持 | 使用场景 |
|:-----------|:---------:|:---------|
| Authorization Code | ✅ | 服务端 Web 应用 |
| Authorization Code + PKCE | ✅ | 单页应用、移动应用、CLI 工具 |
| Refresh Token | ✅ | 长期会话（支持令牌轮换） |
| Client Credentials | ❌ | — |
| Implicit | ❌ | —（已被 OAuth 2.1 废弃） |

## Key Concepts

| 术语 | 描述 |
|:-----|:------------|
| **应用（客户端）** | 在 Knox.chat 注册的第三方应用，需要访问用户数据 |
| **Client ID** | 应用的公开标识符（格式：`knox_<32chars>`） |
| **Client Secret** | 服务端应用使用的机密密钥（格式：`knoxsec_<48chars>`） |
| **授权码** | 用户授权后用于交换令牌的临时凭证 |
| **Access Token** | 用于访问受保护资源的短期令牌（格式：`knoxat_<48chars>`） |
| **Refresh Token** | 用于获取新访问令牌的长期令牌（格式：`knoxrt_<48chars>`） |
| **Scope** | 应用请求的特定权限 |
| **用户授权** | 用户对应用请求权限的明确批准 |
| **PKCE** | Proof Key for Code Exchange — 为公开客户端提供的额外安全层 |
| **机密客户端** | 能够安全存储客户端密钥的应用（如服务端应用） |
| **公开客户端** | 无法安全存储密钥的应用（如单页应用、移动应用）。**PKCE 为必选项。** |

## Quick Start

### 1. 注册应用

在 Knox.chat 仪表板中导航到 **Settings → OAuth2 Apps → My Applications**，或使用 API：

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

> ⚠️ **请立即保存你的 Client Secret！** 它仅在创建时显示一次，之后无法找回。如果丢失，必须进行密钥轮换。

### 2. 引导用户授权

```
https://knox.chat/oauth2/authorize?
  response_type=code
  &client_id=knox_your_client_id
  &redirect_uri=https://myapp.com/callback
  &scope=openid email profile
  &state=random_csrf_token
```

### 3. 用授权码换取令牌

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

### 4. 访问用户数据

```bash
curl https://api.knox.chat/api/oauth2/userinfo \
  -H "Authorization: Bearer knoxat_your_access_token"
```

## OAuth2 Flows

### Authorization Code Grant

适用于**机密（服务端）客户端**的标准流程。

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

适用于无法安全存储客户端密钥的**公开客户端**（单页应用、移动应用、CLI 工具）。PKCE 对公开客户端**强制要求**，建议所有客户端都使用。

**额外步骤：**

1. 生成随机的 `code_verifier`（43-128 个字符）
2. 计算 `code_challenge = BASE64URL(SHA256(code_verifier))`
3. 在授权请求中包含 `code_challenge` 和 `code_challenge_method=S256`
4. 在令牌交换请求中包含 `code_verifier`

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

访问令牌默认在 **1 小时**后过期。使用刷新令牌可以在无需用户交互的情况下获取新令牌。

> ⚠️ **令牌轮换**：每次刷新请求都会签发新的刷新令牌并**撤销旧令牌**。务必保存响应中返回的新刷新令牌。

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

**响应：**
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

Scope 定义了应用可以访问的数据和操作。用户将在授权同意页面上看到每个 scope 的描述。

| Scope | 描述 | 可访问的数据 |
|:------|:------------|:----------------|
| `openid` | **读取基本账户信息** — 用户名、显示名称和头像 | `sub`、`username`、`display_name`、`avatar_url`、`role` |
| `email` | **读取邮箱地址** | `email`、`email_verified` |
| `profile` | **读取和更新个人资料** | 完整个人资料，包括 `group`、`created_at` |
| `tokens:read` | **列出 API 令牌** | 令牌名称、创建日期、状态 |
| `tokens:write` | **创建和管理 API 令牌** | 创建新令牌、删除现有令牌 |
| `usage:read` | **读取 API 使用统计和配额** | `quota`、`used_quota`、`request_count` |

### Scope 规则

- **`openid` 始终包含** — 即使未显式请求，`openid` scope 也会自动添加为最低权限。
- **请求最小权限** — 仅请求应用实际需要的 scope。
- **Scope 验证** — 请求的 scope 必须是应用注册的 `allowed_scopes` 的子集。
- **重新授权** — 如果应用请求了之前未授权的新 scope，用户将再次看到授权同意页面。

## API Reference

### 基础 URL

| 服务 | URL |
|:--------|:----|
| 授权页面（浏览器） | `https://knox.chat/oauth2/authorize` |
| API 端点 | `https://api.knox.chat/api/oauth2/` |


### 1. OpenID Discovery

返回 OpenID Connect 发现文档，包含所有端点 URL 和支持的功能。

```
GET /api/oauth2/.well-known/openid-configuration
```

**认证方式**：无需认证

**响应** `200 OK`：
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

#### GET — 获取授权信息

返回应用信息和授权状态，用于展示授权同意页面。

```
GET /api/oauth2/authorize
```

**认证方式**：Session cookie（用户必须已登录）

**查询参数**：

| 参数 | 必填 | 描述 |
|:----------|:--------:|:------------|
| `response_type` | ✅ | 必须为 `code` |
| `client_id` | ✅ | 应用的 Client ID |
| `redirect_uri` | ✅ | 必须与注册的重定向 URI 匹配 |
| `scope` | ❌ | 空格分隔的 scope（默认为 `openid`） |
| `state` | ❌ | 不透明的 CSRF 保护值（强烈建议使用） |
| `code_challenge` | ❌ | PKCE code challenge（公开客户端**必填**） |
| `code_challenge_method` | ❌ | `S256`（推荐）或 `plain` |

**响应** `200 OK`：
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

**错误响应**：

| 状态码 | 条件 |
|:-------|:----------|
| `400` | 无效的 `response_type`、缺少 `client_id`、无效的 `redirect_uri`、无效的 scope |
| `401` | 用户未登录 |
| `403` | OAuth2 已禁用、应用被暂停、未验证的应用（需要审批时） |
| `404` | 未知的 `client_id` |

#### POST — 提交授权决定

处理用户的批准/拒绝决定并返回重定向 URL。

```
POST /api/oauth2/authorize
```

**认证方式**：Session cookie

**请求体**（`application/json`）：

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

| 字段 | 类型 | 必填 | 描述 |
|:------|:-----|:--------:|:------------|
| `client_id` | string | ✅ | 应用的 Client ID |
| `redirect_uri` | string | ✅ | 必须与 GET 请求一致 |
| `scope` | string | ❌ | 空格分隔的 scope |
| `state` | string | ❌ | 不透明的 state 值 |
| `approved` | boolean | ✅ | `true` 批准，`false` 拒绝 |
| `code_challenge` | string | ❌ | PKCE code challenge |
| `code_challenge_method` | string | ❌ | `S256` 或 `plain` |

**批准时的响应** `200 OK`：
```json
{
  "success": true,
  "data": {
    "redirect_url": "https://myapp.com/callback?code=AUTH_CODE_HERE&state=random_state_value"
  }
}
```

**拒绝时的响应** `200 OK`：
```json
{
  "success": true,
  "data": {
    "redirect_url": "https://myapp.com/callback?error=access_denied&error_description=User+denied+authorization&state=random_state_value"
  }
}
```

### 3. Token Endpoint

用授权码交换令牌，或刷新现有令牌对。

```
POST /api/oauth2/token
```

**认证方式**：通过以下方式之一提供客户端凭据：
- **Basic Auth**：`Authorization: Basic base64(client_id:client_secret)`
- **请求体参数**：在请求体中包含 `client_id` 和 `client_secret`

**Content Types**：`application/json` 或 `application/x-www-form-urlencoded`

**速率限制**：每个 IP 每分钟 60 次请求

#### Grant Type：`authorization_code`

**请求**：
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

| 字段 | 类型 | 必填 | 描述 |
|:------|:-----|:--------:|:------------|
| `grant_type` | string | ✅ | 必须为 `authorization_code` |
| `code` | string | ✅ | 收到的授权码 |
| `redirect_uri` | string | ✅ | 必须与原始授权请求一致 |
| `client_id` | string | ✅ | 应用的 Client ID |
| `client_secret` | string | ❌* | 机密客户端必填 |
| `code_verifier` | string | ❌* | 如果授权时发送了 `code_challenge` 则必填 |

#### Grant Type：`refresh_token`

**请求**：
```json
{
  "grant_type": "refresh_token",
  "refresh_token": "knoxrt_your_refresh_token",
  "client_id": "knox_abc123...",
  "client_secret": "knoxsec_xyz789..."
}
```

| 字段 | 类型 | 必填 | 描述 |
|:------|:-----|:--------:|:------------|
| `grant_type` | string | ✅ | 必须为 `refresh_token` |
| `refresh_token` | string | ✅ | 刷新令牌 |
| `client_id` | string | ✅ | 应用的 Client ID |
| `client_secret` | string | ❌* | 机密客户端必填 |

**成功响应** `200 OK`：
```json
{
  "access_token": "knoxat_new_access_token...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "knoxrt_new_refresh_token...",
  "scope": "openid email profile"
}
```

> **响应头**：令牌响应始终设置 `Cache-Control: no-store`。

**错误响应** `400 Bad Request`：
```json
{
  "success": false,
  "message": "Invalid authorization code",
  "error": "invalid_grant",
  "error_description": "The authorization code is invalid, expired, or has already been used"
}
```

| 错误码 | 描述 |
|:-----------|:------------|
| `invalid_request` | 缺少或无效的参数 |
| `invalid_client` | 客户端认证失败 |
| `invalid_grant` | 授权码已过期、已使用或 PKCE 验证失败 |
| `unsupported_grant_type` | 不支持的授权类型 |
| `invalid_scope` | 请求的 scope 无效 |

### 4. Token Revocation

撤销访问令牌或刷新令牌（RFC 7009）。

```
POST /api/oauth2/revoke
```

**认证方式**：可选的客户端凭据（Basic auth 或请求体参数）

**速率限制**：每个 IP 每分钟 60 次请求

**请求**：
```json
{
  "token": "knoxat_or_knoxrt_token_here",
  "token_type_hint": "access_token"
}
```

| 字段 | 类型 | 必填 | 描述 |
|:------|:-----|:--------:|:------------|
| `token` | string | ✅ | 要撤销的令牌 |
| `token_type_hint` | string | ❌ | `access_token` 或 `refresh_token`（优化提示） |

**响应**：按 RFC 7009 规范始终返回 `200 OK`——即使令牌无效或已被撤销。

```json
{
  "success": true,
  "message": "Token revoked successfully"
}
```

### 5. Token Introspection

检查令牌是否有效并获取其元数据（RFC 7662）。

```
POST /api/oauth2/introspect
```

**认证方式**：**必需** — 使用客户端凭据的 Basic auth（`Authorization: Basic base64(client_id:client_secret)`）

**速率限制**：每个 IP 每分钟 120 次请求

**请求**：
```json
{
  "token": "knoxat_token_to_inspect",
  "token_type_hint": "access_token"
}
```

**响应 — 有效令牌** `200 OK`：
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

**响应 — 无效令牌** `200 OK`：
```json
{
  "active": false
}
```

### 6. UserInfo Endpoint

根据已授权的 scope 获取认证用户的信息。

```
GET /api/oauth2/userinfo
```

**认证方式**：`Authorization: Bearer <access_token>`

**速率限制**：每个 IP 每分钟 300 次请求

**响应** `200 OK`（字段因授权 scope 而异）：

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

**按 Scope 返回的字段**：

| 字段 | 所需 Scope |
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

通过 OAuth2 Bearer 认证代表用户管理 Knox.chat API 令牌。

#### 列出 API 令牌

```
GET /api/oauth2/tokens
```

**认证方式**：Bearer token，需要 `tokens:read` scope

**响应** `200 OK`：
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

#### 创建 API 令牌

```
POST /api/oauth2/tokens
```

**认证方式**：Bearer token，需要 `tokens:write` scope

**请求**：
```json
{
  "name": "My New Token",
  "expired_time": -1,
  "remain_quota": 100000,
  "unlimited_quota": false
}
```

**响应** `200 OK`：
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

> ⚠️ 完整的 API 令牌密钥仅在创建时返回一次。

#### 删除 API 令牌

```
DELETE /api/oauth2/tokens/{token_id}
```

**认证方式**：Bearer token，需要 `tokens:write` scope

**响应** `200 OK`：
```json
{
  "success": true,
  "message": "Token deleted successfully"
}
```

### 8. Application Management

管理你注册的 OAuth2 应用。这些端点需要基于 session 的认证（已登录用户）。

#### 列出你的应用

```
GET /api/oauth2/applications
```

**认证方式**：Session cookie

**响应** `200 OK`：
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

#### 创建应用

```
POST /api/oauth2/applications
```

**认证方式**：Session cookie

**请求**（`application/json`）：

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

**验证规则**：

| 字段 | 规则 |
|:------|:-----|
| `name` | 1-64 个字符 |
| `description` | 0-500 个字符 |
| `homepage_url` | 有效的 URL |
| `logo_url` | 有效的 URL |
| `redirect_uris` | 1-10 个有效 URI（需要 HTTPS；`localhost` 允许 HTTP；移动应用允许自定义 scheme） |
| `scopes` | 空格分隔的有效 scope（1-256 个字符） |
| `app_type` | `"confidential"` 或 `"public"` |
| `webhook_url` | 有效的 URL（可选） |

**响应** `200 OK`：
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

> ⚠️ **`client_secret_plain` 仅返回一次！** 请立即安全保存。

#### 更新应用

```
PUT /api/oauth2/applications/{app_id}
```

**认证方式**：Session cookie（必须是应用所有者）

**请求**：与创建相同的字段，除 URL 中的 `app_id` 外均为可选。

#### 删除应用

```
DELETE /api/oauth2/applications/{app_id}
```

**认证方式**：Session cookie（必须是应用所有者）

> 此操作执行**软删除**（将状态设为 3）并**撤销所有令牌和授权**。

#### 轮换 Client Secret

```
POST /api/oauth2/applications/{app_id}/rotate-secret
```

**认证方式**：Session cookie（必须是应用所有者）

**响应** `200 OK`：
```json
{
  "success": true,
  "data": {
    "client_secret_plain": "knoxsec_new_secret..."
  }
}
```

> ⚠️ 旧密钥将立即失效。请在轮换前更新你的应用配置。

### 9. User Consent Management

用户可以查看和撤销已授权的应用。

#### 列出已授权的应用

```
GET /api/oauth2/consents
```

**认证方式**：Session cookie

**响应** `200 OK`：
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

#### 撤销应用访问

```
DELETE /api/oauth2/consents/{application_id}
```

**认证方式**：Session cookie

> 撤销授权将**删除所有令牌**（访问令牌和刷新令牌）并**移除授权记录**。应用需要重新请求授权。

### 10. Admin Endpoints

用于管理所有 OAuth2 应用和查看审计日志的管理端点。需要**管理员级别的 session 认证**。

#### 列出所有应用（管理员）

```
GET /api/oauth2/admin/applications?page=1&page_size=20
```

**响应**包含通过 JOIN 解析的 `owner_username`。

#### 验证应用

```
POST /api/oauth2/admin/applications/verify
```

**请求**：`{ "app_id": 1 }`

> 验证后的应用会在授权同意页面显示验证徽章，提升用户信任度。

#### 暂停应用

```
POST /api/oauth2/admin/applications/suspend
```

**请求**：`{ "app_id": 1 }`

> 被暂停的应用无法签发新令牌，现有令牌在验证时会被拒绝。

#### 激活应用

```
POST /api/oauth2/admin/applications/activate
```

**请求**：`{ "app_id": 1 }`

> 重新激活之前被暂停的应用。

#### 查看审计日志

```
GET /api/oauth2/admin/audit?page=1&page_size=20&event_type=token_issued
```

| 参数 | 描述 |
|:----------|:------------|
| `page` | 页码 |
| `page_size` | 每页条数 |
| `event_type` | 按事件类型筛选（可选） |
| `format` | 设为 `csv` 可导出 CSV |

#### 导出审计日志 (CSV)

```
GET /api/oauth2/admin/audit?format=csv
```

返回最多 10,000 条记录的 CSV 文件。

## Token Reference

| 令牌类型 | 格式 | 有效期 | 存储方式 |
|:-----------|:-------|:---------|:---------------|
| Client ID | `knox_<32 chars>` | 永久 | 数据库明文存储 |
| Client Secret | `knoxsec_<48 chars>` | 至轮换 | 数据库 bcrypt 哈希存储 |
| Authorization Code | 40 位随机字符 | **10 分钟** | 数据库 SHA-256 哈希存储，一次性使用 |
| Access Token | `knoxat_<48 chars>` | **1 小时** | 数据库 SHA-256 哈希存储 |
| Refresh Token | `knoxrt_<48 chars>` | **30 天** | 数据库 SHA-256 哈希存储 |
| API Token（通过 `tokens:write`） | `sk-<48 chars>` | 可配置 | 数据库明文存储 |

### 令牌安全

- **所有令牌均以 SHA-256 哈希形式存储**在数据库中——从不以明文存储。
- **Client Secret 以 bcrypt 哈希形式存储**。
- **授权码为一次性使用**——在数据库层面通过原子操作强制执行。
- **刷新令牌轮换**——每次刷新都会使旧的刷新令牌及其关联的访问令牌失效。
- **应用状态验证**——每次使用令牌时都会检查应用状态；被暂停应用的令牌将被拒绝。
- **用户状态验证**——被禁用的用户无法刷新令牌。

## Webhooks

如果你的应用注册了 `webhook_url`，Knox.chat 将在关键事件发生时发送 HTTP POST 通知。

### Webhook 格式

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

### 支持的事件

| 事件 | 触发条件 |
|:------|:--------|
| `consent_granted` | 用户批准你的应用授权 |
| `consent_revoked` | 用户从设置中撤销你的应用访问 |

### Webhook 行为

- **即发即忘** — Knox.chat 不会重试失败的 webhook 投递。
- **10 秒超时** — Webhook 请求在 10 秒后超时。
- **异步投递** — Webhook 以异步方式发送，不会阻塞 OAuth2 流程。

## Rate Limits

| 端点 | 限制 | 维度 |
|:---------|:------|:----|
| `POST /oauth2/token` | 每分钟 60 次 | 按 IP |
| `POST /oauth2/revoke` | 每分钟 60 次 | 按 IP |
| `POST /oauth2/introspect` | 每分钟 120 次 | 按 IP |
| `GET /oauth2/userinfo` | 每分钟 300 次 | 按 IP |
| `GET /oauth2/authorize` | 每分钟 30 次 | 按用户 |
| `POST /oauth2/authorize` | 每分钟 30 次 | 按用户 |

触发速率限制时，API 返回 `429 Too Many Requests`。

## Error Handling

### 标准 OAuth2 错误响应

令牌端点错误遵循 [RFC 6749 §5.2](https://datatracker.ietf.org/doc/html/rfc6749#section-5.2)：

```json
{
  "success": false,
  "message": "Human-readable error message",
  "error": "error_code",
  "error_description": "Detailed description of the error"
}
```

### OAuth2 错误码

| 错误码 | HTTP 状态码 | 描述 |
|:-----------|:------------|:------------|
| `invalid_request` | 400 | 缺少或无效的必填参数 |
| `invalid_client` | 401 | 客户端认证失败（密钥错误、未知客户端） |
| `invalid_grant` | 400 | 授权码已过期、已使用、redirect_uri 不匹配或 PKCE 验证失败 |
| `unsupported_grant_type` | 400 | 不支持的授权类型（仅支持 `authorization_code` 和 `refresh_token`） |
| `invalid_scope` | 400 | 请求的 scope 无效或超出应用允许范围 |
| `access_denied` | 403 | 用户拒绝授权、应用被暂停或 OAuth2 已禁用 |

### 授权重定向错误

授权流程中发生错误时，用户将被重定向回你的 `redirect_uri`，并附带错误参数：

```
https://myapp.com/callback?error=access_denied&error_description=User+denied+authorization&state=your_state
```

### HTTP 错误码

| 状态码 | 含义 |
|:-------|:--------|
| `200` | 成功 |
| `400` | 请求错误 — 无效的参数 |
| `401` | 未授权 — 缺少或无效的认证 |
| `403` | 禁止访问 — 权限不足、应用被暂停或 OAuth2 已禁用 |
| `404` | 未找到 — 未知的资源 |
| `429` | 请求过多 — 超出速率限制 |
| `500` | 服务器内部错误 |


## Security Best Practices

### 所有客户端通用

1. **始终使用 `state` 参数** — 生成随机的、不可猜测的值，并在回调中验证，以防止 CSRF 攻击。
2. **使用 PKCE** — 即使是机密客户端，PKCE 也能提供额外的安全保护，防止授权码被截获。
3. **请求最小权限** — 仅请求应用实际需要的权限。
4. **重定向 URI 使用 HTTPS** — HTTP 仅在开发阶段的 `localhost` 允许使用。
5. **在服务端验证令牌** — 永远不要仅依赖客户端令牌验证。

### 机密客户端（服务端）

6. **不要暴露 Client Secret** — 仅保留在服务端；不要包含在前端代码、URL 或日志中。
7. **定期轮换密钥** — 使用密钥轮换端点更新凭据。
8. **加密存储令牌** — 在数据库中对访问令牌和刷新令牌进行静态加密。
9. **令牌端点使用 Basic Auth** — 优先使用 `Authorization: Basic` 而非请求体参数。

### 公开客户端（SPA、移动应用）

10. **PKCE 为必选项** — 服务端强制公开客户端使用 PKCE。
11. **仅在内存中存储令牌** — 对于 SPA，不要使用 `localStorage` 或 `sessionStorage` 存储令牌。
12. **使用平台安全存储** — 移动应用使用 iOS Keychain 或 Android Keystore。

### 令牌存储建议

| 平台 | 推荐存储方式 |
|:---------|:-------------------|
| 服务端 | 加密的数据库字段 |
| SPA（浏览器） | 仅内存（JavaScript 变量） |
| 移动端 (iOS) | Keychain Services |
| 移动端 (Android) | EncryptedSharedPreferences / Keystore |
| 桌面端 | 操作系统凭据存储（Keychain、Credential Manager、libsecret） |

### Webhook 安全

- 验证 `X-Knox-Timestamp` 请求头以防止重放攻击。
- 如果处理敏感的 webhook 数据，建议实现 HMAC 签名验证。


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

### 环境变量

| 变量 | 默认值 | 描述 |
|:---------|:--------|:------------|
| `OAUTH2_ACCESS_TOKEN_TTL` | `3600`（1 小时） | 访问令牌有效期（秒） |
| `OAUTH2_REFRESH_TOKEN_TTL` | `2592000`（30 天） | 刷新令牌有效期（秒） |
| `OAUTH2_CODE_TTL` | `600`（10 分钟） | 授权码有效期（秒） |

### 数据库选项（支持热重载）

这些选项可以通过 `options` 数据库表在运行时更改：

| 键 | 默认值 | 描述 |
|:----|:--------|:------------|
| `OAuth2Enabled` | `true` | 启用/禁用整个 OAuth2 系统 |
| `OAuth2RequireApproval` | `false` | 设为 `true` 时，仅管理员验证过的应用可以请求授权 |
| `OAuth2AccessTokenTTL` | `3600` | 访问令牌有效期（秒） |
| `OAuth2RefreshTokenTTL` | `2592000` | 刷新令牌有效期（秒） |
| `OAuth2CodeTTL` | `600` | 授权码有效期（秒） |
| `OAuth2AllowedScopes` | `openid email profile tokens:read tokens:write usage:read` | 全局允许的 scope |


## Database Schema

### 数据表

#### `oauth2_applications`

存储已注册的 OAuth2 客户端应用。

| 列名 | 类型 | 描述 |
|:-------|:-----|:------------|
| `id` | `SERIAL PRIMARY KEY` | 自增 ID |
| `name` | `VARCHAR(255)` | 应用名称 |
| `description` | `TEXT` | 应用描述 |
| `homepage_url` | `VARCHAR(500)` | 应用主页 |
| `logo_url` | `VARCHAR(500)` | 应用 Logo |
| `client_id` | `VARCHAR(255) UNIQUE` | OAuth2 Client ID |
| `client_secret` | `VARCHAR(255)` | bcrypt 哈希的 Client Secret |
| `redirect_uris` | `TEXT` | JSON 数组形式的注册重定向 URI |
| `allowed_scopes` | `VARCHAR(500)` | 空格分隔的允许 scope |
| `app_type` | `VARCHAR(50)` | `"confidential"` 或 `"public"` |
| `user_id` | `INTEGER REFERENCES users(id)` | 所有者用户 ID |
| `status` | `INTEGER DEFAULT 1` | 1=活跃, 2=暂停, 3=已删除 |
| `rate_limit` | `INTEGER DEFAULT 1000` | 每小时请求数 |
| `created_at` | `BIGINT` | Unix 时间戳 |
| `updated_at` | `BIGINT` | Unix 时间戳 |
| `is_verified` | `BOOLEAN DEFAULT FALSE` | 管理员验证状态 |
| `verified_by` | `INTEGER` | 验证的管理员用户 |
| `verified_at` | `BIGINT` | 验证时间戳 |
| `webhook_url` | `VARCHAR(500)` | 事件 Webhook URL |

#### `oauth2_authorization_codes`

临时授权码（短期有效、一次性使用）。

| 列名 | 类型 | 描述 |
|:-------|:-----|:------------|
| `id` | `SERIAL PRIMARY KEY` | 自增 ID |
| `code_hash` | `VARCHAR(255) UNIQUE` | 授权码的 SHA-256 哈希 |
| `application_id` | `INTEGER REFERENCES oauth2_applications(id)` | 关联的应用 |
| `user_id` | `INTEGER REFERENCES users(id)` | 授权用户 |
| `redirect_uri` | `TEXT` | 使用的重定向 URI |
| `scope` | `VARCHAR(500)` | 授权的 scope |
| `state` | `VARCHAR(500)` | State 参数 |
| `code_challenge` | `VARCHAR(500)` | PKCE code challenge |
| `code_challenge_method` | `VARCHAR(10)` | PKCE 方法（`S256` 或 `plain`） |
| `expires_at` | `BIGINT` | 过期时间戳 |
| `used` | `BOOLEAN DEFAULT FALSE` | 授权码是否已被使用 |
| `created_at` | `BIGINT` | 创建时间戳 |

#### `oauth2_access_tokens`

活跃的访问令牌。

| 列名 | 类型 | 描述 |
|:-------|:-----|:------------|
| `id` | `SERIAL PRIMARY KEY` | 自增 ID |
| `token_hash` | `VARCHAR(255) UNIQUE` | 令牌的 SHA-256 哈希 |
| `application_id` | `INTEGER REFERENCES oauth2_applications(id)` | 关联的应用 |
| `user_id` | `INTEGER REFERENCES users(id)` | 令牌所有者 |
| `scope` | `VARCHAR(500)` | 授权的 scope |
| `expires_at` | `BIGINT` | 过期时间戳 |
| `created_at` | `BIGINT` | 创建时间戳 |
| `last_used_at` | `BIGINT` | 最后使用时间戳 |

#### `oauth2_refresh_tokens`

支持撤销的刷新令牌。

| 列名 | 类型 | 描述 |
|:-------|:-----|:------------|
| `id` | `SERIAL PRIMARY KEY` | 自增 ID |
| `token_hash` | `VARCHAR(255) UNIQUE` | 令牌的 SHA-256 哈希 |
| `access_token_id` | `INTEGER` | 关联的访问令牌 |
| `application_id` | `INTEGER REFERENCES oauth2_applications(id)` | 关联的应用 |
| `user_id` | `INTEGER REFERENCES users(id)` | 令牌所有者 |
| `scope` | `VARCHAR(500)` | 授权的 scope |
| `expires_at` | `BIGINT` | 过期时间戳 |
| `revoked` | `BOOLEAN DEFAULT FALSE` | 令牌是否已被撤销 |
| `created_at` | `BIGINT` | 创建时间戳 |

#### `oauth2_user_consents`

记录用户授权决定（每个用户 + 应用组合唯一）。

| 列名 | 类型 | 描述 |
|:-------|:-----|:------------|
| `id` | `SERIAL PRIMARY KEY` | 自增 ID |
| `user_id` | `INTEGER REFERENCES users(id)` | 授权的用户 |
| `application_id` | `INTEGER REFERENCES oauth2_applications(id)` | 被授权的应用 |
| `scopes` | `VARCHAR(500)` | 已授权的 scope |
| `created_at` | `BIGINT` | 首次授权时间戳 |
| `updated_at` | `BIGINT` | 最后更新时间（scope 扩展） |

> **唯一约束**：`(user_id, application_id)` — 每个用户-应用组合仅一条授权记录。

#### `oauth2_audit_log`

全面的 OAuth2 事件审计日志。

| 列名 | 类型 | 描述 |
|:-------|:-----|:------------|
| `id` | `SERIAL PRIMARY KEY` | 自增 ID |
| `event_type` | `VARCHAR(100)` | 事件类型标识符 |
| `application_id` | `INTEGER` | 相关应用（可为空） |
| `user_id` | `INTEGER` | 相关用户（可为空） |
| `ip_address` | `VARCHAR(100)` | 客户端 IP 地址 |
| `user_agent` | `TEXT` | 客户端 User Agent |
| `metadata` | `JSONB` | 附加事件数据 |
| `created_at` | `BIGINT` | 事件时间戳 |

### 审计事件类型

| 事件类型 | 描述 | 元数据 |
|:-----------|:------------|:---------|
| `authorization_granted` | 用户批准了应用 | scope、重定向 URI |
| `authorization_denied` | 用户拒绝了应用 | 重定向 URI |
| `token_issued` | 通过授权码交换签发令牌 | 授权类型、scope |
| `token_refreshed` | 令牌已刷新 | scope |
| `token_revoked` | 令牌已撤销 | 令牌类型 |
| `consent_revoked` | 用户撤销了应用访问 | 应用 ID |
| `app_created` | 注册了新应用 | 应用名称 |
| `app_updated` | 应用详情已更改 | 变更字段 |
| `app_deleted` | 应用被软删除 | 应用名称 |
| `secret_rotated` | Client Secret 已轮换 | — |
| `app_verified` | 管理员验证了应用 | 管理员用户 ID |
| `app_suspended` | 管理员暂停了应用 | 管理员用户 ID |
| `app_activated` | 管理员激活了应用 | 管理员用户 ID |

## Admin Guide

### 仪表板位置

| 页面 | 路径 | 访问权限 |
|:-----|:-----|:-------|
| 我的应用 | Settings → OAuth2 Apps → My Applications | 所有用户 |
| 已授权的应用 | Settings → OAuth2 Apps → Authorized Apps | 所有用户 |
| 集成指南 | Settings → OAuth2 Apps → Integration Guide | 所有用户 |
| 管理面板 | `/oauth2-admin` | 仅管理员 |

### 应用状态生命周期

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

### 管理员操作

- **验证**：在授权同意页面上为应用添加验证徽章，提升用户信任度。
- **暂停**：立即使所有现有令牌失效。应用无法签发新令牌或请求授权。
- **激活**：将暂停的应用恢复为活跃状态。用户需要重新授权。
- **审计日志**：查看所有 OAuth2 事件，支持按事件类型筛选。可导出 CSV 用于合规审查。

### 安全监控

监控审计日志中的可疑模式：

- 单个应用的 `token_issued` 事件过多（可能存在滥用）
- `authorization_denied` 突增（可能存在钓鱼攻击）
- 批量 `token_revoked`（应用可能已泄露）
- `secret_rotated` 没有对应的 `app_updated`（可能为未授权的轮换）


## FAQ

### 用户常见问题

**问：如何查看哪些应用可以访问我的账户？**  
答：前往 **Settings → OAuth2 Apps → Authorized Apps**。你可以看到所有已授权的应用、它们的权限以及授权日期。

**问：如何撤销应用的访问权限？**  
答：在 **Authorized Apps** 页面，点击应用旁边的 **Revoke** 按钮。这将立即使所有令牌失效并移除应用的访问权限。

**问：授权同意页面上的"unverified"是什么意思？**  
答：未验证的应用尚未经过 Knox.chat 管理员审核。授权未验证的应用时请保持谨慎，仅授予最低必要的权限。

**问：我可以更改应用已有的权限吗？**  
答：撤销应用的访问权限，然后重新授权。应用会再次请求权限，届时你可以重新审查。

### 开发者常见问题

**问：如何注册 OAuth2 应用？**  
答：前往 **Settings → OAuth2 Apps → My Applications** 并点击 "Create Application"。填写必要信息并保存你的 Client Secret。

**问：我丢失了 Client Secret，怎么办？**  
答：在应用上使用 **Rotate Secret** 操作。这将生成一个新密钥并使旧密钥失效。请立即更新你的应用配置。

**问：应该使用 confidential 还是 public 客户端？**  
答：如果你的应用运行在可以安全保管密钥的服务器上，使用 **confidential**。对于单页应用、移动应用或任何源代码可见的客户端，使用 **public**。公开客户端**必须**使用 PKCE。

**问：令牌的有效期是多久？**  
答：访问令牌在 **1 小时**后过期，刷新令牌在 **30 天**后过期。使用刷新令牌可以在无需用户重新授权的情况下获取新的访问令牌。

**问：刷新令牌时会发生什么？**  
答：你会收到一个新的访问令牌**和**一个新的刷新令牌。旧的刷新令牌会立即被撤销（令牌轮换）。务必保存新的刷新令牌。

**问：我的应用需要在用户离线时工作，怎么办？**  
答：使用刷新令牌。只要刷新令牌有效（30 天）且用户未撤销访问，你就可以在无需用户交互的情况下获取新的访问令牌。

**问：允许哪些重定向 URI？**  
答：生产环境需要 HTTPS URI。开发阶段的 `localhost` 允许使用 HTTP。自定义 URI scheme（如 `myapp://callback`）允许用于移动应用。

**问：Webhook 是如何工作的？**  
答：创建应用时注册 `webhook_url`。Knox.chat 会向此 URL 发送 `consent_granted` 和 `consent_revoked` 事件的 POST 请求。Webhook 采用即发即忘模式，超时时间为 10 秒。

**问：有 OpenID Connect 发现端点吗？**  
答：有的。`GET /api/oauth2/.well-known/openid-configuration` 返回完整的 OIDC 发现文档。

**问：令牌端点的速率限制是多少？**  
答：每个 IP 每分钟 60 次请求。用户信息端点允许每分钟 300 次请求。完整详情请参阅[速率限制](#rate-limits)部分。


## Supported Standards

| 标准 | 状态 | 说明 |
|:---------|:------:|:------|
| [RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749) — OAuth 2.0 Framework | ✅ | 支持 Authorization Code 和 Refresh Token 授权 |
| [RFC 7636](https://datatracker.ietf.org/doc/html/rfc7636) — PKCE | ✅ | 支持 S256 和 plain 方法；公开客户端强制要求 |
| [RFC 7009](https://datatracker.ietf.org/doc/html/rfc7009) — Token Revocation | ✅ | 按规范始终返回 200 |
| [RFC 7662](https://datatracker.ietf.org/doc/html/rfc7662) — Token Introspection | ✅ | 需要客户端认证 |
| [OpenID Connect Discovery](https://openid.net/specs/openid-connect-discovery-1_0.html) | ⚠️ 部分支持 | 支持发现文档和 userinfo；不含 ID token |