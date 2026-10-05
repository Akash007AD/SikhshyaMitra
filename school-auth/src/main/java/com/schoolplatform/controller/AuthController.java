package com.schoolplatform.controller;

import com.schoolplatform.service.AuthService;
import com.schoolplatform.service.OAuthService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final OAuthService oAuthService;

    public AuthController(AuthService authService, OAuthService oAuthService) {
        this.authService = authService;
        this.oAuthService = oAuthService;
    }

    // ── Password Login ────────────────────────────────────────────────────

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestHeader("X-Tenant-ID") UUID tenantId,
                                   @RequestBody Map<String, String> credentials,
                                   HttpServletRequest request) {
        try {
            Map<String, Object> result = authService.login(
                    tenantId, credentials, getClientIp(request), request.getHeader("User-Agent"));
            return ResponseEntity.ok(result);
        } catch (SecurityException e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Login failed"));
        }
    }

    // ── Registration ──────────────────────────────────────────────────────

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> payload) {
        try {
            Map<String, String> result = authService.register(payload);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Google OAuth ──────────────────────────────────────────────────────

    /**
     * POST /api/auth/oauth/google
     * Body: { "idToken": "<google-id-token>" }
     * The frontend gets this ID token after the user completes the Google sign-in popup.
     */
    @PostMapping("/oauth/google")
    public ResponseEntity<?> googleOAuth(@RequestHeader("X-Tenant-ID") UUID tenantId,
                                          @RequestBody Map<String, String> body,
                                          HttpServletRequest request) {
        try {
            String idToken = body.get("idToken");
            if (idToken == null || idToken.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "idToken is required"));
            }
            Map<String, Object> result = oAuthService.loginWithGoogle(
                    tenantId, idToken, getClientIp(request), request.getHeader("User-Agent"));
            return ResponseEntity.ok(result);
        } catch (SecurityException e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "OAuth login failed"));
        }
    }

    // ── Token Refresh ─────────────────────────────────────────────────────

    /**
     * POST /api/auth/refresh
     * Body: { "refreshToken": "...", "username": "...", "role": "...", "tenantId": "..." }
     */
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestBody Map<String, String> body,
                                     HttpServletRequest request) {
        try {
            String rawRefreshToken = body.get("refreshToken");
            UUID tenantId = UUID.fromString(body.get("tenantId"));
            String username = body.get("username");
            String role = body.get("role");
            Map<String, Object> result = authService.refreshTokens(
                    rawRefreshToken, tenantId, username, role,
                    getClientIp(request), request.getHeader("User-Agent"));
            return ResponseEntity.ok(result);
        } catch (SecurityException e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Token refresh failed"));
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    /** Reads real client IP even behind a reverse proxy / CDN */
    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp;
        }
        return request.getRemoteAddr();
    }
}
