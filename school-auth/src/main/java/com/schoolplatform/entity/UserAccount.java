package com.schoolplatform.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_account")
@Getter
@Setter
public class UserAccount {

    @Id
    @Column(columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "tenant_id", columnDefinition = "BINARY(16)", nullable = false)
    private UUID tenantId;

    @Column(name = "user_type", nullable = false, length = 15)
    private String userType;

    /** Authentication provider: LOCAL (username+password or OTP) | GOOGLE */
    @Column(name = "auth_provider", nullable = false, length = 20)
    private String authProvider = "LOCAL";

    /** Google OAuth subject (globally unique, from Google ID token) */
    @Column(name = "google_sub", length = 100, unique = true)
    private String googleSub;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(nullable = false, length = 10)
    private String status;

    @Column(name = "display_name", nullable = false, length = 150)
    private String displayName;

    @Column(length = 254)
    private String email;

    @Column(name = "email_verified", nullable = false)
    private Boolean emailVerified = false;

    @Column(length = 20)
    private String phone;

    @Column(name = "phone_verified", nullable = false)
    private Boolean phoneVerified = false;

    @Column(length = 80)
    private String username;

    @Column(name = "password_hash")
    private String passwordHash;

    // ── Lockout ──────────────────────────────────────────────────
    @Column(name = "failed_login_count", nullable = false)
    private Integer failedLoginCount = 0;

    /** When non-null, the account is locked until this timestamp */
    @Column(name = "locked_until")
    private LocalDateTime lockedUntil;

    @Column(name = "person_ref", columnDefinition = "BINARY(16)")
    private UUID personRef;

    @Column(name = "registered_contact_id", columnDefinition = "BINARY(16)")
    private UUID registeredContactId;

    @Column(name = "mfa_required", nullable = false)
    private Boolean mfaRequired = false;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Version
    @Column(nullable = false)
    private Integer version = 0;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
    }
}
