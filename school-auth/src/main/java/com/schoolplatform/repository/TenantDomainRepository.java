package com.schoolplatform.repository;

import com.schoolplatform.entity.TenantDomain;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantDomainRepository extends JpaRepository<TenantDomain, UUID> {
    Optional<TenantDomain> findByHost(String host);
}
