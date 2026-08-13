export async function readFileBase64(file: File) {
  if (file.size > 2_000_000) throw new Error("Choose a file that is 2 MB or smaller.");
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("The file could not be read."));
    reader.readAsDataURL(file);
  });
  return dataUrl.split(",")[1] ?? "";
}

export async function optimizeListingImage(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Choose a JPEG, PNG, or WebP image.");
  const source = await new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => { URL.revokeObjectURL(objectUrl); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("The image could not be prepared.")); };
    image.src = objectUrl;
  });
  const scale = Math.min(1, 1600 / Math.max(source.width, source.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(source.width * scale);
  canvas.height = Math.round(source.height * scale);
  canvas.getContext("2d")?.drawImage(source, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.84);
  const base64 = dataUrl.split(",")[1] ?? "";
  if (Math.ceil(base64.length * 0.75) > 2_000_000) throw new Error("The optimized image is still above 2 MB. Please choose a smaller photo.");
  return { filename: `${file.name.replace(/\.[^/.]+$/, "") || "listing"}.jpg`, contentType: "image/jpeg" as const, base64 };
}
