package com.smartserve.controller;

import com.smartserve.dto.ComplaintDtos.StatusRequest;
import com.smartserve.entity.Complaint;
import com.smartserve.entity.User;
import com.smartserve.enums.ComplaintStatus;
import com.smartserve.repository.UserRepository;
import com.smartserve.service.ComplaintService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/staff")
public class StaffController {
    private final ComplaintService service;
    private final UserRepository users;

    public StaffController(ComplaintService service, UserRepository users) {
        this.service = service;
        this.users = users;
    }

    private User me(Authentication authentication) {
        return users.findByEmail(authentication.getName()).orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    @GetMapping("/complaints")
    public List<Complaint> assigned(Authentication authentication) {
        return service.assigned(me(authentication));
    }

    @PutMapping("/complaints/{id}/status")
    public Complaint status(@PathVariable Long id, @Valid @RequestBody StatusRequest request, Authentication authentication) {
        return service.updateStatus(id, request, me(authentication));
    }

    @PutMapping("/complaints/{id}/resolve")
    public Complaint resolve(@PathVariable Long id, Authentication authentication) {
        return service.updateStatus(id, new StatusRequest(ComplaintStatus.RESOLVED, "Resolved by support agent"), me(authentication));
    }
}
