package com.smartserve.dto;
import com.smartserve.enums.*; import jakarta.validation.constraints.*;
public final class ComplaintDtos { private ComplaintDtos(){}
 public record CreateRequest(@NotBlank @Size(max=200) String title,@NotBlank @Size(max=4000) String description,Long categoryId,Priority priority,@Size(max=500) String location,@Size(max=1000) String attachmentUrl){}
 public record StatusRequest(@NotNull ComplaintStatus status,String remarks){}
 public record CommentRequest(@NotBlank @Size(max=2000) String message){}
 public record FeedbackRequest(@Min(1) @Max(5) Integer rating,@Size(max=2000) String comment){}
 public record PriorityRequest(@NotNull Priority priority){}
}
