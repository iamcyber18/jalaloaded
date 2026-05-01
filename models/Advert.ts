import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAdvert extends Document {
  title: string;
  imageUrl: string;
  linkUrl: string;
  placement: string;
  isActive: boolean;
  clicks: number;
  impressions: number;
  advertiser: string;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AdvertSchema = new Schema<IAdvert>(
  {
    title: { type: String, required: true },
    imageUrl: { type: String, required: true },
    linkUrl: { type: String, required: true },
    placement: { type: String, default: 'global' },
    isActive: { type: Boolean, default: true },
    clicks: { type: Number, default: 0 },
    impressions: { type: Number, default: 0 },
    advertiser: { type: String, required: true },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { timestamps: true }
);

const Advert: Model<IAdvert> = mongoose.models.Advert || mongoose.model<IAdvert>('Advert', AdvertSchema);

export default Advert;
