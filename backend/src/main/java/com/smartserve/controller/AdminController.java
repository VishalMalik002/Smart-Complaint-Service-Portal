package com.smartserve.controller;

import com.smartserve.entity.Category;
import com.smartserve.entity.Complaint;
import com.smartserve.entity.User;
import com.smartserve.enums.ComplaintStatus;
import com.smartserve.enums.Role;
import com.smartserve.enums.Priority;
import com.smartserve.dto.ComplaintDtos.PriorityRequest;
import jakarta.validation.Valid;
import com.smartserve.repository.CategoryRepository;
import com.smartserve.repository.ComplaintRepository;
import com.smartserve.repository.UserRepository;
import com.smartserve.repository.HistoryRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final ComplaintRepository complaints;
    private final UserRepository users;
    private final CategoryRepository categories;
    private final HistoryRepository history;

    public AdminController(ComplaintRepository c, UserRepository u, CategoryRepository cat, HistoryRepository h) {
        complaints = c; users = u; categories = cat; history = h;
    }

    @GetMapping("/complaints")
    public List<Complaint> complaints() { return complaints.findAll(); }

    @GetMapping("/users")
    public List<Map<String, Object>> users() {
        return users.findAll().stream().map(u -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", u.getId());
            row.put("name", u.getName());
            row.put("email", u.getEmail());
            row.put("phone", Objects.toString(u.getPhone(), ""));
            row.put("role", u.getRole().name());
            row.put("enabled", u.isEnabled());
            return row;
        }).toList();
    }

    @GetMapping("/staff")
    public List<Map<String, Object>> staff() {
        return users.findAll().stream().filter(u -> u.getRole() == Role.STAFF).map(u -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", u.getId());
            row.put("name", u.getName());
            row.put("email", u.getEmail());
            row.put("enabled", u.isEnabled());
            return row;
        }).toList();
    }

    @GetMapping("/categories")
    public List<Category> categories() { return categories.findAll(); }

    @PostMapping("/categories")
    public Category createCategory(@RequestBody Category category) {
        category.setId(null);
        if (category.getName() == null || category.getName().trim().isEmpty()) throw new IllegalArgumentException("Category name is required");
        category.setName(category.getName().trim());
        return categories.save(category);
    }

    @PutMapping("/categories/{id}")
    public Category updateCategory(@PathVariable Long id, @RequestBody Category request) {
        Category c = categories.findById(id).orElseThrow(() -> new IllegalArgumentException("Category not found"));
        if (request.getName() == null || request.getName().trim().isEmpty()) throw new IllegalArgumentException("Category name is required");
        c.setName(request.getName().trim()); c.setDescription(request.getDescription()); c.setActive(request.isActive());
        return categories.save(c);
    }

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard() {
        return Map.of(
                "totalComplaints", complaints.count(),
                "submitted", complaints.countByStatus(ComplaintStatus.SUBMITTED),
                "assigned", complaints.countByStatus(ComplaintStatus.ASSIGNED),
                "inProgress", complaints.countByStatus(ComplaintStatus.IN_PROGRESS),
                "resolved", complaints.countByStatus(ComplaintStatus.RESOLVED),
                "closed", complaints.countByStatus(ComplaintStatus.CLOSED),
                "reopened", complaints.countByStatus(ComplaintStatus.REOPENED),
                "users", users.count(),
                "staff", users.findAll().stream().filter(u -> u.getRole() == Role.STAFF).count()
        );
    }

    @PutMapping("/complaints/{id}/assign/{staffId}")
    public ResponseEntity<Complaint> assign(@PathVariable Long id, @PathVariable Long staffId, Authentication authentication) {
        Complaint c = complaints.findById(id).orElseThrow();
        User staff = users.findById(staffId).orElseThrow();
        User admin = users.findByEmail(authentication.getName()).orElseThrow(() -> new IllegalArgumentException("Admin user not found"));
        if (staff.getRole() != Role.STAFF || !staff.isEnabled()) {
            return ResponseEntity.badRequest().build();
        }
        if (c.getStatus() == ComplaintStatus.CLOSED || c.getStatus() == ComplaintStatus.REJECTED) {
            return ResponseEntity.badRequest().build();
        }
        ComplaintStatus old = c.getStatus();
        c.setStaff(staff);
        if (old == ComplaintStatus.SUBMITTED) c.setStatus(ComplaintStatus.ASSIGNED);
        Complaint saved = complaints.save(c);
        if (old != saved.getStatus() || c.getStaff().getId().equals(staff.getId())) {
            com.smartserve.entity.ComplaintHistory h = new com.smartserve.entity.ComplaintHistory();
            h.setComplaint(saved);
            h.setOldStatus(old);
            h.setNewStatus(saved.getStatus());
            h.setRemarks("Complaint assigned to " + staff.getName());
            h.setChangedBy(admin);
            history.save(h);
        }
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/complaints/{id}/status")
    public ResponseEntity<Complaint> status(@PathVariable Long id, @Valid @RequestBody com.smartserve.dto.ComplaintDtos.StatusRequest request, Authentication authentication) {
        User admin = users.findByEmail(authentication.getName()).orElseThrow(() -> new IllegalArgumentException("Admin user not found"));
        Complaint c = complaints.findById(id).orElseThrow(() -> new IllegalArgumentException("Complaint not found"));
        ComplaintStatus next = request.status();
        if (c.getStatus() == next) return ResponseEntity.badRequest().build();
        if (c.getStatus() == ComplaintStatus.REJECTED || c.getStatus() == ComplaintStatus.CLOSED) {
            if (!(c.getStatus() == ComplaintStatus.CLOSED && next == ComplaintStatus.REOPENED)) return ResponseEntity.badRequest().build();
        }
        if (!isAdminTransition(c.getStatus(), next)) return ResponseEntity.badRequest().build();
        ComplaintStatus old = c.getStatus(); c.setStatus(next); Complaint saved = complaints.save(c);
        com.smartserve.entity.ComplaintHistory h = new com.smartserve.entity.ComplaintHistory(); h.setComplaint(saved); h.setOldStatus(old); h.setNewStatus(next); h.setRemarks(request.remarks()); h.setChangedBy(admin); history.save(h);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/complaints/{id}/priority")
    public ResponseEntity<Complaint> priority(@PathVariable Long id, @Valid @RequestBody PriorityRequest request) {
        Complaint c = complaints.findById(id).orElseThrow(() -> new IllegalArgumentException("Complaint not found"));
        if (c.getStatus() == ComplaintStatus.CLOSED || c.getStatus() == ComplaintStatus.REJECTED) return ResponseEntity.badRequest().build();
        c.setPriority(request.priority()); return ResponseEntity.ok(complaints.save(c));
    }

    private boolean isAdminTransition(ComplaintStatus current, ComplaintStatus next) {
        return switch (current) {
            case SUBMITTED -> next == ComplaintStatus.ASSIGNED || next == ComplaintStatus.REJECTED;
            case ASSIGNED -> next == ComplaintStatus.IN_PROGRESS || next == ComplaintStatus.REJECTED;
            case IN_PROGRESS -> next == ComplaintStatus.RESOLVED;
            case RESOLVED -> next == ComplaintStatus.CLOSED || next == ComplaintStatus.REOPENED;
            case CLOSED -> next == ComplaintStatus.REOPENED;
            case REOPENED -> next == ComplaintStatus.IN_PROGRESS;
            case REJECTED -> false;
        };
    }

    @PutMapping("/users/{id}/status")
    public ResponseEntity<Map<String, Object>> userStatus(@PathVariable Long id, @RequestParam boolean enabled) {
        User u = users.findById(id).orElseThrow();
        if (u.getRole() == Role.ADMIN) return ResponseEntity.badRequest().body(Map.of("message", "Admin accounts cannot be disabled here"));
        u.setEnabled(enabled);
        users.save(u);
        return ResponseEntity.ok(Map.of("id", u.getId(), "enabled", u.isEnabled()));
    }
}
