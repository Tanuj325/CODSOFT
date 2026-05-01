# Pdf Page Mixer

A full-stack PDF merging website that lets users upload multiple PDFs, pick individual pages from each file, and arrange those pages into a custom merge sequence before downloading the final PDF.

## Stack

- Backend: Java 17 + Spring Boot + PDFBox
- Frontend: React + Vite

## Run locally

### Backend

```bash
cd PdfPageMixer/backend
mvn spring-boot:run
```

### Frontend

```bash
cd PdfPageMixer/frontend
npm install
npm run dev
```

The frontend proxies API requests to `http://localhost:8080` during development.

## Deploy

### Backend on Render

1. Create a new Web Service from the `PdfPageMixer/backend` folder.
2. Use `Java` as the runtime.
3. Set the build command to `mvn -DskipTests package`.
4. Set the start command to `java -jar target/*.jar`.
5. Add an environment variable named `app.frontend-origin` with your Vercel URL, for example `https://your-app.vercel.app`.

### Frontend on Vercel

1. Import the `PdfPageMixer/frontend` folder as a Vercel project.
2. Add an environment variable named `VITE_API_BASE_URL` with your Render backend URL, for example `https://your-backend.onrender.com/api`.
3. Deploy with the default Vite build command `npm run build`.

After both deployments finish, open the Vercel URL and the app will call the Render backend for PDF merging.
