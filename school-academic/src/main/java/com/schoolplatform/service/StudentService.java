package com.schoolplatform.service;

import com.schoolplatform.entity.Student;
import com.schoolplatform.exception.ResourceAlreadyExistsException;
import com.schoolplatform.exception.ResourceNotFoundException;
import com.schoolplatform.repository.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.StringReader;
import java.time.LocalDate;
import java.util.*;

@Service
public class StudentService {

    private final StudentRepository studentRepository;

    public StudentService(StudentRepository studentRepository) {
        this.studentRepository = studentRepository;
    }

    public List<Student> getStudentsBySchool(UUID tenantId, UUID schoolId) {
        return studentRepository.findByTenantIdAndSchoolId(tenantId, schoolId);
    }

    public List<Student> getStudentsByStandard(UUID tenantId, UUID standardId) {
        return studentRepository.findByTenantIdAndStandardId(tenantId, standardId);
    }

    public List<Student> getStudentsBySection(UUID tenantId, UUID standardId, UUID sectionId) {
        return studentRepository.findByTenantIdAndStandardIdAndSectionId(tenantId, standardId, sectionId);
    }

    public Student getStudentById(UUID tenantId, UUID studentId) {
        return studentRepository.findById(studentId)
                .filter(s -> s.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("Student not found."));
    }

    @Transactional
    public Student createStudent(UUID tenantId, UUID schoolId, Student student) {
        student.setTenantId(tenantId);
        student.setSchoolId(schoolId);

        if (studentRepository.existsByTenantIdAndSchoolIdAndAdmissionNumber(tenantId, schoolId, student.getAdmissionNumber())) {
            throw new ResourceAlreadyExistsException("Admission number '" + student.getAdmissionNumber() + "' is already enrolled in this school.");
        }

        if (studentRepository.existsByTenantIdAndStandardIdAndSectionIdAndRollNumber(
                tenantId, student.getStandardId(), student.getSectionId(), student.getRollNumber())) {
            throw new ResourceAlreadyExistsException("Roll number " + student.getRollNumber() + " already exists in this section.");
        }

        return studentRepository.save(student);
    }

    @Transactional
    public Student updateStudent(UUID tenantId, UUID studentId, Student incoming) {
        Student existing = getStudentById(tenantId, studentId);

        // Check roll number collision if changed
        if (!existing.getRollNumber().equals(incoming.getRollNumber()) ||
            !existing.getSectionId().equals(incoming.getSectionId())) {
            if (studentRepository.existsByTenantIdAndStandardIdAndSectionIdAndRollNumber(
                    tenantId, incoming.getStandardId(), incoming.getSectionId(), incoming.getRollNumber())) {
                throw new ResourceAlreadyExistsException("Roll number " + incoming.getRollNumber() + " already exists in this section.");
            }
        }

        existing.setFirstName(incoming.getFirstName());
        existing.setLastName(incoming.getLastName());
        existing.setDateOfBirth(incoming.getDateOfBirth());
        existing.setGender(incoming.getGender());
        existing.setBloodGroup(incoming.getBloodGroup());
        existing.setGuardianName(incoming.getGuardianName());
        existing.setGuardianRelationship(incoming.getGuardianRelationship());
        existing.setGuardianPhone(incoming.getGuardianPhone());
        existing.setGuardianEmail(incoming.getGuardianEmail());
        existing.setEmergencyContact(incoming.getEmergencyContact());
        existing.setAddress(incoming.getAddress());
        existing.setStatus(incoming.getStatus() != null ? incoming.getStatus() : existing.getStatus());
        existing.setStandardId(incoming.getStandardId());
        existing.setSectionId(incoming.getSectionId());
        existing.setRollNumber(incoming.getRollNumber());

        return studentRepository.save(existing);
    }

    @Transactional
    public void deleteStudent(UUID tenantId, UUID studentId) {
        Student student = getStudentById(tenantId, studentId);
        studentRepository.delete(student);
    }

    public List<Student> getSiblings(UUID tenantId, String guardianPhone) {
        return studentRepository.findByTenantIdAndGuardianPhone(tenantId, guardianPhone);
    }

    public List<Student> searchStudents(UUID tenantId, String query) {
        return studentRepository.searchStudents(tenantId, query);
    }

    /**
     * Bulk import students from CSV.
     * Expected CSV Columns:
     * RollNumber,AdmissionNumber,FirstName,LastName,DateOfBirth(YYYY-MM-DD),Gender(MALE/FEMALE/OTHER),GuardianName,GuardianPhone,GuardianEmail,Address
     */
    @Transactional
    public Map<String, Object> importStudentsCsv(UUID tenantId, UUID schoolId, UUID standardId,
                                                UUID sectionId, String csvContent) {
        List<String> errors = new ArrayList<>();
        List<Student> studentsToSave = new ArrayList<>();
        int rowNumber = 0;

        try (BufferedReader reader = new BufferedReader(new StringReader(csvContent))) {
            String line;
            while ((line = reader.readLine()) != null) {
                rowNumber++;
                line = line.trim();
                if (line.isEmpty()) continue;

                // Skip header row if detected
                if (rowNumber == 1 && line.toLowerCase().contains("rollnumber")) {
                    continue;
                }

                String[] cols = line.split(",", -1);
                if (cols.length < 8) {
                    errors.add("Row " + rowNumber + ": Invalid column count (expected at least 8 columns).");
                    continue;
                }

                try {
                    Integer rollNo = Integer.parseInt(cols[0].trim());
                    String admissionNo = cols[1].trim();
                    String firstName = cols[2].trim();
                    String lastName = cols[3].trim();
                    LocalDate dob = LocalDate.parse(cols[4].trim());
                    String gender = cols[5].trim().toUpperCase();
                    String guardianName = cols[6].trim();
                    String guardianPhone = cols[7].trim();
                    String guardianEmail = cols.length > 8 ? cols[8].trim() : null;
                    String address = cols.length > 9 ? cols[9].trim() : null;

                    if (admissionNo.isEmpty() || firstName.isEmpty() || guardianPhone.isEmpty()) {
                        errors.add("Row " + rowNumber + ": Missing required values.");
                        continue;
                    }

                    if (studentRepository.existsByTenantIdAndSchoolIdAndAdmissionNumber(tenantId, schoolId, admissionNo)) {
                        errors.add("Row " + rowNumber + ": Admission number '" + admissionNo + "' already exists.");
                        continue;
                    }

                    if (studentRepository.existsByTenantIdAndStandardIdAndSectionIdAndRollNumber(tenantId, standardId, sectionId, rollNo)) {
                        errors.add("Row " + rowNumber + ": Roll number " + rollNo + " already exists in this section.");
                        continue;
                    }

                    Student s = new Student();
                    s.setTenantId(tenantId);
                    s.setSchoolId(schoolId);
                    s.setStandardId(standardId);
                    s.setSectionId(sectionId);
                    s.setRollNumber(rollNo);
                    s.setAdmissionNumber(admissionNo);
                    s.setFirstName(firstName);
                    s.setLastName(lastName);
                    s.setDateOfBirth(dob);
                    s.setGender(gender);
                    s.setGuardianName(guardianName);
                    s.setGuardianRelationship("PARENT");
                    s.setGuardianPhone(guardianPhone);
                    s.setGuardianEmail(guardianEmail);
                    s.setAddress(address);
                    s.setStatus("ACTIVE");

                    studentsToSave.add(s);
                } catch (Exception ex) {
                    errors.add("Row " + rowNumber + ": " + ex.getMessage());
                }
            }
        } catch (Exception e) {
            errors.add("Failed to process CSV file: " + e.getMessage());
        }

        if (!studentsToSave.isEmpty()) {
            studentRepository.saveAll(studentsToSave);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("totalProcessed", rowNumber - 1);
        result.put("importedCount", studentsToSave.size());
        result.put("errors", errors);
        result.put("success", errors.isEmpty());
        return result;
    }
}
