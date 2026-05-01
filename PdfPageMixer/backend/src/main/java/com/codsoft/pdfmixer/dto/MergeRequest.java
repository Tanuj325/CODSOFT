package com.codsoft.pdfmixer.dto;

import java.util.List;

public record MergeRequest(List<PageSelection> sequence) {
}
