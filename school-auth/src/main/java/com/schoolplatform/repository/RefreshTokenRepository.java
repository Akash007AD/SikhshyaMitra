package com.schoolplatform.repository;

import com.schoolplatform.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    List<RefreshToken> findByFamilyId(UUID familyId);

    /** Revoke all tokens in a rotation family (triggered on reuse detection) */
    @Modifying
    @Query("UPDATE RefreshToken r SET r.revokedAt = :now WHERE r.familyId = :familyId AND r.revokedAt IS NULL")
    void revokeFamily(UUID familyId, LocalDateTime now);

    /** Clean up expired and revoked tokens older than 30 days */
    @Modifying
    @Query("DELETE FROM RefreshToken r WHERE r.expiresAt < :cutoff OR (r.revokedAt IS NOT NULL AND r.revokedAt < :cutoff)")
    void deleteExpiredBefore(LocalDateTime cutoff);
}
