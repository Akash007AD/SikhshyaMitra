package com.schoolplatform.service;

import com.google.common.collect.ImmutableList;
import com.schoolplatform.entity.*;
import com.schoolplatform.repository.*;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {

    // ── Rate limiting: 5 login attempts per IP per minute ─────────────────
    private final ConcurrentHashMap<String, Bucket> ipBuckets = new ConcurrentHashMap<>();

    private Bucket getBucketForIp(String ip) {
        return ipBuckets.computeIfAbsent(ip, k -> Bucket.builder()
                .addLimit(Bandwidth.classic(5, Refill.intervally(5, Duration.ofMinutes(1))))
                .build());
    }

    // ── Max consecutive failures before account lockout ───────────────────
    private static final int MAX_FAILURES = 5;
    private static final int LOCKOUT_MINUTES = 30;

    private final JwtService jwtService;
    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final TenantRepository tenantRepository;
    private final TenantDomainRepository tenantDomainRepository;
    private final LoginAuditRepository loginAuditRepository;

    public AuthService(JwtService jwtService,
                       UserAccountRepository userAccountRepository,
                       PasswordEncoder passwordEncoder,
                       TenantRepository tenantRepository,
                       TenantDomainRepository tenantDomainRepository,
                       LoginAuditRepository loginAuditRepository) {
        this.jwtService = jwtService;
        this.userAccountRepository = userAccountRepository;
        this.passwordEncoder = passwordEncoder;
        this.tenantRepository = tenantRepository;
        this.tenantDomainRepository = tenantDomainRepository;
        this.loginAuditRepository = loginAuditRepository;
    }

    // ── Login ─────────────────────────────────────────────────────────────

    @Transactional
    public Map<String, Object> login(UUID tenantId, Map<String, String> credentials,
                                      String ipAddress, String userAgent) {
        // 1. Rate limit by IP
        Bucket bucket = getBucketForIp(ipAddress);
        if (!bucket.tryConsume(1)) {
            audit(tenantId, null, credentials.get("username"), "PASSWORD", "BLOCKED", "RATE_LIMIT", ipAddress, userAgent);
            throw new SecurityException("Too many login attempts. Try again in 1 minute.");
        }

        String username = credentials.get("username");
        String password = credentials.get("password");

        Optional<UserAccount> optUser = userAccountRepository.findByTenantIdAndUsername(tenantId, username);
        if (optUser.isEmpty()) {
            audit(tenantId, null, username, "PASSWORD", "FAIL", "USER_NOT_FOUND", ipAddress, userAgent);
            throw new SecurityException("Invalid credentials");
        }

        UserAccount user = optUser.get();

        // 2. Check if account is locked
        if (user.getLockedUntil() != null && LocalDateTime.now().isBefore(user.getLockedUntil())) {
            audit(tenantId, user.getId(), username, "PASSWORD", "LOCKED", "ACCOUNT_LOCKED", ipAddress, userAgent);
            throw new SecurityException("Account locked. Try again after " + user.getLockedUntil());
        }

        // 3. Verify password
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            // Increment failure count
            int failures = user.getFailedLoginCount() + 1;
            user.setFailedLoginCount(failures);
            if (failures >= MAX_FAILURES) {
                user.setLockedUntil(LocalDateTime.now().plusMinutes(LOCKOUT_MINUTES));
            }
            userAccountRepository.save(user);
            audit(tenantId, user.getId(), username, "PASSWORD", "FAIL", "WRONG_PASSWORD", ipAddress, userAgent);
            throw new SecurityException("Invalid credentials");
        }

        // 4. Success — reset failures, update last login
        user.setFailedLoginCount(0);
        user.setLockedUntil(null);
        user.setLastLoginAt(LocalDateTime.now());
        userAccountRepository.save(user);

        audit(tenantId, user.getId(), username, "PASSWORD", "SUCCESS", null, ipAddress, userAgent);

        // 5. Issue tokens
        String accessToken = jwtService.generateAccessToken(user.getUsername(), tenantId, user.getUserType());
        Map<String, Object> refreshData = jwtService.issueRefreshToken(tenantId, user.getId(), null, ipAddress, userAgent);

        return Map.of(
                "accessToken", accessToken,
                "refreshToken", refreshData.get("rawToken"),
                "refreshTokenExpiresAt", refreshData.get("expiresAt"),
                "userType", user.getUserType(),
                "verificationStatus", getTenantVerificationStatus(tenantId)
        );
    }

    // ── Registration ──────────────────────────────────────────────────────

    @Transactional
    public Map<String, String> register(Map<String, String> payload) {
        String username = payload.get("username");
        String password = payload.get("password");
        String schoolName = payload.get("schoolName");
        String type = payload.getOrDefault("type", "Primary");
        String host = payload.get("host");
        String udiseCode = payload.get("udiseCode");
        String board = payload.get("board");
        String principalEmail = payload.get("principalEmail"); // can be @gmail.com

        if (username == null || password == null || host == null || schoolName == null) {
            throw new IllegalArgumentException("Missing required fields: username, password, host, schoolName");
        }

        // Password strength
        validatePasswordStrength(password);

        // Subdomain deduplication check
        String slug = host.split("\\.")[0].toLowerCase().trim();
        if (tenantRepository.existsBySlug(slug)) {
            throw new IllegalArgumentException("Subdomain '" + slug + "' is already registered. Please choose a different subdomain.");
        }

        // School name deduplication (fuzzy, Levenshtein ≤ 2)
        checkSchoolNameConflict(schoolName);

        // UDISE format and uniqueness check (Ministry of Education 11-digit school identifier)
        if (udiseCode != null && !udiseCode.trim().isEmpty()) {
            udiseCode = udiseCode.trim();
            if (!udiseCode.matches("\\d{11}")) {
                throw new IllegalArgumentException("UDISE code must be exactly 11 digits");
            }
            if (tenantRepository.existsByUdiseCode(udiseCode)) {
                throw new IllegalArgumentException(
                    "A school is already registered with UDISE code " + udiseCode + 
                    ". Duplicate website registration for the same school is strictly prohibited. If this is your school, please contact support@sikhshyamitra.in"
                );
            }
        }

        // 1. Create Tenant — starts in PENDING_VERIFICATION, not ACTIVE
        Tenant tenant = new Tenant();
        tenant.setSlug(slug);
        tenant.setName(schoolName);
        tenant.setStatus("PROVISIONING");  // Lifecycle status
        tenant.setVerificationStatus("PENDING_VERIFICATION"); // Verification status
        tenant.setPlanId(UUID.fromString("11111111-1111-1111-1111-111111111111"));
        tenant.setStatusChangedAt(LocalDateTime.now());
        tenant.setRegion("ap-south");
        if (udiseCode != null && !udiseCode.isEmpty()) tenant.setUdiseCode(udiseCode);
        if (board != null && !board.isEmpty()) tenant.setBoard(board);
        tenantRepository.save(tenant);

        // 2. Create TenantDomain
        TenantDomain domain = new TenantDomain();
        domain.setTenantId(tenant.getId());
        domain.setHost(host);
        domain.setDomainType("SUBDOMAIN");
        domain.setIsPrimary(true);
        domain.setVerificationStatus("VERIFIED"); // Subdomain is auto-verified
        domain.setTlsStatus("PENDING");
        tenantDomainRepository.save(domain);

        // 3. Create Admin User
        UserAccount admin = new UserAccount();
        admin.setTenantId(tenant.getId());
        admin.setUsername(username);
        admin.setPasswordHash(passwordEncoder.encode(password));
        admin.setUserType("SCHOOL_ADMIN");
        admin.setStatus("ACTIVE");
        admin.setDisplayName("Admin");
        admin.setAuthProvider("LOCAL");
        admin.setEmailVerified(false); // Email not yet verified
        if (principalEmail != null) admin.setEmail(principalEmail);
        admin.setLastLoginAt(LocalDateTime.now());
        userAccountRepository.save(admin);

        // 4. Return access token — limited access until TRIAL
        String token = jwtService.generateAccessToken(admin.getUsername(), tenant.getId(), admin.getUserType());

        return Map.of(
                "accessToken", token,
                "tenantId", tenant.getId().toString(),
                "type", type,
                "verificationStatus", tenant.getVerificationStatus(),
                "message", "Registration successful. Upload verification documents to activate your school."
        );
    }

    // ── Token Refresh ─────────────────────────────────────────────────────

    @Transactional
    public Map<String, Object> refreshTokens(String rawRefreshToken, UUID tenantId,
                                              String username, String role,
                                              String ipAddress, String userAgent) {
        Map<String, Object> newRefreshData = jwtService.rotateRefreshToken(rawRefreshToken, ipAddress, userAgent);
        String newAccessToken = jwtService.generateAccessToken(username, tenantId, role);
        return Map.of(
                "accessToken", newAccessToken,
                "refreshToken", newRefreshData.get("rawToken"),
                "refreshTokenExpiresAt", newRefreshData.get("expiresAt")
        );
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private void validatePasswordStrength(String password) {
        if (password.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters");
        }
        if (!password.matches(".*[A-Z].*")) {
            throw new IllegalArgumentException("Password must contain at least one uppercase letter");
        }
        if (!password.matches(".*[0-9].*")) {
            throw new IllegalArgumentException("Password must contain at least one digit");
        }
    }

    /**
     * Prevents impersonation of existing schools.
     * Uses Levenshtein distance ≤ 2 to catch near-identical names.
     * Note: This is a simplified in-memory implementation.
     * Production should use a dedicated utility.
     */
    private void checkSchoolNameConflict(String newName) {
        List<String> existingNames = userAccountRepository.findAllActiveTenantNames();
        String normalizedNew = normalize(newName);
        for (String existing : existingNames) {
            if (levenshteinDistance(normalizedNew, normalize(existing)) <= 2) {
                throw new IllegalArgumentException(
                        "A school with a very similar name already exists on our platform. " +
                        "If this is your school, contact support@schoolplatform.in"
                );
            }
        }
    }

    private String normalize(String s) {
        return s.toLowerCase()
                .replaceAll("[^a-z0-9\\s]", "")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private int levenshteinDistance(String a, String b) {
        int[][] dp = new int[a.length() + 1][b.length() + 1];
        for (int i = 0; i <= a.length(); i++) dp[i][0] = i;
        for (int j = 0; j <= b.length(); j++) dp[0][j] = j;
        for (int i = 1; i <= a.length(); i++) {
            for (int j = 1; j <= b.length(); j++) {
                int cost = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;
                dp[i][j] = Math.min(Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1), dp[i - 1][j - 1] + cost);
            }
        }
        return dp[a.length()][b.length()];
    }

    private String getTenantVerificationStatus(UUID tenantId) {
        return tenantRepository.findById(tenantId)
                .map(Tenant::getVerificationStatus)
                .orElse("UNKNOWN");
    }

    private void audit(UUID tenantId, UUID userId, String usernameTried, String method,
                       String outcome, String reason, String ipAddress, String userAgent) {
        LoginAudit a = new LoginAudit();
        a.setTenantId(tenantId);
        a.setUserId(userId);
        a.setUsernameTried(usernameTried);
        a.setAuthMethod(method);
        a.setOutcome(outcome);
        a.setFailureReason(reason);
        a.setIpAddress(ipAddress);
        a.setUserAgent(userAgent);
        loginAuditRepository.save(a);
    }
}
