import mongoose from 'mongoose';

const MemeSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: false
  },
  topic: {
    type: String,
    required: true
  },
  template: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  realExplanation: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Meme = mongoose.model('Meme', MemeSchema);

export default Meme;
