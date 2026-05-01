package com.codsoft.pdfmixer.controller;

import com.codsoft.pdfmixer.dto.MergeRequest;
import com.codsoft.pdfmixer.service.PdfMergeService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/pdf")
public class PdfMergeController {

    private final PdfMergeService pdfMergeService;
    private final ObjectMapper objectMapper;

    public PdfMergeController(PdfMergeService pdfMergeService, ObjectMapper objectMapper) {
        this.pdfMergeService = pdfMergeService;
        this.objectMapper = objectMapper;
    }

    @PostMapping(value = "/merge", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<byte[]> merge(
        @RequestPart("files") List<MultipartFile> files,
        @RequestPart("sequence") String sequenceJson
    ) throws IOException {
        MergeRequest request = objectMapper.readValue(sequenceJson, MergeRequest.class);
        byte[] mergedPdf = pdfMergeService.merge(files, request.sequence());

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=merged-pages.pdf")
            .contentType(MediaType.APPLICATION_PDF)
            .body(mergedPdf);
    }
}
