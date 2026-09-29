package com.smartserve.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity @Table(name="comments")
public class Comment {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
    @ManyToOne(optional=false) Complaint complaint;
    @ManyToOne(optional=false) User user;
    @Column(nullable=false,length=2000) String message;
    LocalDateTime createdAt;
    @PrePersist void create(){createdAt=LocalDateTime.now();}
    public Comment(){}
    public Long getId(){return id;} public void setId(Long v){id=v;}
    public Complaint getComplaint(){return complaint;} public void setComplaint(Complaint v){complaint=v;}
    public User getUser(){return user;} public void setUser(User v){user=v;}
    public String getMessage(){return message;} public void setMessage(String v){message=v;}
    public LocalDateTime getCreatedAt(){return createdAt;} public void setCreatedAt(LocalDateTime v){createdAt=v;}
}
