package com.schoolplatform.filter;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.google.common.hash.BloomFilter;
import com.google.common.hash.Funnels;
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
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Order 1: Tenant Resolution
 *   - Bloom filter rejects clearly unknown hosts in microseconds (no DB hit)
 *   - Caffeine cache avoids repeated HTTP calls to school-auth for known hosts
 *   - Falls back to school-auth REST call on cache miss
 *   - Injects X-Tenant-ID header for downstream services
 *
 * Order 2: JWT Authentication (see JwtAuthenticationFilter)
 */
@Component
@Order(1)
public class TenantResolutionFilter extends OncePerRequestFilter {

    @Value("${school.auth.url:http://127.0.0.1:8081}")
    private String authServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    // ── Caffeine cache: host → tenantId, 5-minute TTL ─────────────────────
    private final Cache<String, String> tenantCache = Caffeine.newBuilder()
            .maximumSize(5_000)
            .expireAfterWrite(5, TimeUnit.MINUTES)
            .build();

    // ── Bloom filter: tracks all known hosts; rebuilt every 5 minutes ──────
    // Capacity 10,000 hosts, 0.1% false-positive rate
    // A false positive just causes a cache miss → falls through to DB (no harm)
    private final AtomicReference<BloomFilter<String>> bloomFilterRef =
            new AtomicReference<>(buildBloomFilter());

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String host = request.getServerName();

        // 1. Bloom filter pre-check: if host is definitely NOT known → skip resolution
        if (!bloomFilterRef.get().mightContain(host)) {
            // Not in Bloom filter = definitely unknown host; proceed without tenant header
            filterChain.doFilter(request, response);
            return;
        }

        // 2. Caffeine cache lookup
        String tenantId = tenantCache.getIfPresent(host);

        if (tenantId == null) {
            // 3. Cache miss → ask school-auth
            tenantId = resolveTenantFromAuth(host);
            if (tenantId != null) {
                tenantCache.put(host, tenantId);
                // Also add to Bloom filter so next JVM restart warms up faster
                bloomFilterRef.get().put(host);
            }
        }

        if (tenantId != null && !tenantId.isEmpty()) {
            HeaderMapRequestWrapper wrapped = new HeaderMapRequestWrapper(request);
            wrapped.addHeader("X-Tenant-ID", tenantId);
            filterChain.doFilter(wrapped, response);
        } else {
            filterChain.doFilter(request, response);
        }
    }

    private String resolveTenantFromAuth(String host) {
        try {
            return restTemplate.getForObject(
                    authServiceUrl + "/api/tenants/resolve?host=" + host, String.class);
        } catch (Exception e) {
            return null;
        }
    }

    /** Rebuild the Bloom filter from scratch every 5 minutes */
    @Scheduled(fixedDelay = 300_000)
    public void rebuildBloomFilter() {
        BloomFilter<String> newFilter = buildBloomFilter();
        // Seed from the current Caffeine cache
        tenantCache.asMap().keySet().forEach(newFilter::put);
        bloomFilterRef.set(newFilter);
    }

    private static BloomFilter<String> buildBloomFilter() {
        return BloomFilter.create(
                Funnels.stringFunnel(StandardCharsets.UTF_8),
                10_000,  // expected insertions
                0.001    // 0.1% false positive rate
        );
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
