import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    title: { type: String, required: true, maxlength: 100 },
    description: { type: String, required: true, maxlength: 1000 },
    price: { type: Number, required: true, min: 0 },
    images: [{ type: Object }],
    
    city: String,
    state: String,
    pincode: String,


    location: {
        type: { type: String, default: 'Point' }, 
        coordinates: {
            type: [Number], 
            required: true,
        },
    },

    category: { type: String, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rentedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    available: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});


productSchema.index({ location: '2dsphere' });

export const Product = mongoose.model('Product', productSchema);
