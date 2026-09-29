package com.smartserve.entity;

import com.smartserve.enums.*;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity @Table(name="complaints")
public class Complaint {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
    @Column(nullable=false,unique=true) String complaintNumber;
    @Column(nullable=false) String title;
    @Column(nullable=false,length=4000) String description;
    @Enumerated(EnumType.STRING) Priority priority=Priority.MEDIUM;
    @Enumerated(EnumType.STRING) ComplaintStatus status=ComplaintStatus.SUBMITTED;
    String location; String attachmentUrl; LocalDateTime createdAt; LocalDateTime updatedAt;
    @ManyToOne(optional=false) User customer;
    @ManyToOne Category category;
    @ManyToOne User staff;
    @PrePersist void create(){createdAt=LocalDateTime.now();updatedAt=createdAt;}
    @PreUpdate void update(){updatedAt=LocalDateTime.now();}
    public Complaint(){}
    public Long getId(){return id;} public void setId(Long v){id=v;}
    public String getComplaintNumber(){return complaintNumber;} public void setComplaintNumber(String v){complaintNumber=v;}
    public String getTitle(){return title;} public void setTitle(String v){title=v;}
    public String getDescription(){return description;} public void setDescription(String v){description=v;}
    public Priority getPriority(){return priority;} public void setPriority(Priority v){priority=v;}
    public ComplaintStatus getStatus(){return status;} public void setStatus(ComplaintStatus v){status=v;}
    public String getLocation(){return location;} public void setLocation(String v){location=v;}
    public String getAttachmentUrl(){return attachmentUrl;} public void setAttachmentUrl(String v){attachmentUrl=v;}
    public LocalDateTime getCreatedAt(){return createdAt;} public void setCreatedAt(LocalDateTime v){createdAt=v;}
    public LocalDateTime getUpdatedAt(){return updatedAt;} public void setUpdatedAt(LocalDateTime v){updatedAt=v;}
    public User getCustomer(){return customer;} public void setCustomer(User v){customer=v;}
    public Category getCategory(){return category;} public void setCategory(Category v){category=v;}
    public User getStaff(){return staff;} public void setStaff(User v){staff=v;}
}
