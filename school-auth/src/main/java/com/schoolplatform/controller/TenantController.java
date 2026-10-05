package com.schoolplatform.controller;

import com.schoolplatform.entity.Tenant;
import com.schoolplatform.repository.TenantDomainRepository;
import com.schoolplatform.repository.TenantRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tenants")
public class TenantController {

    private final TenantRepository tenantRepository;
    private final TenantDomainRepository tenantDomainRepository;

    public TenantController(TenantRepository tenantRepository, TenantDomainRepository tenantDomainRepository) {
        this.tenantRepository = tenantRepository;
        this.tenantDomainRepository = tenantDomainRepository;
    }

    // Endpoint for the Gateway to resolve a domain to a Tenant ID
    @GetMapping("/resolve")
    public ResponseEntity<String> resolveTenantId(@RequestParam String host) {
        return tenantDomainRepository.findByHost(host)
                .map(domain -> ResponseEntity.ok(domain.getTenantId().toString()))
                .orElse(ResponseEntity.notFound().build());
    }

    // GET http://localhost:8081/api/tenants
    @GetMapping
    public List<Tenant> getAllTenants() {
        return tenantRepository.findAll();
    }

    // GET http://localhost:8081/api/tenants/platform
    @GetMapping("/{slug}")
    public ResponseEntity<Tenant> getTenantBySlug(@PathVariable String slug) {
        return tenantRepository.findBySlug(slug)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
