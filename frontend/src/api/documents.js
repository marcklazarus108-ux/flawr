import client from "./client";

export const documentsApi = {
  list: () => client.get("/documents").then((r) => r.data.documents),
  create: (title) => client.post("/documents", { title }).then((r) => r.data.document),
  get: (id) => client.get(`/documents/${id}`).then((r) => r.data.document),
  rename: (id, title) => client.patch(`/documents/${id}`, { title }).then((r) => r.data.document),
  remove: (id) => client.delete(`/documents/${id}`),
};

export const aiApi = {
  chat: (message, documentText) =>
    client.post("/ai/chat", { message, documentText }).then((r) => r.data.reply),
  edit: (selectedText, instruction) =>
    client.post("/ai/edit", { selectedText, instruction }).then((r) => r.data.result),
  scan: (file) => {
    const form = new FormData();
    form.append("image", file);
    return client
      .post("/ai/scan", form, { headers: { "Content-Type": "multipart/form-data" } })
      .then((r) => r.data.text);
  },
};

// Exports return files as blobs, so we trigger a browser download directly.
async function downloadFile(path, body, filename) {
  const res = await client.post(path, body, { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export const exportApi = {
  docx: (title, html) => downloadFile("/export/docx", { title, html }, `${title}.docx`),
  markdown: (title, html) => downloadFile("/export/markdown", { title, html }, `${title}.md`),
  pdf: (title, plainText) => downloadFile("/export/pdf", { title, plainText }, `${title}.pdf`),
};
