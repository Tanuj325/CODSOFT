import { useEffect, useMemo, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

function formatBytes(bytes) {
  if (!bytes) {
    return '0 KB';
  }
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${sizes[index]}`;
}

async function renderPdfPreview(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 0.2 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport }).promise;
    pages.push({
      pageNumber,
      thumbnail: canvas.toDataURL('image/png'),
    });
  }

  return { pageCount: pdf.numPages, pages };
}

function App() {
  const fileInputRef = useRef(null);
  const [documents, setDocuments] = useState([]);
  const [sequence, setSequence] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [isMerging, setIsMerging] = useState(false);
  const [feedback, setFeedback] = useState({ type: 'idle', message: '' });

  const selectedCount = sequence.length;
  const totalPages = useMemo(
    () => documents.reduce((count, document) => count + (document.pageCount || 0), 0),
    [documents],
  );

  useEffect(() => () => {
    documents.forEach((document) => {
      document.pages?.forEach((page) => {
        if (page.thumbnail?.startsWith('blob:')) {
          URL.revokeObjectURL(page.thumbnail);
        }
      });
    });
  }, [documents]);

  const replaceDocument = (id, updater) => {
    setDocuments((current) => current.map((document) => (document.id === id ? updater(document) : document)));
  };

  const handleFileChange = async (event) => {
    const uploadedFiles = Array.from(event.target.files || []);
    if (uploadedFiles.length === 0) {
      return;
    }

    setFeedback({ type: 'idle', message: '' });

    const preparedDocuments = uploadedFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      name: file.name,
      size: file.size,
      pageCount: 0,
      pages: [],
      status: 'loading',
      error: '',
    }));

    setDocuments((current) => [...current, ...preparedDocuments]);

    for (const document of preparedDocuments) {
      try {
        const preview = await renderPdfPreview(document.file);
        replaceDocument(document.id, (currentDocument) => ({
          ...currentDocument,
          ...preview,
          status: 'ready',
          error: '',
        }));
      } catch (error) {
        replaceDocument(document.id, (currentDocument) => ({
          ...currentDocument,
          status: 'error',
          error: 'Could not read this PDF.',
        }));
      }
    }

    event.target.value = '';
  };

  const addPageToSequence = (document, page) => {
    const alreadyAdded = sequence.some(
      (item) => item.documentId === document.id && item.pageNumber === page.pageNumber,
    );
    if (alreadyAdded) {
      return;
    }

    setSequence((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        documentId: document.id,
        documentName: document.name,
        pageNumber: page.pageNumber,
        thumbnail: page.thumbnail,
      },
    ]);
  };

  const removeSequenceItem = (id) => {
    setSequence((current) => current.filter((item) => item.id !== id));
  };

  const moveSequenceItem = (index, direction) => {
    setSequence((current) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= current.length) {
        return current;
      }

      const next = [...current];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  const clearWorkspace = () => {
    setDocuments([]);
    setSequence([]);
    setFeedback({ type: 'idle', message: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleMerge = async () => {
    if (documents.length === 0) {
      setFeedback({ type: 'error', message: 'Upload at least one PDF first.' });
      return;
    }
    if (sequence.length === 0) {
      setFeedback({ type: 'error', message: 'Pick at least one page for the merge sequence.' });
      return;
    }

    const documentIndexById = new Map(documents.map((document, index) => [document.id, index]));
    const payloadSequence = sequence
      .map((item) => ({
        fileIndex: documentIndexById.get(item.documentId),
        pageNumber: item.pageNumber,
      }))
      .filter((item) => item.fileIndex !== undefined && item.fileIndex !== null);

    if (payloadSequence.length === 0) {
      setFeedback({ type: 'error', message: 'The selected pages could not be mapped to uploaded files.' });
      return;
    }

    const formData = new FormData();
    documents.forEach((document) => formData.append('files', document.file, document.name));
    formData.append('sequence', JSON.stringify({ sequence: payloadSequence }));

    try {
      setIsMerging(true);
      setFeedback({ type: 'idle', message: '' });

      const response = await fetch(`${API_BASE_URL}/pdf/merge`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.message || 'Merge failed.');
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.toLowerCase().includes('application/pdf')) {
        throw new Error('The merge completed, but the server did not return a PDF file.');
      }

      const mergedBlob = await response.blob();
      const downloadUrl = URL.createObjectURL(mergedBlob);
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = 'merged-pages.pdf';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);

      setFeedback({ type: 'success', message: 'Merged PDF is ready and downloading now.' });
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Something went wrong while merging.' });
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <main className="app-shell">
      <div className="orb orb-a" />
      <div className="orb orb-b" />
      <header className="hero">
        <div className="hero-copy">
          <span className="eyebrow">PDF page mixer</span>
          <h1>Merge pages from different PDFs in any order.</h1>
          <p>
            Upload one or many PDFs, pick only the pages you want, and arrange the final sequence before
            downloading a clean merged document.
          </p>
          <div className="hero-stats">
            <div>
              <strong>{documents.length}</strong>
              <span>PDFs uploaded</span>
            </div>
            <div>
              <strong>{totalPages}</strong>
              <span>Pages loaded</span>
            </div>
            <div>
              <strong>{selectedCount}</strong>
              <span>Pages selected</span>
            </div>
          </div>
        </div>

        <section className="hero-panel upload-panel">
          <div className="panel-topline">
            <span>Step 1</span>
            <span>Upload PDFs</span>
          </div>
          <h2>Start with a few files.</h2>
          <p>
            Drag and drop or browse your device. Each page will be previewed so you can build the exact
            merge order you need.
          </p>
          <div className="upload-actions">
            <button className="primary-button" onClick={() => fileInputRef.current?.click()}>
              Choose PDFs
            </button>
            <button className="secondary-button" onClick={clearWorkspace}>
              Reset workspace
            </button>
          </div>
          <input
            ref={fileInputRef}
            className="hidden-input"
            type="file"
            accept="application/pdf"
            multiple
            onChange={handleFileChange}
          />
          <label className="drop-zone" onClick={() => fileInputRef.current?.click()}>
            <strong>Drop PDFs here</strong>
            <span>or click to browse</span>
          </label>
        </section>
      </header>

      {feedback.message ? (
        <div className={`feedback ${feedback.type}`}>
          {feedback.message}
        </div>
      ) : null}

      <section className="workspace-grid">
        <div className="stack-column">
          <div className="section-header">
            <div>
              <span className="eyebrow">Step 2</span>
              <h2>Choose pages from each PDF</h2>
            </div>
            <span className="section-badge">{documents.length} files</span>
          </div>

          {documents.length === 0 ? (
            <div className="empty-state">
              <h3>No PDFs loaded yet</h3>
              <p>Upload files to reveal page previews and start building your custom sequence.</p>
            </div>
          ) : null}

          <div className="document-list">
            {documents.map((document) => (
              <article className="document-card" key={document.id}>
                <div className="document-card-header">
                  <div>
                    <h3>{document.name}</h3>
                    <p>
                      {formatBytes(document.size)} {document.pageCount ? `• ${document.pageCount} pages` : ''}
                    </p>
                  </div>
                  <button
                    className="ghost-button"
                    onClick={() => {
                      setSequence((current) => current.filter((item) => item.documentId !== document.id));
                      setDocuments((current) => current.filter((item) => item.id !== document.id));
                    }}
                  >
                    Remove file
                  </button>
                </div>

                {document.status === 'loading' ? <div className="loading-strip">Loading previews...</div> : null}
                {document.status === 'error' ? <div className="error-strip">{document.error}</div> : null}

                {document.pages.length > 0 ? (
                  <div className="page-grid">
                    {document.pages.map((page) => {
                      const selected = sequence.some(
                        (item) => item.documentId === document.id && item.pageNumber === page.pageNumber,
                      );

                      return (
                        <button
                          type="button"
                          className={`page-card ${selected ? 'selected' : ''}`}
                          key={`${document.id}-${page.pageNumber}`}
                          onClick={() => addPageToSequence(document, page)}
                        >
                          <img src={page.thumbnail} alt={`Preview of ${document.name} page ${page.pageNumber}`} />
                          <span>Page {page.pageNumber}</span>
                          <small>{selected ? 'Added to sequence' : 'Tap to add'}</small>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </div>

        <aside className="stack-column sticky-panel">
          <div className="section-header">
            <div>
              <span className="eyebrow">Step 3</span>
              <h2>Arrange the final order</h2>
            </div>
            <span className="section-badge">{selectedCount} selected</span>
          </div>

          <div className="sequence-panel">
            {sequence.length === 0 ? (
              <div className="empty-state compact">
                <h3>Your sequence is empty</h3>
                <p>Tap page previews to add them here, then reorder before merging.</p>
              </div>
            ) : (
              <div className="sequence-list">
                {sequence.map((item, index) => (
                  <div
                    className={`sequence-item ${draggedIndex === index ? 'dragging' : ''}`}
                    key={item.id}
                    draggable
                    onDragStart={() => setDraggedIndex(index)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      if (draggedIndex === null || draggedIndex === index) {
                        return;
                      }
                      setSequence((current) => {
                        const next = [...current];
                        const [moved] = next.splice(draggedIndex, 1);
                        next.splice(index, 0, moved);
                        return next;
                      });
                      setDraggedIndex(null);
                    }}
                    onDragEnd={() => setDraggedIndex(null)}
                  >
                    <div className="sequence-preview">
                      <img src={item.thumbnail} alt={`${item.documentName} page ${item.pageNumber}`} />
                    </div>
                    <div className="sequence-meta">
                      <strong>{item.documentName}</strong>
                      <span>Page {item.pageNumber}</span>
                    </div>
                    <div className="sequence-actions">
                      <button className="micro-button" onClick={() => moveSequenceItem(index, -1)}>
                        ↑
                      </button>
                      <button className="micro-button" onClick={() => moveSequenceItem(index, 1)}>
                        ↓
                      </button>
                      <button className="micro-button danger" onClick={() => removeSequenceItem(item.id)}>
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button className="primary-button merge-button" onClick={handleMerge} disabled={isMerging}>
              {isMerging ? 'Merging...' : 'Merge and Download'}
            </button>
          </div>
        </aside>
      </section>
    </main>
  );
}

export default App;
