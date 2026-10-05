package com.schoolplatform.service;

import com.schoolplatform.entity.Standard;
import com.schoolplatform.entity.Subject;
import com.schoolplatform.entity.AcademicYear;
import com.schoolplatform.repository.StandardRepository;
import com.schoolplatform.repository.SubjectRepository;
import com.schoolplatform.repository.AcademicYearRepository;
import com.schoolplatform.exception.ResourceAlreadyExistsException;
import com.schoolplatform.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class AcademicEntityService {

    private final StandardRepository standardRepository;
    private final SubjectRepository subjectRepository;
    private final AcademicYearRepository academicYearRepository;

    public AcademicEntityService(StandardRepository standardRepository, SubjectRepository subjectRepository, AcademicYearRepository academicYearRepository) {
        this.standardRepository = standardRepository;
        this.subjectRepository = subjectRepository;
        this.academicYearRepository = academicYearRepository;
    }

    public List<Standard> getStandards(UUID tenantId, UUID schoolId) {
        return standardRepository.findByTenantIdAndSchoolIdOrderBySequenceAsc(tenantId, schoolId);
    }

    public Standard createStandard(UUID tenantId, UUID schoolId, Standard standard) {
        if (standardRepository.existsByTenantIdAndSchoolIdAndName(tenantId, schoolId, standard.getName())) {
            throw new ResourceAlreadyExistsException("Standard '" + standard.getName() + "' already exists in this school.");
        }

        standard.setTenantId(tenantId);
        standard.setSchoolId(schoolId);

        if (standard.getSequence() == null || standard.getSequence() <= 0) {
            Integer maxSeq = standardRepository.findByTenantIdAndSchoolIdOrderBySequenceAsc(tenantId, schoolId)
                    .stream()
                    .map(Standard::getSequence)
                    .max(Integer::compareTo)
                    .orElse(0);
            standard.setSequence(maxSeq + 1);
        }

        return standardRepository.save(standard);
    }

    public void deleteStandard(UUID tenantId, UUID schoolId, UUID standardId) {
        Standard standard = standardRepository.findById(standardId)
                .orElseThrow(() -> new ResourceNotFoundException("Standard not found."));
                
        if (!standard.getTenantId().equals(tenantId) || !standard.getSchoolId().equals(schoolId)) {
            throw new ResourceNotFoundException("Standard not found.");
        }
        
        standardRepository.delete(standard);
    }

    public List<Subject> getSubjects(UUID tenantId, UUID schoolId) {
        return subjectRepository.findByTenantIdAndSchoolId(tenantId, schoolId);
    }

    public Subject createSubject(UUID tenantId, UUID schoolId, Subject subject) {
        subject.setTenantId(tenantId);
        subject.setSchoolId(schoolId);
        return subjectRepository.save(subject);
    }

    public List<AcademicYear> getYears(UUID tenantId, UUID schoolId) {
        return academicYearRepository.findByTenantIdAndSchoolId(tenantId, schoolId);
    }

    public AcademicYear createYear(UUID tenantId, UUID schoolId, AcademicYear year) {
        year.setTenantId(tenantId);
        year.setSchoolId(schoolId);
        return academicYearRepository.save(year);
    }
}
