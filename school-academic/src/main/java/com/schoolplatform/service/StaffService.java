package com.schoolplatform.service;

import com.schoolplatform.entity.Staff;
import com.schoolplatform.entity.TeacherAssignment;
import com.schoolplatform.exception.ResourceAlreadyExistsException;
import com.schoolplatform.exception.ResourceNotFoundException;
import com.schoolplatform.repository.StaffRepository;
import com.schoolplatform.repository.TeacherAssignmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class StaffService {

    private final StaffRepository staffRepository;
    private final TeacherAssignmentRepository assignmentRepository;

    public StaffService(StaffRepository staffRepository, TeacherAssignmentRepository assignmentRepository) {
        this.staffRepository = staffRepository;
        this.assignmentRepository = assignmentRepository;
    }

    public List<Staff> getStaffBySchool(UUID tenantId, UUID schoolId) {
        return staffRepository.findByTenantIdAndSchoolId(tenantId, schoolId);
    }

    public Staff getStaffById(UUID tenantId, UUID staffId) {
        return staffRepository.findById(staffId)
                .filter(s -> s.getTenantId().equals(tenantId))
                .orElseThrow(() -> new ResourceNotFoundException("Staff member not found."));
    }

    @Transactional
    public Staff createStaff(UUID tenantId, UUID schoolId, Staff staff) {
        staff.setTenantId(tenantId);
        staff.setSchoolId(schoolId);

        if (staffRepository.existsByTenantIdAndSchoolIdAndEmployeeId(tenantId, schoolId, staff.getEmployeeId())) {
            throw new ResourceAlreadyExistsException("Employee ID '" + staff.getEmployeeId() + "' is already registered.");
        }

        return staffRepository.save(staff);
    }

    @Transactional
    public TeacherAssignment assignClassTeacher(UUID tenantId, UUID schoolId, UUID standardId,
                                                UUID sectionId, UUID staffId, UUID academicYearId) {
        // Ensure staff exists
        getStaffById(tenantId, staffId);

        // Remove existing class teacher for this section if any
        Optional<TeacherAssignment> existing = assignmentRepository
                .findByTenantIdAndStandardIdAndSectionIdAndIsClassTeacherTrue(tenantId, standardId, sectionId);
        existing.ifPresent(assignmentRepository::delete);

        TeacherAssignment assignment = new TeacherAssignment();
        assignment.setTenantId(tenantId);
        assignment.setSchoolId(schoolId);
        assignment.setStandardId(standardId);
        assignment.setSectionId(sectionId);
        assignment.setStaffId(staffId);
        assignment.setIsClassTeacher(true);
        assignment.setAcademicYearId(academicYearId);

        return assignmentRepository.save(assignment);
    }

    @Transactional
    public TeacherAssignment assignSubjectTeacher(UUID tenantId, UUID schoolId, UUID standardId,
                                                  UUID sectionId, UUID subjectId, UUID staffId, UUID academicYearId) {
        getStaffById(tenantId, staffId);

        assignmentRepository.deleteByTenantIdAndStandardIdAndSectionIdAndSubjectId(tenantId, standardId, sectionId, subjectId);

        TeacherAssignment assignment = new TeacherAssignment();
        assignment.setTenantId(tenantId);
        assignment.setSchoolId(schoolId);
        assignment.setStandardId(standardId);
        assignment.setSectionId(sectionId);
        assignment.setSubjectId(subjectId);
        assignment.setStaffId(staffId);
        assignment.setIsClassTeacher(false);
        assignment.setAcademicYearId(academicYearId);

        return assignmentRepository.save(assignment);
    }

    public List<TeacherAssignment> getSectionAssignments(UUID tenantId, UUID standardId, UUID sectionId) {
        return assignmentRepository.findByTenantIdAndStandardIdAndSectionId(tenantId, standardId, sectionId);
    }

    public List<TeacherAssignment> getTeacherAssignments(UUID tenantId, UUID staffId) {
        return assignmentRepository.findByTenantIdAndStaffId(tenantId, staffId);
    }
}
