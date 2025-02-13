const mongoose = require('mongoose');
const PostSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    maxlength: 500
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sparks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: {
      type: String,
      required: true,
      maxlength: 300
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  advices: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: {
      type: String,
      required: true,
      maxlength: 500
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  adviceCount: {
    type: Number,
    default: 0
  },
  images: [{
    type: String
  }],
  sparkCount: {
    type: Number,
    default: 0
  },
  commentCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

PostSchema.index({ author: 1, createdAt: -1 });

// Add middleware to auto-update counts
PostSchema.pre('save', function(next) {
  if (this.isModified('sparks')) {
    this.sparkCount = this.sparks.length;
  }
  if (this.isModified('comments')) {
    this.commentCount = this.comments.length;
  }
  next();
});

// Add methods to get counts
PostSchema.methods.getCounts = function() {
  return {
    sparkCount: this.sparkCount,
    commentCount: this.commentCount
  };
};

module.exports = mongoose.model('Post', PostSchema);