const { createHmac, randomBytes } = require('crypto');
const { Schema,model } = require('mongoose');

const UserSchema = new Schema(
  {
    FullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true, // Convert to lowercase
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
    },
    salt: {
      type: String,
      require:true,
    },
    password: {
      type: String,
      required: true,
    },
    profileImage: {
      type: String,
      
    },
    role: {
      type: String,
      enum: ['USER', 'ADMIN'],
      default: 'USER',
    },
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre('save', function (next) {
  if (!this.isModified('password')) return next();

  const salt = randomBytes(16).toString('hex'); // Fixed encoding
  this.salt = salt;
  this.password = createHmac('sha256', salt)
    .update(this.password)
    .digest('hex');
  next();
});

// Match password and generate token
UserSchema.statics.matchPasswordAndGenerateToken = async function (email, password) {
  const user = await this.findOne({ email });
  if (!user) throw new Error('User Not Found!');

  const userProvidedHash = createHmac('sha256', user.salt)
    .update(password)
    .digest('hex');

  if (user.password !== userProvidedHash) throw new Error('Incorrect Password!');

  const { createTokenForUser } = require('../service/authentication');
  return createTokenForUser(user);
};

module.exports = model('User', UserSchema);
