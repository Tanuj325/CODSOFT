package com.codsoft.pdfmixer.service;

import com.codsoft.pdfmixer.dto.PageSelection;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.apache.pdfbox.multipdf.PDFMergerUtility;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class PdfMergeService {

    public byte[] merge(List<MultipartFile> files, List<PageSelection> sequence) throws IOException {
        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("Upload at least one PDF file.");
        }
        if (sequence == null || sequence.isEmpty()) {
            throw new IllegalArgumentException("Select at least one page to merge.");
        }

        Map<Integer, PDDocument> documentsByIndex = new HashMap<>();
        try (PDDocument outputDocument = new PDDocument(); ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            for (int i = 0; i < files.size(); i++) {
                MultipartFile file = files.get(i);
                try (InputStream inputStream = file.getInputStream()) {
                    documentsByIndex.put(i, PDDocument.load(inputStream));
                }
            }

            for (PageSelection selection : sequence) {
                if (selection == null) {
                    continue;
                }
                PDDocument sourceDocument = documentsByIndex.get(selection.fileIndex());
                if (sourceDocument == null) {
                    throw new IllegalArgumentException("One or more selected pages refer to an unavailable PDF.");
                }
                int pageNumber = selection.pageNumber();
                if (pageNumber < 1 || pageNumber > sourceDocument.getNumberOfPages()) {
                    throw new IllegalArgumentException("Page number " + pageNumber + " is out of range for a selected PDF.");
                }
                outputDocument.importPage(sourceDocument.getPage(pageNumber - 1));
            }

            outputDocument.save(outputStream);
            return outputStream.toByteArray();
        } finally {
            for (PDDocument document : documentsByIndex.values()) {
                if (document != null) {
                    document.close();
                }
            }
        }
    }
}
