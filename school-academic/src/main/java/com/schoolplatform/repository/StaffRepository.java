package com.schoolplatform.repository;

import com.schoolplatform.entity.Staff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StaffRepository extends JpaRepository<Staff, UUID> {

    List<Staff> findByTenantIdAndSchoolId(UUID tenantId, UUID schoolId);

    Optional<Staff> findByTenantIdAndEmployeeId(UUID tenantId, String employeeId);

    boolean existsByTenantIdAndSchoolIdAndEmployeeId(UUID tenantId, UUID schoolId, String employeeId);
}
