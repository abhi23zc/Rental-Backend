import app from './src/app.js';
import mongoose from 'mongoose';

const PORT = process.env.PORT || 80;
const MONGODB_URI = process.env.MONGODB_URI;

async function main() {
    await mongoose.connect(MONGODB_URI);
}
main().then(() => console.log('MongoDB connected')).catch(err => console.log(err));

app.listen(PORT, async () => {
    console.log(`Server listening on port ${PORT}`);
});