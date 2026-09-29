package com.smartserve.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity @Table(name="categories")
public class Category {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
    @Column(nullable=false,unique=true) String name;
    String description;
    boolean active=true;
    LocalDateTime createdAt;
    @PrePersist void create(){createdAt=LocalDateTime.now();}
    public Category(){}
    public Category(String n,String d){name=n;description=d;}
    public Long getId(){return id;} public void setId(Long v){id=v;}
    public String getName(){return name;} public void setName(String v){name=v;}
    public String getDescription(){return description;} public void setDescription(String v){description=v;}
    public boolean isActive(){return active;} public void setActive(boolean v){active=v;}
    public LocalDateTime getCreatedAt(){return createdAt;} public void setCreatedAt(LocalDateTime v){createdAt=v;}
}
