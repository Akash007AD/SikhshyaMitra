package com.schoolplatform.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "exam_subject")
@Getter
@Setter
public class ExamSubject {

    @Id
    private UUID id;

    @Column(nullable = false)
    private UUID tenantId;

    @Column(nullable = false)
    private UUID examId;

    @Column(nullable = false)
    private UUID standardId;

    @Column(nullable = false)
    private UUID subjectId;

    @Column(nullable = false)
    private Integer maxMarks = 100;

    @Column(nullable = false)
    private Integer passingMarks = 35;

    private LocalDate examDate;

    @Column(nullable = false, length = 20)
    private String lockStatus = "UNLOCKED"; // UNLOCKED, LOCKED

    private LocalDateTime lockedAt;

    @Column(length = 100)
    private String lockedBy;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
