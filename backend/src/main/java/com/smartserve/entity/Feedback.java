package com.smartserve.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity @Table(name="feedback")
public class Feedback {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
    @OneToOne(optional=false) Complaint complaint;
    @ManyToOne(optional=false) User customer;
    @Column(nullable=false) Integer rating;
    String comment; LocalDateTime createdAt;
    @PrePersist void create(){createdAt=LocalDateTime.now();}
    public Feedback(){}
    public Long getId(){return id;} public void setId(Long v){id=v;}
    public Complaint getComplaint(){return complaint;} public void setComplaint(Complaint v){complaint=v;}
    public User getCustomer(){return customer;} public void setCustomer(User v){customer=v;}
    public Integer getRating(){return rating;} public void setRating(Integer v){rating=v;}
    public String getComment(){return comment;} public void setComment(String v){comment=v;}
    public LocalDateTime getCreatedAt(){return createdAt;} public void setCreatedAt(LocalDateTime v){createdAt=v;}
}
