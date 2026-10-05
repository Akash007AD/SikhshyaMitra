package com.schoolplatform.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Stateful refresh token stored server-side.
 * We store the SHA-256 hash of the raw token — never the raw token itself.
 * Token reuse within a family revokes the entire family (rotation detection).
 */
@Entity
@Table(name = "refresh_token")
@Getter
@Setter
public class RefreshToken {

    @Id
    @Column(columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "tenant_id", columnDefinition = "BINARY(16)", nullable = false)
    private UUID tenantId;

    @Column(name = "user_id", columnDefinition = "BINARY(16)", nullable = false)
    private UUID userId;

    /** SHA-256 hash of the raw refresh token */
    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;

    /** Rotation family — all tokens in a family share this ID */
    @Column(name = "family_id", columnDefinition = "BINARY(16)", nullable = false)
    private UUID familyId;

    @Column(name = "issued_at", nullable = false)
    private LocalDateTime issuedAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;

    /** ID of the token that was issued in place of this one */
    @Column(name = "replaced_by", columnDefinition = "BINARY(16)")
    private UUID replacedBy;

    @Column(name = "user_agent", length = 300)
    private String userAgent;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }

    public boolean isRevoked() {
        return revokedAt != null;
    }

    public boolean isValid() {
        return !isExpired() && !isRevoked();
    }

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
    }
}
