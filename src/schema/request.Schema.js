import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const RentalRequestSchema = new Schema({
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ownerName: { type: String },
    userName: { type: String },
    productName: { type: String },
    price: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    message: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date }
});


RentalRequestSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

export const Request = mongoose.model('Request', RentalRequestSchema);
