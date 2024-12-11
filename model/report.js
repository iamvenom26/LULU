const { Schema,model } = require('mongoose');
const reportSchema = new Schema(
    {
      FullName: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
    content:{
        type:String ,
        required:true,
    }
    },
    { timestamps: true }
  );

  module.exports = model('Report',reportSchema);