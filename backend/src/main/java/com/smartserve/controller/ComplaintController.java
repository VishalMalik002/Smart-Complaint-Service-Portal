package com.smartserve.controller;

import com.smartserve.dto.ComplaintDtos.*;
import com.smartserve.entity.*;
import com.smartserve.repository.UserRepository;
import com.smartserve.service.ComplaintService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import com.smartserve.enums.Role;

@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {
    private final ComplaintService service;
    private final UserRepository users;

    public ComplaintController(ComplaintService service, UserRepository users) {
        this.service = service;
        this.users = users;
    }

    private User me(Authentication authentication) {
        return users.findByEmail(authentication.getName()).orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    @PostMapping
    public Complaint create(@Valid @RequestBody CreateRequest request, Authentication authentication) {
        User user = me(authentication);
        if (user.getRole() != Role.CUSTOMER) throw new SecurityException("Only customers can create complaints");
        return service.create(request, user);
    }

    @GetMapping("/my")
    public List<Complaint> mine(Authentication authentication) {
        User user = me(authentication);
        if (user.getRole() != Role.CUSTOMER) throw new SecurityException("Only customers can access their complaint list");
        return service.mine(user);
    }

    @GetMapping("/{id}")
    public Complaint get(@PathVariable Long id, Authentication authentication) {
        return service.getFor(me(authentication), id);
    }

    @GetMapping("/{id}/history")
    public List<ComplaintHistory> history(@PathVariable Long id, Authentication authentication) {
        service.getFor(me(authentication), id);
        return service.timeline(id);
    }

    @GetMapping("/{id}/comments")
    public List<Comment> comments(@PathVariable Long id, Authentication authentication) {
        service.getFor(me(authentication), id);
        return service.comments(id);
    }

    @PostMapping("/{id}/comments")
    public Comment comment(@PathVariable Long id, @Valid @RequestBody CommentRequest request, Authentication authentication) {
        return service.addComment(id, request.message(), me(authentication));
    }

    @PostMapping("/{id}/feedback")
    public Feedback feedback(@PathVariable Long id, @Valid @RequestBody FeedbackRequest request, Authentication authentication) {
        return service.addFeedback(id, request, me(authentication));
    }

    @PostMapping("/{id}/reopen")
    public Complaint reopen(@PathVariable Long id, Authentication authentication) {
        User user = me(authentication);
        if (user.getRole() != Role.CUSTOMER) throw new SecurityException("Only customers can reopen complaints");
        return service.updateStatus(id, new StatusRequest(com.smartserve.enums.ComplaintStatus.REOPENED, "Customer reopened complaint"), user);
    }
}
