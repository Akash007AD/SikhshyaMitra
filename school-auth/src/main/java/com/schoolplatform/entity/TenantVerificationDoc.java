package com.schoolplatform.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Stores verification documents uploaded by a school during onboarding.
 * Immutable once submitted — reviews are tracked via reviewStatus.
 */
@Entity
@Table(name = "tenant_verification_doc")
@Getter
@Setter
public class TenantVerificationDoc {

    @Id
    @Column(columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "tenant_id", columnDefinition = "BINARY(16)", nullable = false)
    private UUID tenantId;

    /**
     * RECOGNITION_CERTIFICATE | UDISE_PRINTOUT | PRINCIPAL_ID |
     * AFFILIATION_CERTIFICATE | OTHER
     */
    @Column(name = "doc_type", nullable = false, length = 50)
    private String docType;

    @Column(name = "original_name", nullable = false, length = 255)
    private String originalName;

    /** Object-storage path (never expose this directly to the browser) */
    @Column(name = "storage_path", nullable = false, length = 500)
    private String storagePath;

    @Column(name = "file_size_bytes", nullable = false)
    private Long fileSizeBytes;

    @CreationTimestamp
    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private LocalDateTime uploadedAt;

    // ── Review ───────────────────────────────────────────────────────────
    @Column(name = "reviewed_by", length = 100)
    private String reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    /** PENDING | APPROVED | REJECTED */
    @Column(name = "review_status", length = 20)
    private String reviewStatus = "PENDING";

    @Column(name = "rejection_note", length = 500)
    private String rejectionNote;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
    }
}
