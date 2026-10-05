package com.schoolplatform.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tenant")
@Getter
@Setter
public class Tenant {

    @Id
    @Column(columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(nullable = false, unique = true, length = 63)
    private String slug;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false, length = 20)
    private String status;

    // ── Verification pipeline ──────────────────────────────────────────
    @Column(name = "verification_status", nullable = false, length = 30)
    private String verificationStatus = "PENDING_VERIFICATION";

    /** Ministry of Education 11-digit school code */
    @Column(name = "udise_code", length = 11, unique = true)
    private String udiseCode;

    @Column(length = 20)
    private String board;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "verified_by", length = 100)
    private String verifiedBy;

    @Column(name = "plan_id", columnDefinition = "BINARY(16)", nullable = false)
    private UUID planId;

    @Column(name = "config_version", nullable = false)
    private Integer configVersion = 1;

    @Column(name = "datasource_ref", length = 100)
    private String datasourceRef;

    @Column(nullable = false, length = 30)
    private String region;

    @Column(nullable = false, length = 40)
    private String timezone = "Asia/Kolkata";

    @Column(name = "status_changed_at", nullable = false)
    private LocalDateTime statusChangedAt;

    @Column(name = "grace_ends_at")
    private LocalDateTime graceEndsAt;

    @Column(name = "suspended_at")
    private LocalDateTime suspendedAt;

    @Column(name = "retain_until")
    private LocalDateTime retainUntil;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Version
    @Column(nullable = false)
    private Integer version = 0;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
        if (this.statusChangedAt == null) {
            this.statusChangedAt = LocalDateTime.now();
        }
    }
}
