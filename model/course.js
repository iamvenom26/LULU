const courseSchema = new mongoose.Schema({
  title: String,
  description: String,
  instructor: String,
  rating: Number,
  price: Number,
  discountPrice: Number,
  offerEnds: Date,
  whatYouWillLearn: [String],
  courseContent: [
    {
      sectionTitle: String,
      lessons: [String], n
    },
  ],
});

const Course = mongoose.model('Course', courseSchema);
