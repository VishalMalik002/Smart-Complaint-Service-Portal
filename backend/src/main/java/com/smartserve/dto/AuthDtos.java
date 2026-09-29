package com.smartserve.dto;
import jakarta.validation.constraints.*;
public final class AuthDtos { private AuthDtos(){}
 public record RegisterRequest(@NotBlank String name,@Email @NotBlank String email,@Size(min=6) String password,String phone,String address){}
 public record LoginRequest(@Email @NotBlank String email,@NotBlank String password){}
 public record AuthResponse(String token,Long userId,String name,String email,String role){}
}
