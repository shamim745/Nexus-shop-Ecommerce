import { http } from "./httpClient";

const uploadHttpService = {
  uploadImage: (formData: FormData) =>
    http.upload<{ url: string }>("/uploads", formData),
};

export default uploadHttpService;
