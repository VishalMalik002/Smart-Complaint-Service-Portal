package com.smartserve.service;

import com.smartserve.dto.ComplaintDtos.*;
import com.smartserve.entity.*;
import com.smartserve.enums.*;
import com.smartserve.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class ComplaintService {
    private final ComplaintRepository complaints;
    private final CategoryRepository categories;
    private final HistoryRepository history;
    private final CommentRepository comments;
    private final FeedbackRepository feedback;

    public ComplaintService(ComplaintRepository complaints, CategoryRepository categories,
                            HistoryRepository history, CommentRepository comments, FeedbackRepository feedback) {
        this.complaints = complaints;
        this.categories = categories;
        this.history = history;
        this.comments = comments;
        this.feedback = feedback;
    }

    public List<Complaint> mine(User customer) {
        return complaints.findByCustomerOrderByCreatedAtDesc(customer);
    }

    public List<Complaint> assigned(User staff) {
        return complaints.findByStaffOrderByUpdatedAtDesc(staff);
    }

    @Transactional
    public Complaint create(CreateRequest r, User customer) {
        Complaint c = new Complaint();
        c.setComplaintNumber(nextComplaintNumber());
        c.setTitle(r.title().trim());
        c.setDescription(r.description().trim());
        c.setPriority(r.priority() == null ? Priority.MEDIUM : r.priority());
        c.setLocation(r.location());
        c.setAttachmentUrl(r.attachmentUrl());
        c.setCustomer(customer);
        if (r.categoryId() != null) {
            c.setCategory(categories.findById(r.categoryId())
                    .orElseThrow(() -> new IllegalArgumentException("Category not found")));
        }
        Complaint saved = complaints.save(c);
        addHistory(saved, null, ComplaintStatus.SUBMITTED, "Complaint submitted", customer);
        return saved;
    }

    @Transactional
    public Complaint updateStatus(Long id, StatusRequest request, User actor) {
        Complaint c = get(id);
        ComplaintStatus next = request.status();

        if (actor.getRole() == Role.ADMIN) {
            // Admin transitions are handled through the dedicated admin endpoint.
            throw new SecurityException("Use the admin complaint controls for administrator updates");
        }
        if (actor.getRole() == Role.STAFF && !sameUser(actor, c.getStaff())) {
            throw new SecurityException("You can update only complaints assigned to you");
        }
        if (actor.getRole() == Role.CUSTOMER && !sameUser(actor, c.getCustomer())) {
            throw new SecurityException("You can update only your own complaint");
        }
        if (actor.getRole() == Role.CUSTOMER && next != ComplaintStatus.REOPENED) {
            throw new SecurityException("Customers can only reopen complaints");
        }
        if (actor.getRole() == Role.CUSTOMER &&
                c.getStatus() != ComplaintStatus.RESOLVED && c.getStatus() != ComplaintStatus.CLOSED) {
            throw new IllegalStateException("Only resolved or closed complaints can be reopened");
        }
        if (!isValidTransition(c.getStatus(), next)) {
            throw new IllegalStateException("Invalid status transition: " + c.getStatus() + " -> " + next);
        }

        ComplaintStatus old = c.getStatus();
        c.setStatus(next);
        Complaint saved = complaints.save(c);
        addHistory(saved, old, next, request.remarks(), actor);
        return saved;
    }

    public Complaint get(Long id) {
        return complaints.findById(id).orElseThrow(() -> new IllegalArgumentException("Complaint not found"));
    }

    public Complaint getFor(User actor, Long id) {
        Complaint c = get(id);
        if (actor.getRole() == Role.ADMIN || sameUser(actor, c.getCustomer()) || sameUser(actor, c.getStaff())) {
            return c;
        }
        throw new SecurityException("You are not allowed to access this complaint");
    }

    public List<ComplaintHistory> timeline(Long id) {
        return history.findByComplaintOrderByChangedAtAsc(get(id));
    }

    public List<Comment> comments(Long id) {
        return comments.findByComplaintOrderByCreatedAtAsc(get(id));
    }

    public Comment addComment(Long id, String message, User user) {
        Complaint c = getFor(user, id);
        Comment comment = new Comment();
        comment.setComplaint(c);
        comment.setMessage(message.trim());
        comment.setUser(user);
        return comments.save(comment);
    }

    public Feedback addFeedback(Long id, FeedbackRequest r, User user) {
        Complaint c = get(id);
        if (!sameUser(user, c.getCustomer())) {
            throw new SecurityException("Only the complaint owner can submit feedback");
        }
        if (c.getStatus() != ComplaintStatus.RESOLVED && c.getStatus() != ComplaintStatus.CLOSED) {
            throw new IllegalStateException("Feedback can be submitted after resolution");
        }
        if (feedback.existsByComplaint(c)) {
            throw new IllegalArgumentException("Feedback already submitted");
        }
        Feedback f = new Feedback();
        f.setComplaint(c);
        f.setCustomer(user);
        f.setRating(r.rating());
        f.setComment(r.comment());
        return feedback.save(f);
    }

    private boolean sameUser(User a, User b) {
        return a != null && b != null && a.getId() != null && a.getId().equals(b.getId());
    }

    private void addHistory(Complaint complaint, ComplaintStatus oldStatus, ComplaintStatus newStatus, String remarks, User actor) {
        ComplaintHistory h = new ComplaintHistory();
        h.setComplaint(complaint);
        h.setOldStatus(oldStatus);
        h.setNewStatus(newStatus);
        h.setRemarks(remarks);
        h.setChangedBy(actor);
        history.save(h);
    }

    private String nextComplaintNumber() {
        for (int i = 0; i < 20; i++) {
            String number = "CMP-" + ThreadLocalRandom.current().nextInt(1000, 10000);
            if (complaints.findByComplaintNumber(number).isEmpty()) return number;
        }
        throw new IllegalStateException("Could not generate a unique complaint number");
    }

    private boolean isValidTransition(ComplaintStatus current, ComplaintStatus next) {
        if (current == next) return false;
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
}
