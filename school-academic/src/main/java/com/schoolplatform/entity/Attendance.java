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
@Table(name = "student_attendance")
@Getter
@Setter
public class Attendance {

    @Id
    private UUID id;

    @Column(nullable = false)
    private UUID tenantId;

    @Column(nullable = false)
    private UUID schoolId;

    @Column(nullable = false)
    private UUID standardId;

    @Column(nullable = false)
    private UUID sectionId;

    @Column(nullable = false)
    private UUID studentId;

    @Column(nullable = false)
    private LocalDate attendanceDate;

    @Column(nullable = false, length = 20)
    private String status; // PRESENT, ABSENT, LATE, EXCUSED, HALF_DAY

    @Column(length = 255)
    private String remarks;

    @Column(length = 100)
    private String markedBy;

    @Column(nullable = false)
    private LocalDateTime markedAt;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (markedAt == null) {
            markedAt = LocalDateTime.now();
        }
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
