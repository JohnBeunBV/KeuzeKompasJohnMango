import mongoose from "mongoose";
import { Vkm } from "../../domain/models/vkm.model";

export type VkmDocument = Vkm & mongoose.Document;

const VkmSchema = new mongoose.Schema<VkmDocument>({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  shortdescription: { type: String, required: true },
  description: { type: String, required: true },
  content: { type: String, required: true },
  studycredit: { type: Number, required: true },
  location: { type: String, required: true },
  contact_id: { type: Number, required: true },
  level: { type: String, required: true },
  learningoutcomes: { type: String, required: true },
  Rood: { type: Number, required: true },
  Groen: { type: Number, required: true },
  Blauw: { type: Number, required: true },
  Geel: { type: Number, required: true },
  module_tags: { type: String, required: true },
  interests_match_score: { type: Number, required: true },
  popularity_score: { type: Number, required: true },
  estimated_difficulty: { type: Number, required: true },
  available_spots: { type: Number, required: true },
  start_date: { type: String, required: true },
});

export const VkmModel = mongoose.model<VkmDocument>("Vkm", VkmSchema, "VKMcsv");
