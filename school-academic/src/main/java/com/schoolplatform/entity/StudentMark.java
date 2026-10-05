package com.schoolplatform.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "student_mark")
@Getter
@Setter
public class StudentMark {

    @Id
    private UUID id;

    @Column(nullable = false)
    private UUID tenantId;

    @Column(nullable = false)
    private UUID examId;

    @Column(nullable = false)
    private UUID examSubjectId;

    @Column(nullable = false)
    private UUID studentId;

    @Column(nullable = false)
    private Double marksObtained = 0.0;

    @Column(nullable = false)
    private Boolean isAbsent = false;

    @Column(length = 5)
    private String grade;

    @Column(length = 255)
    private String remarks;

    @Column(length = 100)
    private String enteredBy;

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
