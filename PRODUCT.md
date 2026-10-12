# InkSage product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Students organizing course PDFs and asking questions while studying.

## Product Purpose

Make a subject, add text based PDFs to it, then ask questions grounded in only that subject's PDFs with file and page references.

## Operating Context

The current version runs locally without login or a database. Subjects and PDFs persist on the computer; chat history persists in the browser. Groq generates answers when a key is configured; otherwise the app shows matching passages.

## Capabilities and Constraints

PDF upload is limited to 20 MB and 300 pages per file. Image-only PDFs are processed with locally installed Tesseract OCR. The landing page opens on each visit; entering the workspace resumes the saved subjects. The core study sequence remains subject → PDFs → selected-subject chat.

## Brand Commitments

The product name is InkSage. Product copy must not imply accounts, cloud synchronization, cloud OCR, or guaranteed answer accuracy. OCR runs locally when Tesseract is installed.

## Product Principles

- The selected subject defines the source boundary for every question.
- Show the PDF, page, and highlighted supporting passage used for an answer.
- Let each subject contain multiple locally saved chat threads.
- Keep the first step clear and the workspace usable on desktop and mobile.
