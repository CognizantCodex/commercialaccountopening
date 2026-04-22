package com.example.risk.exception;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> handleValidation(MethodArgumentNotValidException ex) {
        return error("VALIDATION_ERROR", ex.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Map<String, Object> handleNotFound(IllegalArgumentException ex) {
        return error("NOT_FOUND", ex.getMessage());
    }

    private Map<String, Object> error(String code, String message) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("timestamp", OffsetDateTime.now().toString());
        payload.put("code", code);
        payload.put("message", message);
        return payload;
    }
}
