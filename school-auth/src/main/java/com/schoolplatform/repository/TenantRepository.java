package com.schoolplatform.repository;

import com.schoolplatform.entity.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, UUID> {
    
    // Spring Data JPA will automatically write the SQL query for this!
    Optional<Tenant> findBySlug(String slug);
}
