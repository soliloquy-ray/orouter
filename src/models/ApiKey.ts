import mongoose, { Document, Schema, Model } from "mongoose";

export interface IApiKey extends Document {
  key: string;
  lastUsed: Date;
  rateLimitedUntil: Date;
}

const apiKeySchema = new Schema<IApiKey>({
  key: { type: String, required: true, unique: true },
  lastUsed: { type: Date, default: Date.now },
  rateLimitedUntil: { type: Date },
});

const ApiKey: Model<IApiKey> =
  mongoose.models.ApiKey || mongoose.model<IApiKey>("ApiKey", apiKeySchema);

export default ApiKey;
