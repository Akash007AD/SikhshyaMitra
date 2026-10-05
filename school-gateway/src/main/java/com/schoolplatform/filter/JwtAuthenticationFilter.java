package com.schoolplatform.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Order 2: JWT Authentication
 *   - Skips public endpoints (login, register, tenant resolution, OAuth)
 *   - Validates JWT signature with the same secret as school-auth
 *   - Injects X-User-Name, X-User-Role, X-Tenant-ID headers for downstream services
 *   - Adds security response headers on every response
 */
@Component
@Order(2)
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final SecretKey key;

    // Public paths that do NOT require a JWT
    private static final Set<String> PUBLIC_PATH_PREFIXES = Set.of(
            "/api/auth/login",
            "/api/auth/register",
            "/api/auth/oauth/google",
            "/api/auth/refresh",
            "/api/tenants"
    );

    public JwtAuthenticationFilter(
            @Value("${jwt.secret:LocalDevOnlySecretKeyThatIsAtLeast64CharactersLongForHS256!}") String secret) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // Always add security headers — even on public endpoints
        addSecurityHeaders(response);

        // Skip JWT check for public paths
        String path = request.getRequestURI();
        for (String prefix : PUBLIC_PATH_PREFIXES) {
            if (path.startsWith(prefix)) {
                filterChain.doFilter(request, response);
                return;
            }
        }

        // Require Authorization header
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Missing or invalid Authorization header\"}");
            return;
        }

        String token = authHeader.substring(7);
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            // Validate token type (must be ACCESS, not REFRESH)
            String tokenType = claims.get("type", String.class);
            if (!"ACCESS".equals(tokenType)) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\":\"Invalid token type\"}");
                return;
            }

            String username = claims.getSubject();
            String role = claims.get("role", String.class);
            String tenantId = claims.get("tenantId", String.class);

            // Inject user context as trusted headers for downstream services
            // Downstream services TRUST these headers and don't need JWT libraries
            HeaderMapRequestWrapper wrappedRequest = new HeaderMapRequestWrapper(request);
            wrappedRequest.addHeader("X-User-Name", username);
            wrappedRequest.addHeader("X-User-Role", role);
            wrappedRequest.addHeader("X-Tenant-ID-Verified", tenantId); // Verified by gateway

            filterChain.doFilter(wrappedRequest, response);

        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Invalid or expired JWT token\"}");
        }
    }

    /**
     * Security headers applied to ALL responses (OWASP recommendations).
     */
    private void addSecurityHeaders(HttpServletResponse response) {
        // Prevent MIME-type sniffing
        response.setHeader("X-Content-Type-Options", "nosniff");
        // Prevent clickjacking
        response.setHeader("X-Frame-Options", "DENY");
        // Force HTTPS for 1 year (only effective in production with HTTPS)
        response.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
        // Prevent XSS via inline scripts
        response.setHeader("X-XSS-Protection", "1; mode=block");
        // Referrer policy
        response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
        // Permissions policy
        response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    }

    // ── Header injection helper ────────────────────────────────────────────

    private static class HeaderMapRequestWrapper extends HttpServletRequestWrapper {
        private final Map<String, String> customHeaders = new HashMap<>();

        public HeaderMapRequestWrapper(HttpServletRequest request) { super(request); }

        public void addHeader(String name, String value) { customHeaders.put(name, value); }

        @Override
        public String getHeader(String name) {
            String val = customHeaders.get(name);
            return val != null ? val : super.getHeader(name);
        }

        @Override
        public Enumeration<String> getHeaderNames() {
            List<String> names = Collections.list(super.getHeaderNames());
            names.addAll(customHeaders.keySet());
            return Collections.enumeration(names);
        }

        @Override
        public Enumeration<String> getHeaders(String name) {
            List<String> values = Collections.list(super.getHeaders(name));
            if (customHeaders.containsKey(name)) values.add(customHeaders.get(name));
            return Collections.enumeration(values);
        }
    }
}
