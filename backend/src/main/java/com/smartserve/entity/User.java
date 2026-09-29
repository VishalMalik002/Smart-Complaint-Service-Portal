package com.smartserve.entity;

import com.smartserve.enums.Role;
import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable=false) private String name;
    @Column(nullable=false, unique=true) private String email;
    @JsonIgnore
    @Column(nullable=false) private String password;
    private String phone;
    private String address;
    private boolean enabled = true;
    @Enumerated(EnumType.STRING) @Column(nullable=false) private Role role = Role.CUSTOMER;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    @PrePersist void create(){ createdAt=LocalDateTime.now(); updatedAt=createdAt; }
    @PreUpdate void update(){ updatedAt=LocalDateTime.now(); }
    public User() {}
    public Long getId(){return id;} public void setId(Long id){this.id=id;}
    public String getName(){return name;} public void setName(String v){name=v;}
    public String getEmail(){return email;} public void setEmail(String v){email=v;}
    public String getPassword(){return password;} public void setPassword(String v){password=v;}
    public String getPhone(){return phone;} public void setPhone(String v){phone=v;}
    public String getAddress(){return address;} public void setAddress(String v){address=v;}
    public boolean isEnabled(){return enabled;} public void setEnabled(boolean v){enabled=v;}
    public Role getRole(){return role;} public void setRole(Role v){role=v;}
    public LocalDateTime getCreatedAt(){return createdAt;} public void setCreatedAt(LocalDateTime v){createdAt=v;}
    public LocalDateTime getUpdatedAt(){return updatedAt;} public void setUpdatedAt(LocalDateTime v){updatedAt=v;}
}
