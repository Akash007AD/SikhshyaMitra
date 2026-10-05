package com.schoolplatform.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Append-only login audit log.
 * Never updated after INSERT — used for security forensics and lockout logic.
 */
@Entity
@Table(name = "login_audit")
@Getter
@Setter
public class LoginAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", columnDefinition = "BINARY(16)", nullable = false)
    private UUID tenantId;

    @Column(name = "user_id", columnDefinition = "BINARY(16)")
    private UUID userId;

    @Column(name = "username_tried", length = 80)
    private String usernameTried;

    /** PASSWORD | GOOGLE_OAUTH | EMAIL_OTP */
    @Column(name = "auth_method", nullable = false, length = 20)
    private String authMethod;

    /** SUCCESS | FAIL | LOCKED | BLOCKED */
    @Column(nullable = false, length = 10)
    private String outcome;

    @Column(name = "failure_reason", length = 100)
    private String failureReason;

    @Column(name = "ip_address", nullable = false, length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 300)
    private String userAgent;

    @Column(name = "attempted_at", nullable = false, updatable = false)
    private LocalDateTime attemptedAt = LocalDateTime.now();
}
