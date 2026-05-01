package com.codsoft.pdfmixer.controller;

import com.fasterxml.jackson.databind.JsonMappingException;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler({IllegalArgumentException.class, JsonMappingException.class})
    public ResponseEntity<Map<String, String>> handleBadRequest(Exception exception) {
        return buildResponse(HttpStatus.BAD_REQUEST, exception.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleServerError(Exception exception) {
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to merge the selected pages.");
    }

    private ResponseEntity<Map<String, String>> buildResponse(HttpStatus status, String message) {
        Map<String, String> body = new LinkedHashMap<>();
        body.put("message", message == null || message.isBlank() ? "Request failed." : message);
        return ResponseEntity.status(status).body(body);
    }
}
