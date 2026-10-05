package com.schoolplatform.service;

import com.schoolplatform.entity.RefreshToken;
import com.schoolplatform.repository.RefreshTokenRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Date;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;

@Service
public class JwtService {

    private final SecretKey key;

    /** Access token: 15 minutes */
    @Value("${jwt.expiration.ms:900000}")
    private long accessTokenExpirationMs;

    /** Refresh token: 30 days */
    @Value("${jwt.refresh.expiration.days:30}")
    private long refreshTokenExpirationDays;

    private final RefreshTokenRepository refreshTokenRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public JwtService(
            @Value("${jwt.secret}") String secret,
            RefreshTokenRepository refreshTokenRepository) {
        // Require at least 32 bytes for HS256
        if (secret == null || secret.length() < 32) {
            throw new IllegalStateException("jwt.secret must be at least 32 characters. Set JWT_SECRET env var.");
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.refreshTokenRepository = refreshTokenRepository;
    }

    // ── Access Token ──────────────────────────────────────────────────────

    public String generateAccessToken(String username, UUID tenantId, String role) {
        return Jwts.builder()
                .subject(username)
                .claim("tenantId", tenantId.toString())
                .claim("role", role)
                .claim("type", "ACCESS")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + accessTokenExpirationMs))
                .signWith(key)
                .compact();
    }

    public Claims validateAccessToken(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    // ── Refresh Token ─────────────────────────────────────────────────────

    /**
     * Issues a new refresh token. Returns a map with:
     *   rawToken  — the 256-bit random token to send to the client (store in httpOnly cookie)
     *   expiresAt — ISO-8601 expiry
     */
    @Transactional
    public Map<String, Object> issueRefreshToken(UUID tenantId, UUID userId, UUID familyId,
                                                  String ipAddress, String userAgent) {
        // 256-bit random token
        byte[] tokenBytes = new byte[32];
        secureRandom.nextBytes(tokenBytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
        String tokenHash = sha256(rawToken);

        LocalDateTime expiresAt = LocalDateTime.now().plusDays(refreshTokenExpirationDays);

        RefreshToken rt = new RefreshToken();
        rt.setTenantId(tenantId);
        rt.setUserId(userId);
        rt.setTokenHash(tokenHash);
        rt.setFamilyId(familyId != null ? familyId : UUID.randomUUID());
        rt.setIssuedAt(LocalDateTime.now());
        rt.setExpiresAt(expiresAt);
        rt.setIpAddress(ipAddress);
        rt.setUserAgent(userAgent);
        refreshTokenRepository.save(rt);

        return Map.of("rawToken", rawToken, "expiresAt", expiresAt.toString(), "familyId", rt.getFamilyId().toString());
    }

    /**
     * Rotates a refresh token:
     * 1. Looks up the hash
     * 2. If revoked → reuse detected → revoke entire family
     * 3. If valid → revoke old, issue new in same family
     * Returns new raw token or throws on invalid/reuse.
     */
    @Transactional
    public Map<String, Object> rotateRefreshToken(String rawToken, String ipAddress, String userAgent) {
        String hash = sha256(rawToken);
        RefreshToken existing = refreshTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new SecurityException("Refresh token not found"));

        if (existing.isRevoked()) {
            // Reuse detected — revoke entire family
            refreshTokenRepository.revokeFamily(existing.getFamilyId(), LocalDateTime.now());
            throw new SecurityException("Token reuse detected. All sessions revoked.");
        }
        if (existing.isExpired()) {
            throw new SecurityException("Refresh token expired");
        }

        // Revoke the old token
        existing.setRevokedAt(LocalDateTime.now());
        refreshTokenRepository.save(existing);

        // Issue a new one in the same family
        return issueRefreshToken(existing.getTenantId(), existing.getUserId(),
                existing.getFamilyId(), ipAddress, userAgent);
    }

    @Transactional
    public void revokeRefreshToken(String rawToken) {
        String hash = sha256(rawToken);
        refreshTokenRepository.findByTokenHash(hash).ifPresent(rt -> {
            rt.setRevokedAt(LocalDateTime.now());
            refreshTokenRepository.save(rt);
        });
    }

    /** Clean up expired/revoked tokens every night at 2 AM */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void cleanupExpiredTokens() {
        refreshTokenRepository.deleteExpiredBefore(LocalDateTime.now().minusDays(7));
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private String sha256(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}
