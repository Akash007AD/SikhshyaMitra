package com.schoolplatform.service;

import com.schoolplatform.entity.Exam;
import com.schoolplatform.entity.ExamSubject;
import com.schoolplatform.entity.StudentMark;
import com.schoolplatform.exception.ResourceNotFoundException;
import com.schoolplatform.repository.ExamRepository;
import com.schoolplatform.repository.ExamSubjectRepository;
import com.schoolplatform.repository.StudentMarkRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class ExamService {

    private final ExamRepository examRepository;
    private final ExamSubjectRepository examSubjectRepository;
    private final StudentMarkRepository studentMarkRepository;

    public ExamService(ExamRepository examRepository,
                       ExamSubjectRepository examSubjectRepository,
                       StudentMarkRepository studentMarkRepository) {
        this.examRepository = examRepository;
        this.examSubjectRepository = examSubjectRepository;
        this.studentMarkRepository = studentMarkRepository;
    }

    public List<Exam> getExamsBySchool(UUID tenantId, UUID schoolId) {
        return examRepository.findByTenantIdAndSchoolId(tenantId, schoolId);
    }

    public Exam createExam(UUID tenantId, UUID schoolId, Exam exam) {
        exam.setTenantId(tenantId);
        exam.setSchoolId(schoolId);
        return examRepository.save(exam);
    }

    public List<ExamSubject> getExamSubjects(UUID tenantId, UUID examId, UUID standardId) {
        if (standardId != null) {
            return examSubjectRepository.findByTenantIdAndExamIdAndStandardId(tenantId, examId, standardId);
        }
        return examSubjectRepository.findByTenantIdAndExamId(tenantId, examId);
    }

    public ExamSubject addExamSubject(UUID tenantId, UUID examId, UUID standardId, UUID subjectId,
                                      int maxMarks, int passMarks, LocalDate examDate) {
        ExamSubject es = new ExamSubject();
        es.setTenantId(tenantId);
        es.setExamId(examId);
        es.setStandardId(standardId);
        es.setSubjectId(subjectId);
        es.setMaxMarks(maxMarks);
        es.setPassingMarks(passMarks);
        es.setExamDate(examDate);
        es.setLockStatus("UNLOCKED");
        return examSubjectRepository.save(es);
    }

    @Transactional
    public List<StudentMark> saveMarksBatch(UUID tenantId, UUID examId, UUID examSubjectId,
                                            String enteredBy, List<Map<String, Object>> marksList) {
        ExamSubject subject = examSubjectRepository.findById(examSubjectId)
                .filter(s -> s.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("Exam subject paper not found."));

        if ("LOCKED".equalsIgnoreCase(subject.getLockStatus())) {
            throw new IllegalStateException("Marks entry is LOCKED for this examination subject. Contact principal to unlock.");
        }

        List<StudentMark> toSave = new ArrayList<>();
        for (Map<String, Object> entry : marksList) {
            UUID studentId = UUID.fromString((String) entry.get("studentId"));
            Double marks = Double.parseDouble(String.valueOf(entry.getOrDefault("marksObtained", 0.0)));
            Boolean isAbsent = Boolean.parseBoolean(String.valueOf(entry.getOrDefault("isAbsent", false)));
            String remarks = (String) entry.get("remarks");

            String grade = calculateGrade(marks, subject.getMaxMarks(), isAbsent);

            Optional<StudentMark> existing = studentMarkRepository
                    .findByTenantIdAndExamSubjectIdAndStudentId(tenantId, examSubjectId, studentId);

            StudentMark mark = existing.orElseGet(StudentMark::new);
            mark.setTenantId(tenantId);
            mark.setExamId(examId);
            mark.setExamSubjectId(examSubjectId);
            mark.setStudentId(studentId);
            mark.setMarksObtained(isAbsent ? 0.0 : marks);
            mark.setIsAbsent(isAbsent);
            mark.setGrade(grade);
            mark.setRemarks(remarks);
            mark.setEnteredBy(enteredBy);

            toSave.add(mark);
        }

        return studentMarkRepository.saveAll(toSave);
    }

    @Transactional
    public ExamSubject lockMarks(UUID tenantId, UUID examSubjectId, String lockedBy) {
        ExamSubject subject = examSubjectRepository.findById(examSubjectId)
                .filter(s -> s.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("Exam subject paper not found."));

        subject.setLockStatus("LOCKED");
        subject.setLockedAt(LocalDateTime.now());
        subject.setLockedBy(lockedBy);
        return examSubjectRepository.save(subject);
    }

    public Map<String, Object> getStudentReportCard(UUID tenantId, UUID examId, UUID studentId) {
        List<StudentMark> marks = studentMarkRepository.findByTenantIdAndExamIdAndStudentId(tenantId, examId, studentId);

        double totalObtained = 0.0;
        int totalMax = 0;
        boolean hasFailed = false;

        List<Map<String, Object>> subjectBreakdown = new ArrayList<>();
        for (StudentMark sm : marks) {
            Optional<ExamSubject> esOpt = examSubjectRepository.findById(sm.getExamSubjectId());
            int max = esOpt.map(ExamSubject::getMaxMarks).orElse(100);
            int pass = esOpt.map(ExamSubject::getPassingMarks).orElse(35);

            totalObtained += sm.getMarksObtained();
            totalMax += max;
            if (sm.getMarksObtained() < pass || Boolean.TRUE.equals(sm.getIsAbsent())) {
                hasFailed = true;
            }

            Map<String, Object> item = new HashMap<>();
            item.put("examSubjectId", sm.getExamSubjectId());
            item.put("marksObtained", sm.getMarksObtained());
            item.put("maxMarks", max);
            item.put("passingMarks", pass);
            item.put("grade", sm.getGrade());
            item.put("isAbsent", sm.getIsAbsent());
            subjectBreakdown.add(item);
        }

        double percentage = totalMax > 0 ? (totalObtained / totalMax) * 100.0 : 0.0;

        Map<String, Object> report = new HashMap<>();
        report.put("studentId", studentId);
        report.put("examId", examId);
        report.put("totalMarksObtained", totalObtained);
        report.put("totalMaxMarks", totalMax);
        report.put("percentage", Math.round(percentage * 10.0) / 10.0);
        report.put("result", hasFailed ? "FAILED" : "PASSED");
        report.put("subjects", subjectBreakdown);
        return report;
    }

    private String calculateGrade(double marks, int maxMarks, boolean isAbsent) {
        if (isAbsent) return "ABS";
        double pct = (marks / maxMarks) * 100.0;
        if (pct >= 91.0) return "A1";
        if (pct >= 81.0) return "A2";
        if (pct >= 71.0) return "B1";
        if (pct >= 61.0) return "B2";
        if (pct >= 51.0) return "C1";
        if (pct >= 41.0) return "C2";
        if (pct >= 33.0) return "D";
        return "E";
    }
}
