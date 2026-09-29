package com.smartserve.entity;

import com.smartserve.enums.ComplaintStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity @Table(name="complaint_history")
public class ComplaintHistory {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
    @ManyToOne(optional=false) Complaint complaint;
    @Enumerated(EnumType.STRING) ComplaintStatus oldStatus;
    @Enumerated(EnumType.STRING) ComplaintStatus newStatus;
    String remarks;
    @ManyToOne User changedBy;
    LocalDateTime changedAt;
    @PrePersist void create(){changedAt=LocalDateTime.now();}
    public ComplaintHistory(){}
    public Long getId(){return id;} public void setId(Long v){id=v;}
    public Complaint getComplaint(){return complaint;} public void setComplaint(Complaint v){complaint=v;}
    public ComplaintStatus getOldStatus(){return oldStatus;} public void setOldStatus(ComplaintStatus v){oldStatus=v;}
    public ComplaintStatus getNewStatus(){return newStatus;} public void setNewStatus(ComplaintStatus v){newStatus=v;}
    public String getRemarks(){return remarks;} public void setRemarks(String v){remarks=v;}
    public User getChangedBy(){return changedBy;} public void setChangedBy(User v){changedBy=v;}
    public LocalDateTime getChangedAt(){return changedAt;} public void setChangedAt(LocalDateTime v){changedAt=v;}
}
