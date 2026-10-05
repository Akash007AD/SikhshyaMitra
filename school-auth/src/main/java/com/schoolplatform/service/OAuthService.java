package com.schoolplatform.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.schoolplatform.entity.LoginAudit;
import com.schoolplatform.entity.UserAccount;
import com.schoolplatform.repository.LoginAuditRepository;
import com.schoolplatform.repository.TenantRepository;
import com.schoolplatform.repository.UserAccountRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Handles Google OAuth "Continue with Google" flow.
 *
 * Flow:
 *   1. Frontend receives a Google ID token after user clicks "Continue with Google"
 *   2. POST /api/auth/oauth/google with { "idToken": "..." }
 *   3. We verify the token against Google's public keys (no secrets sent to Google)
 *   4. Extract sub (globally unique user ID), email, name, picture
 *   5. Upsert the UserAccount (auth_provider=GOOGLE) within the resolved tenant
 *   6. Return our own access + refresh tokens
 */
@Service
public class OAuthService {

    @Value("${google.oauth.client-id}")
    private String googleClientId;

    private final UserAccountRepository userAccountRepository;
    private final TenantRepository tenantRepository;
    private final JwtService jwtService;
    private final LoginAuditRepository loginAuditRepository;

    public OAuthService(UserAccountRepository userAccountRepository,
                        TenantRepository tenantRepository,
                        JwtService jwtService,
                        LoginAuditRepository loginAuditRepository) {
        this.userAccountRepository = userAccountRepository;
        this.tenantRepository = tenantRepository;
        this.jwtService = jwtService;
        this.loginAuditRepository = loginAuditRepository;
    }

    @Transactional
    public Map<String, Object> loginWithGoogle(UUID tenantId, String rawIdToken,
                                                String ipAddress, String userAgent) {
        GoogleIdToken.Payload payload = verifyGoogleToken(rawIdToken);
        if (payload == null) {
            recordFailedOAuth(tenantId, ipAddress, userAgent, "INVALID_GOOGLE_TOKEN");
            throw new SecurityException("Invalid or expired Google ID token");
        }

        String googleSub = payload.getSubject();
        String email = payload.getEmail();
        String name = (String) payload.get("name");
        String picture = (String) payload.get("picture");

        // Upsert: find by google_sub first, then by email within tenant
        UserAccount user = userAccountRepository.findByGoogleSub(googleSub)
                .orElseGet(() -> userAccountRepository.findByTenantIdAndEmail(tenantId, email)
                        .orElse(null));

        if (user == null) {
            // First OAuth login for this email — auto-create account (SCHOOL_ADMIN or TEACHER only)
            user = new UserAccount();
            user.setTenantId(tenantId);
            user.setUserType("SCHOOL_ADMIN"); // Default; can be changed by platform admin
            user.setStatus("ACTIVE");
            user.setDisplayName(name != null ? name : email);
            user.setEmail(email);
            user.setEmailVerified(true); // Google already verified it
            user.setAuthProvider("GOOGLE");
            user.setGoogleSub(googleSub);
            user.setAvatarUrl(picture);
            user.setMfaRequired(false);
        } else {
            // Merge: link Google account to existing LOCAL account
            if (user.getGoogleSub() == null) {
                user.setGoogleSub(googleSub);
                user.setAuthProvider("GOOGLE");
            }
            if (picture != null && user.getAvatarUrl() == null) {
                user.setAvatarUrl(picture);
            }
            if (!Boolean.TRUE.equals(user.getEmailVerified())) {
                user.setEmailVerified(true);
            }
        }

        user.setLastLoginAt(LocalDateTime.now());
        userAccountRepository.save(user);

        // Audit success
        LoginAudit audit = new LoginAudit();
        audit.setTenantId(tenantId);
        audit.setUserId(user.getId());
        audit.setAuthMethod("GOOGLE_OAUTH");
        audit.setOutcome("SUCCESS");
        audit.setIpAddress(ipAddress);
        audit.setUserAgent(userAgent);
        loginAuditRepository.save(audit);

        // Issue tokens
        String accessToken = jwtService.generateAccessToken(user.getEmail(), tenantId, user.getUserType());
        Map<String, Object> refreshData = jwtService.issueRefreshToken(tenantId, user.getId(), null, ipAddress, userAgent);

        return Map.of(
                "accessToken", accessToken,
                "refreshToken", refreshData.get("rawToken"),
                "refreshTokenExpiresAt", refreshData.get("expiresAt"),
                "userType", user.getUserType(),
                "displayName", user.getDisplayName(),
                "avatarUrl", user.getAvatarUrl() != null ? user.getAvatarUrl() : ""
        );
    }

    /**
     * Verifies the Google ID token against Google's public keys.
     * Returns null if invalid (expired, wrong audience, tampered).
     */
    private GoogleIdToken.Payload verifyGoogleToken(String rawIdToken) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();
            GoogleIdToken token = verifier.verify(rawIdToken);
            return token != null ? token.getPayload() : null;
        } catch (Exception e) {
            return null;
        }
    }

    private void recordFailedOAuth(UUID tenantId, String ipAddress, String userAgent, String reason) {
        LoginAudit audit = new LoginAudit();
        audit.setTenantId(tenantId);
        audit.setAuthMethod("GOOGLE_OAUTH");
        audit.setOutcome("FAIL");
        audit.setFailureReason(reason);
        audit.setIpAddress(ipAddress);
        audit.setUserAgent(userAgent);
        loginAuditRepository.save(audit);
    }
}
